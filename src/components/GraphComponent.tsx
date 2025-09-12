//GraphComponent(child):
import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { GraphData, NodeData, LinkData, Relationship } from '../services/types';
import { formatLargeNumber, formatStockName } from '../utils/utility';
import LoadingScreen from './ui/LoadingScreen';
import { Loader, RotateCcw } from 'lucide-react';

interface GraphComponentProps {
    graphData: GraphData | null;
    selectedElement: NodeData | LinkData | null;
    setSelectedElement: (element: NodeData | LinkData | null) => void;
    sidebarWidth: number;
    nodeValueChangeCallback: (nodeId: string, newValue: number) => void;
    simulationSettings: { value: number, timeUnit: string };
    simulationValue: number;
    runSimulation: boolean;
    isLoading: boolean
}

const GraphComponent: React.FC<GraphComponentProps> = ({
    isLoading,
    graphData,
    selectedElement,
    setSelectedElement,
    sidebarWidth,
    nodeValueChangeCallback,
    simulationSettings,
    simulationValue,
    runSimulation
}) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [nodeColors, setNodeColors] = useState<Record<string, string>>({});
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
    const [initialRender, setInitialRender] = useState(true);
    const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform | null>(null);

    // Zoom behavior ref
    const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const simulationRef = useRef<d3.Simulation<NodeData, any> | null>(null);

    // Calculate container dimensions and observe changes
    useEffect(() => {
        if (!containerRef.current) return;

        const updateDimensions = () => {
            if (!containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();
            setContainerDimensions({
                width: containerRect.width,
                height: containerRect.height
            });
        };

        updateDimensions();

        const resizeObserver = new ResizeObserver(updateDimensions);
        resizeObserver.observe(containerRef.current);

        return () => {
            if (containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
            resizeObserver.disconnect();
        };
    }, []);

    const nodes: NodeData[] = useMemo(() => {
        if (!graphData) return [];

        return graphData.nodes.map((node) => ({
            ...node,
            isCenter: node.id === graphData.stock.guid
        }));
    }, [graphData]);

    // At top, just below imports
    function getFontSize(text: string, radius: number, maxFont: number, minFont: number) {
        const size = Math.floor((radius * 2) / Math.max(text.length, 1) * 1.2)+5;
        return `${Math.max(minFont, Math.min(maxFont, size))}px`;
    }

    // This hook is updated to correctly process the pre-structured edges from the API.
    const links = useMemo(() => {
        if (!graphData || !graphData.edges || !graphData.nodes) {
            return [];
        }

        // Create a lookup map from node name to node ID for efficient linking.
        const nameToIdMap = new Map<string, string>();
        graphData.nodes.forEach(node => {
            nameToIdMap.set(node.name, node.id);
        });

        // The edges are already processed for bidirectionality.
        const d3Links = graphData.edges.map(edge => {
            if (!edge.relationshipList || edge.relationshipList.length === 0) {
                console.warn("Edge object has no relationships:", edge);
                return null;
            }

            // Get source and target names from the first relationship in the list.
            const firstRelationship = edge.relationshipList[0];
            const sourceName = firstRelationship.fromName;
            const targetName = firstRelationship.toName;
            
            // Look up the corresponding node IDs.
            const sourceId = nameToIdMap.get(sourceName);
            const targetId = nameToIdMap.get(targetName);

            // If IDs are not found, we cannot create the link.
            if (!sourceId || !targetId) {
                console.warn(`Could not find node IDs for link between "${sourceName}" and "${targetName}"`);
                return null;
            }
            
            // Return the link object with all original data plus the source/target IDs for D3.
            return {
                ...edge,
                source: sourceId,
                target: targetId,
            };
        });

        // Filter out any links that could not be created.
        return d3Links.filter(link => link !== null) as (LinkData & { source: string, target: string })[];

    }, [graphData]);
    const centerColor = '#FF9999';
    const labelColor = '#1F2937';

    // Updated node colors with light shades
    useEffect(() => {
        if (!graphData || !nodes.length) return;

        // Light color palette with red, cream, peach, brown, grey shades
        const lightColors: string[] = [
            '#FFB3BA', // Pastel Red
            '#FFDFBA', // Pastel Peach
            '#FFFFBA', // Pastel Yellow
            '#BAFFC9', // Pastel Green
            '#BAE1FF', // Pastel Blue
            '#E0BBE4', // Pastel Lavender
            '#FFDAC1', // Pastel Cream
            '#C7CEEA', // Pastel Periwinkle
            '#F4E1D2', // Pastel Beige
            '#D5E8D4', // Pastel Mint
            '#FFE4E1', // Misty Rose
            '#E8E9F3', // Light Grey-Blue
            '#F0F0F0', // Light Grey
            '#FCE1E4', // Pastel Pink
            '#E8DFE0', // Pastel Mauve
            '#FFF5E1', // Pastel Ivory
        ];

        const newNodeColors: Record<string, string> = {};

        nodes.forEach((node, index) => {
            if (node.isCenter) {
                // Center node gets a slightly darker red for emphasis
                newNodeColors[node.id] = '#FF9999';
            } else {
                // Use light colors for other nodes
                const colorIndex = index % lightColors.length;
                newNodeColors[node.id] = lightColors[colorIndex];
            }
        });

        setNodeColors(newNodeColors);
        
        // Store colors in session storage
        sessionStorage.setItem('nodeColors', JSON.stringify(newNodeColors));
    }, [nodes, graphData]);

    // Main rendering effect
    useEffect(() => {
        if (!graphData || !svgRef.current || containerDimensions.width === 0 || links.length === 0) return;

        if (simulationRef.current) {
            const previousNodes = simulationRef.current.nodes();
            const nodePositionMap = new Map(previousNodes.map(node => [node.id, { x: node.x, y: node.y, vx: node?.vx, vy: node?.vy, fx: node.fx, fy: node.fy }]));
            
            nodes.forEach(node => {
                if (nodePositionMap.has(node.id)) {
                    const pos = nodePositionMap.get(node.id)!;
                    Object.assign(node, pos);
                }
            });
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = containerDimensions.width;
        const height = containerDimensions.height;
        
        // Standard node sizes
        const nodeRadius = 40; 
        const centerNodeRadius = 50; 

        // Create zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                const transform = event.transform;
                setZoomTransform(transform);
                g.attr("transform", transform);
            });

        zoomBehaviorRef.current = zoom;
        svg.call(zoom);

        // Create main group for all elements
        const g = svg.append("g");

        // Edge colors matching theme
        const edgeColor = d3.scaleOrdinal<string>()
            .domain(['positive', 'negative', 'neutral'])
            .range(['#10B981', '#EF4444', '#9CA3AF']); // Green, Red, Gray
        
        const defs = svg.append("defs");
        const impacts = ['positive', 'negative', 'neutral'];
        impacts.forEach(impact => {
            const color = edgeColor(impact);

            // Arrow markers with better styling
            defs.append("marker")
                .attr("id", `arrowhead-${impact}`)
                .attr("viewBox", "-2 -8 12 16")
                .attr("refX", 8)
                .attr("refY", 0)
                .attr("orient", "auto")
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("markerUnits", "strokeWidth")
                .append("path")
                .attr("d", "M 0,-6 L 10,0 L 0,6 Z")
                .attr("fill", color)
                .attr("stroke", color)
                .attr("stroke-width", 1);

            defs.append("marker")
                .attr("id", `arrowhead-start-${impact}`)
                .attr("viewBox", "-2 -8 12 16")
                .attr("refX", 2)
                .attr("refY", 0)
                .attr("orient", "auto")
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("markerUnits", "strokeWidth")
                .append("path")
                .attr("d", "M 10,-6 L 0,0 L 10,6 Z")
                .attr("fill", color)
                .attr("stroke", color)
                .attr("stroke-width", 1);
        });

        // Create subtle drop shadow filter
        const filter = defs.append("filter")
            .attr("id", "drop-shadow")
            .attr("x", "-50%")
            .attr("y", "-50%")
            .attr("width", "200%")
            .attr("height", "200%");

        filter.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 3);

        filter.append("feOffset")
            .attr("dx", 0)
            .attr("dy", 2)
            .attr("result", "offsetblur");

        const feComponentTransfer = filter.append("feComponentTransfer");
        feComponentTransfer.append("feFuncA")
            .attr("type", "linear")
            .attr("slope", 0.2);

        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode");
        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");

        // Load saved positions
        const storedNodePositions = sessionStorage.getItem('nodePositions');
        let initialPositions: Record<string, { x: number; y: number }> = {};
        if (storedNodePositions) {
            try {
                initialPositions = JSON.parse(storedNodePositions);
            } catch (error) {
                console.error("Error parsing node positions:", error);
            }
        }

        // Load saved zoom transform
        const storedZoomTransform = sessionStorage.getItem('zoomTransform');
        if (storedZoomTransform && !zoomTransform) {
            try {
                const savedTransform = JSON.parse(storedZoomTransform);
                const transform = d3.zoomIdentity
                    .translate(savedTransform.x, savedTransform.y)
                    .scale(savedTransform.k);
                svg.call(zoom.transform, transform);
            } catch (error) {
                console.error("Error parsing zoom transform:", error);
            }
        }

        // Initialize node positions
        nodes.forEach(node => {
            if (initialPositions[node.id]) {
                node.x = initialPositions[node.id].x;
                node.y = initialPositions[node.id].y;
                node.fx = initialPositions[node.id].x;
                node.fy = initialPositions[node.id].y;
            } else {
                if (node.isCenter) {
                    node.x = width / 2;
                    node.y = height / 2;
                } else {
                    const angleStep = (2 * Math.PI) / (nodes.length - 1);
                    const nodeIndex = nodes.filter(n => !n.isCenter).indexOf(node);
                    const angle = nodeIndex * angleStep;
                    const radius = Math.min(width, height) * 0.3;
                    node.x = (width / 2) + Math.cos(angle) * radius;
                    node.y = (height / 2) + Math.sin(angle) * radius;
                }
            }
        });

        // Create simulation
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(180).strength(0.2))
            .force("charge", d3.forceManyBody().strength(-600))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide((d: any) => (d.isCenter ? centerNodeRadius : nodeRadius) + 10))
            .alphaDecay(0.02)
            .velocityDecay(0.4);

        simulationRef.current = simulation;

        // Create links
        const link = g.append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke", (d: any) => edgeColor(d.relationshipList?.[0]?.impact))
            .attr("stroke-width", 2)
            .attr("opacity", 0.7)
            .attr("class", "link")
            .style("cursor", "pointer")
            .attr("marker-end", (d: any) => {
                const impact = d.relationshipList?.[0]?.impact || 'neutral';
                return `url(#arrowhead-${impact})`;
            })
            .attr("marker-start", (d: any) => {
                if (d.isBidirectional) {
                    const impact = d.relationshipList?.[1]?.impact || d.relationshipList?.[0]?.impact || 'neutral';
                    return `url(#arrowhead-start-${impact})`;
                }
                return null;
            })
            .on("click", (event: any, d: any) => {
                event.stopPropagation();
                setSelectedElement({
                    ...d,
                    relationshipList: d.relationshipList ?? [],
                    isBidirectional: d.isBidirectional ?? false
                });
            });

        // Create center nodes with filled colors
        const centerGroup = g.append("g")
            .selectAll("g")
            .data(nodes.filter((d: any) => d.isCenter))
            .join("g")
            .style("cursor", "pointer");

        // Center node filled circle
        centerGroup.append("circle")
            .attr("r", centerNodeRadius)
            .attr("fill", (d: any) => nodeColors[d.id])
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 3)
            .style("filter", "url(#drop-shadow)")
            .attr("opacity", 0.9);

        // Center node border ring
        centerGroup.append("circle")
            .attr("r", centerNodeRadius)
            .attr("fill", "none")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2)
            .attr("opacity", 0.8);

        // Make entire center node clickable
        centerGroup.append("circle")
            .attr("r", centerNodeRadius)
            .attr("fill", "transparent")
            .style("cursor", "pointer")
            .on("click", (event: any, d: any) => {
                event.stopPropagation();
                setSelectedElement(d);
            });

        // Center node text
        centerGroup.each(function(d: any) {
            const group = d3.select(this);
            const name = formatStockName(d.name);
            const valueText = formatLargeNumber(
              (animatedValues[d.id] ?? d.value.value) | 0
            );
          
            // Node name
            group.append("text")
              .attr("text-anchor", "middle")
              .attr("dy", d.isCenter ? "-0.5em" : "-0.6em")
              .attr("class", "node-name")
              .style("font-family", "system-ui, -apple-system, sans-serif")
              .style("fill", labelColor)
              .style("font-weight", "600")
              .style("font-size", getFontSize(name, centerNodeRadius - 8, 14, 8))
              .text(name);
          
            // Node value
            group.append("text")
              .attr("text-anchor", "middle")
              .attr("dy", "0.6em")
              .attr("class", "node-value")
              .style("font-family", "system-ui, -apple-system, sans-serif")
              .style("fill", labelColor)
              .style("font-weight", "700")
              .style("font-size", getFontSize(valueText, centerNodeRadius - 8, 16, 10))
              .text(valueText)
              .append("title")
              .text(`${valueText} ${d.value.unit}`);
          });
          

        // Create regular nodes with filled colors
        const nodeGroups = g.append("g")
            .selectAll("g")
            .data(nodes.filter((d: any) => !d.isCenter))
            .join("g")
            .style("cursor", "pointer");

        // Regular node filled circle
        nodeGroups.append("circle")
            .attr("r", nodeRadius)
            .attr("fill", (d: any) => nodeColors[d.id])
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2.5)
            .style("filter", "url(#drop-shadow)")
            .attr("opacity", (d: any) => d.isSecondary ? 0.8 : 0.9);

        // Regular node border ring
        nodeGroups.append("circle")
            .attr("r", nodeRadius)
            .attr("fill", "none")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.7);

        // Make entire regular node clickable
        nodeGroups.append("circle")
            .attr("r", nodeRadius)
            .attr("fill", "transparent")
            .style("cursor", "pointer")
            .on("click", (event: any, d: any) => {
                event.stopPropagation();
                setSelectedElement(d);
            });

        // Regular node text
        nodeGroups.each(function(d: any) {
            const group = d3.select(this);
            const name = formatStockName(d.name);
            const valueText = formatLargeNumber(
              (animatedValues[d.id] ?? d.value.value) | 0
            );
          
            group.append("text")
              .attr("text-anchor", "middle")
              .attr("dy", "-0.4em")
              .attr("class", "node-name")
              .style("font-family", "system-ui, -apple-system, sans-serif")
              .style("fill", labelColor)
              .style("font-weight", "600")
              .style("font-size", getFontSize(name, nodeRadius - 6, 12, 6))
              .text(name);
          
            group.append("text")
              .attr("text-anchor", "middle")
              .attr("dy", "0.5em")
              .attr("class", "node-value")
              .style("font-family", "system-ui, -apple-system, sans-serif")
              .style("fill", labelColor)
              .style("font-weight", "700")
              .style("font-size", getFontSize(valueText, nodeRadius - 6, 14, 8))
              .text(valueText)
              .append("title")
              .text(`${valueText} ${d.value.unit}`);
          });
          

        // Add hover effects
        nodeGroups.on("mouseenter", function(event: any, d: any) {
            d3.select(this).select("circle:first-child")
                .transition()
                .duration(200)
                .attr("stroke-width", 4)
                .attr("r", nodeRadius + 3)
                .attr("opacity", 1);
        }).on("mouseleave", function(event: any, d: any) {
            d3.select(this).select("circle:first-child")
                .transition()
                .duration(200)
                .attr("stroke-width", 2.5)
                .attr("r", nodeRadius)
                .attr("opacity", (d: any) => d.isSecondary ? 0.8 : 0.9);
        });

        centerGroup.on("mouseenter", function(event: any, d: any) {
            d3.select(this).select("circle:first-child")
                .transition()
                .duration(200)
                .attr("stroke-width", 4)
                .attr("r", centerNodeRadius + 3)
                .attr("opacity", 1);
        }).on("mouseleave", function(event: any, d: any) {
            d3.select(this).select("circle:first-child")
                .transition()
                .duration(200)
                .attr("stroke-width", 3)
                .attr("r", centerNodeRadius)
                .attr("opacity", 0.9);
        });

        // Drag behavior
        const drag = d3.drag<any, any>()
            .on("start", (event: any, d: any) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event: any, d: any) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event: any, d: any) => {
                if (!event.active) simulation.alphaTarget(0);
                const nodePositions: Record<string, { x: number, y: number }> = JSON.parse(sessionStorage.getItem('nodePositions') || '{}');
                nodePositions[d.id] = { x: d.fx, y: d.fy };
                sessionStorage.setItem('nodePositions', JSON.stringify(nodePositions));
            });

        // Apply drag to all node groups
        nodeGroups.call(drag as any);
        centerGroup.call(drag as any);

        // Simulation tick with smooth edges
        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance === 0) return d.source.x;
                    const sourceRadius = d.source.isCenter ? centerNodeRadius + 2 : nodeRadius + 2;
                    const offsetX = (dx / distance) * sourceRadius;
                    return d.source.x + offsetX;
                })
                .attr("y1", (d: any) => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance === 0) return d.source.y;
                    const sourceRadius = d.source.isCenter ? centerNodeRadius + 2 : nodeRadius + 2;
                    const offsetY = (dy / distance) * sourceRadius;
                    return d.source.y + offsetY;
                })
                .attr("x2", (d: any) => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance === 0) return d.target.x;
                    const targetRadius = d.target.isCenter ? centerNodeRadius + 2 : nodeRadius + 2;
                    const offsetX = (dx / distance) * targetRadius;
                    return d.target.x - offsetX;
                })
                .attr("y2", (d: any) => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance === 0) return d.target.y;
                    const targetRadius = d.target.isCenter ? centerNodeRadius + 2 : nodeRadius + 2;
                    const offsetY = (dy / distance) * targetRadius;
                    return d.target.y - offsetY;
                });

            nodeGroups.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
            centerGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        });

        // Save zoom transform on zoom events
        zoom.on("zoom", (event) => {
            const transform = event.transform;
            setZoomTransform(transform);
            g.attr("transform", transform);
            sessionStorage.setItem('zoomTransform', JSON.stringify({ x: transform.x, y: transform.y, k: transform.k }));
        });

        // Stop simulation after initial layout
        setTimeout(() => {
            simulation.stop();
        }, 3000);

        return () => {
            simulation.stop();
        };

    }, [graphData, nodeColors, links, setSelectedElement, nodes, containerDimensions, animatedValues]);

    // Handle simulation animation
    useEffect(() => {
        if (initialRender) {
            setInitialRender(false);
            return;
        }

        if (!graphData || !runSimulation) return;

        const startValues = nodes.reduce((acc, node) => {
            acc[node.id] = node.value.value;
            return acc;
        }, {} as Record<string, number>);

        let yearEquivalent = 0;
        switch (simulationSettings.timeUnit) {
            case "days": yearEquivalent = simulationValue / 365; break;
            case "weeks": yearEquivalent = simulationValue / 52; break;
            case "months": yearEquivalent = simulationValue / 12; break;
            case "years": yearEquivalent = simulationValue; break;
        }

        const targetValues = nodes.reduce((acc, node) => {
            const growthFactor = 0.02; // Example growth factor
            acc[node.id] = node.value.value * Math.pow(1 + growthFactor, yearEquivalent);
            return acc;
        }, {} as Record<string, number>);

        const startTime = performance.now();
        const duration = 2000;

        const animate = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const newValues = nodes.reduce((acc, node) => {
                acc[node.id] = startValues[node.id] + (targetValues[node.id] - startValues[node.id]) * progress;
                return acc;
            }, {} as Record<string, number>);
            setAnimatedValues(newValues);
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [runSimulation, graphData, nodes, simulationValue, simulationSettings, initialRender]);

    // Update node values when animation changes
    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll(".node-value")
            .text((d: any) => {
                const animatedValue = animatedValues[d.id];
                const roundedValue = animatedValue !== undefined ? Math.round(animatedValue) : Math.round(d.value.value);
                return formatLargeNumber(roundedValue);
            })
            .select("title")
            .text((d: any) => {
                const animatedValue = animatedValues[d.id];
                const roundedValue = animatedValue !== undefined ? Math.round(animatedValue) : Math.round(d.value.value);
                return `${roundedValue} ${d.value.unit}`;
            });
    }, [animatedValues]);

    // Reset zoom function
    const resetZoom = () => {
        if (svgRef.current && zoomBehaviorRef.current) {
            const svg = d3.select(svgRef.current);
            svg.transition().duration(750).call(
                zoomBehaviorRef.current.transform,
                d3.zoomIdentity
            );
            sessionStorage.removeItem('zoomTransform');
        }
    };

    return (
        <div
            ref={containerRef}
            style={{ width: "100%", height: "100%", position: "relative", backgroundColor: "#FAFAFA" }}
        >
            {isLoading && (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <Loader className="w-10 h-10 animate-spin text-brand-red-600" />
                  <p className="text-brand-gray-600 font-extrabold animate-pulse">Loading Visualization...</p>
                </div>
              )}
            {!isLoading && (
                <>
                    <div className="absolute inset-0">
                        <svg
                            ref={svgRef}
                            width="100%"
                            height="100%"
                            style={{ cursor: "grab" }}
                            onMouseDown={(e) => { if (e.target === svgRef.current) (e.target as SVGElement).style.cursor = "pointer"; }}
                            onMouseUp={(e) => { (e.target as SVGElement).style.cursor = "grab"; }}
                        />
                    </div>
                    {/* Clean Reset Zoom Button */}
                    <div className="absolute top-6 right-6 z-10">
                        <button
                            onClick={resetZoom}
                            className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 shadow-md text-gray-600 transition-all duration-200 hover:shadow-lg group"
                            title="Reset Zoom"
                        >
                            <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default React.memo(GraphComponent);
