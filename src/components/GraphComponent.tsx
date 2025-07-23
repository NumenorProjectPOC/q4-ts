import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { GraphData, NodeData, LinkData, Relationship } from '../services/types'; // Assuming Relationship is exported
import { formatLargeNumber, formatStockName } from '../utils/utility';
import LoadingScreen from './ui/LoadingScreen';

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
    const [nodeColors, setNodeColors] = useState<Record<string, [string, string]>>({});
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
    const [initialRender, setInitialRender] = useState(true);
    const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform | null>(null);

    // Zoom behavior ref
    const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const simulationRef = useRef<d3.Simulation<NodeData, any> | null>(null); // Use 'any' for links due to dynamic props

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

    // *** MODIFIED SECTION START ***
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
        // We just need to add the `source` and `target` IDs that D3 requires.
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
    // *** MODIFIED SECTION END ***

    // Initialize node colors
    useEffect(() => {
        if (!graphData) return;

        const availableColors: [string, string][] = [
            ['#B0E2FF', d3.color('#B0E2FF')!.darker(0.9).toString()],
            ['#FFDAB9', d3.color('#FFDAB9')!.darker(0.9).toString()],
            ['#E6E6FA', d3.color('#E6E6FA')!.darker(0.9).toString()],
            ['#E6FFE6', d3.color('#E6FFE6')!.darker(0.9).toString()],
            ['#B2DFDB', d3.color('#B2DFDB')!.darker(0.9).toString()],
            ['#FFE4E1', d3.color('#FFE4E1')!.darker(0.9).toString()],
        ];

        let initialNodeColors: Record<string, [string, string]> = {};
        const storedNodeColors = sessionStorage.getItem('nodeColors');

        if (storedNodeColors) {
            try {
                initialNodeColors = JSON.parse(storedNodeColors);
            } catch (error) {
                console.error("Error parsing node colors from session storage:", error);
                initialNodeColors = {};
            }
        }

        // Assign colors if not found in session storage
        if (Object.keys(initialNodeColors).length === 0) {
            nodes.forEach(node => {
                if (node.isCenter) {
                    initialNodeColors[node.id] = ['#6A958F', d3.color('#6A958F')!.darker(0.7).toString()];
                } else {
                    const colorIndex = Math.floor(Math.random() * availableColors.length);
                    initialNodeColors[node.id] = availableColors[colorIndex];
                }
            });

            sessionStorage.setItem('nodeColors', JSON.stringify(initialNodeColors));
        } else {
            // Ensure all nodes have colors
            nodes.forEach(node => {
                if (!initialNodeColors[node.id]) {
                    if (node.isCenter) {
                        initialNodeColors[node.id] = ['#6A958F', d3.color('#6A958F')!.darker(0.7).toString()];
                    } else {
                        const colorIndex = Math.floor(Math.random() * availableColors.length);
                        initialNodeColors[node.id] = availableColors[colorIndex];
                    }
                }
            });
        }

        setNodeColors(initialNodeColors);
    }, [nodes, graphData]);

    // Main rendering effect
    useEffect(() => {
        if (!graphData || !svgRef.current || containerDimensions.width === 0 || links.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = containerDimensions.width;
        const height = containerDimensions.height;
        const nodeRadius = 50;
        const centerNodeRadius = 70;

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

        // Define gradients and markers
        const edgeColor = d3.scaleOrdinal<string>()
        .domain(['positive', 'negative', 'neutral'])
            .range(['#6A958F', '#DC143C', '#888']);
        
        const defs = svg.append("defs");
        const impacts = ['positive', 'negative', 'neutral'];
        impacts.forEach(impact => {
            const color = edgeColor(impact);

            // End arrow for each impact type
            defs.append("marker")
                .attr("id", `arrowhead-${impact}`)
                .attr("viewBox", "-2 -8 12 16")
                .attr("refX", 8)
                .attr("refY", 0)
                .attr("orient", "auto")
                .attr("markerWidth", 5)
                .attr("markerHeight", 5)
                .attr("markerUnits", "strokeWidth")
                .append("svg:path")
                .attr("d", "M 0,-6 L 10,0 L 0,6 Z")
                .attr("fill", color)
                .attr("stroke", color)
                .attr("stroke-width", 1);

            // Start arrow for each impact type
            defs.append("marker")
                .attr("id", `arrowhead-start-${impact}`)
                .attr("viewBox", "-2 -8 12 16")
                .attr("refX", 2)
                .attr("refY", 0)
                .attr("orient", "auto")
                .attr("markerWidth", 5)
                .attr("markerHeight", 5)
                .attr("markerUnits", "strokeWidth")
                .append("svg:path")
                .attr("d", "M 10,-6 L 0,0 L 10,6 Z")
                .attr("fill", color)
                .attr("stroke", color)
                .attr("stroke-width", 1);
        });

        const centerInnerGradient = defs.append("linearGradient")
            .attr("id", "centerInnerGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%");

        centerInnerGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#B8D7D9");

        centerInnerGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#F5D6D6");

        Object.entries(nodeColors).forEach(([key, [colorStart, colorEnd]]) => {
            const gradient = defs.append("linearGradient")
                .attr("id", `nodeGradient-${key}`)
                .attr("x1", "0%")
                .attr("y1", "0%")
                .attr("x2", "100%")
                .attr("y2", "100%");

            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", colorStart);

            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", colorEnd);
        });

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
                const centerNode = nodes.find(n => n.isCenter);
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

        // Create simulation with better forces
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(200).strength(0.3))
            .force("charge", d3.forceManyBody().strength(-800))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide((d: any) => (d.isCenter ? centerNodeRadius : nodeRadius) + 10))
            .alphaDecay(0.02)
            .velocityDecay(0.3);

        simulationRef.current = simulation;

        // Create links
        const link = g.append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke", (d: any) => edgeColor(d.relationshipList?.[0]?.impact))
            .attr("stroke-width", 3)
            .attr("opacity", 0.8)
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

        // Create center nodes
        const centerGroup = g.append("g")
            .selectAll("g")
            .data(nodes.filter((d: any) => d.isCenter))
            .join("g")
            .style("cursor", "pointer");

        centerGroup.append("circle")
            .attr("r", centerNodeRadius + 10)
            .attr("fill", (d: any) => `url(#nodeGradient-${d.id})`)
            .style("filter", "drop-shadow(0px 0px 10px rgba(106, 149, 143, 0.5))")
            .on("click", (event: any, d: any) => {
                event.stopPropagation();
                setSelectedElement(d);
            });

        centerGroup.append("circle")
            .attr("r", centerNodeRadius - 10)
            .attr("fill", "url(#centerInnerGradient)");

        // Add text to center nodes
        centerGroup.each(function (d: any) {
            const group = d3.select(this);
            const animatedValue = animatedValues[d.id];
            const roundedValue = animatedValue !== undefined ? Math.round(animatedValue) : Math.round(d.value.value);

            group.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "1em")
                .attr("class", "node-name")
                .style("font-size", "10px")
                .style("fill", "#2C3333")
                .style("font-weight", "normal")
                .text(formatStockName(d.name));

            group.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "-0.35em")
                .attr("class", "node-value")
                .style("font-size", "16px")
                .style("fill", "#2C3333")
                .style("font-weight", "bold")
                .text(formatLargeNumber(roundedValue))
                .append("title")
                .text(`${roundedValue} ${d.value.unit}`);
        });

        // Create regular nodes
        const nodeGroups = g.append("g")
            .selectAll("g")
            .data(nodes.filter((d: any) => !d.isCenter))
            .join("g")
            .style("cursor", "pointer");

        nodeGroups.append("circle")
            .attr("r", nodeRadius)
            .attr("fill", (d: any) => `url(#nodeGradient-${d.id})`)
            .style("filter", (d: any) => `drop-shadow(0px 0px 10px ${nodeColors[d.id]?.[0]})`)
            .attr("opacity", (d: any) => d.isSecondary ? 0.5 : 1)
            .on("click", (event: any, d: any) => {
                event.stopPropagation();
                setSelectedElement(d);
            });

        // Add text to regular nodes
        nodeGroups.each(function (d: any) {
            const group = d3.select(this);
            const animatedValue = animatedValues[d.id];
            const roundedValue = animatedValue !== undefined ? Math.round(animatedValue) : Math.round(d.value.value);

            group.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "1em")
                .attr("class", "node-name")
                .style("font-size", "10px")
                .style("fill", "#2C3333")
                .style("font-weight", "normal")
                .text(formatStockName(d.name));

            group.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "-0.35em")
                .attr("class", "node-value")
                .style("font-size", "16px")
                .style("fill", "#2C3333")
                .style("font-weight", "bold")
                .text(formatLargeNumber(roundedValue))
                .append("title")
                .text(`${roundedValue} ${d.value.unit}`);
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

        // Simulation tick
        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance === 0) return d.source.x;
                    const sourceRadius = d.source.isCenter ? centerNodeRadius + 10 : nodeRadius;
                    const offsetX = (dx / distance) * sourceRadius;
                    return d.source.x + offsetX;
                })
                .attr("y1", (d: any) => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance === 0) return d.source.y;
                    const sourceRadius = d.source.isCenter ? centerNodeRadius + 10 : nodeRadius;
                    const offsetY = (dy / distance) * sourceRadius;
                    return d.source.y + offsetY;
                })
                .attr("x2", (d: any) => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance === 0) return d.target.x;
                    const targetRadius = d.target.isCenter ? centerNodeRadius + 10 : nodeRadius;
                    const offsetX = (dx / distance) * targetRadius;
                    return d.target.x - offsetX;
                })
                .attr("y2", (d: any) => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance === 0) return d.target.y;
                    const targetRadius = d.target.isCenter ? centerNodeRadius + 10 : nodeRadius;
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

    }, [graphData, nodeColors, links, setSelectedElement, nodes, containerDimensions, sidebarWidth, animatedValues]);

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
            style={{ width: "100%", height: "100%", position: "relative", backgroundColor: "#f8f9fa" }}
        >
            {isLoading && <LoadingScreen message="Loading visualization..." fullscreen={false} />}
            {!isLoading && (
                <>
                    <div className="absolute inset-0">
                        <svg
                            ref={svgRef}
                            width="100%"
                            height="100%"
                            style={{ cursor: "grab" }}
                            onMouseDown={(e) => { if (e.target === svgRef.current) (e.target as SVGElement).style.cursor = "grabbing"; }}
                            onMouseUp={(e) => { (e.target as SVGElement).style.cursor = "grab"; }}
                        />
                    </div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-row justify-center items-center gap-2 z-10">
                        <button
                            onClick={() => { if (svgRef.current && zoomBehaviorRef.current) d3.select(svgRef.current).transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 1.5); }}
                            className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-lg text-lg font-semibold"
                            title="Zoom In"
                        >+</button>
                        <button
                            onClick={() => { if (svgRef.current && zoomBehaviorRef.current) d3.select(svgRef.current).transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 0.67); }}
                            className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-lg text-lg font-semibold"
                            title="Zoom Out"
                        >-</button>
                        <button
                            onClick={resetZoom}
                            className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-lg text-sm"
                            title="Reset Zoom"
                        >⌂</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default React.memo(GraphComponent);