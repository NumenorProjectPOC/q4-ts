import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { GraphData, NodeData, LinkData } from '../services/types';
import formatStockName from '../utils/utility';

interface GraphComponentProps {
    graphData: GraphData | null;
    selectedElement: NodeData | LinkData | null;
    setSelectedElement: (element: NodeData | LinkData | null) => void;
    sidebarWidth: number;
}

const GraphComponent: React.FC<GraphComponentProps> = ({ graphData, selectedElement, setSelectedElement, sidebarWidth }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [nodeColors, setNodeColors] = useState<Record<string, [string, string]>>({});
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

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

    const nodes: any[] = useMemo(() => {
        if (!graphData) return [];

        return [
            {
                id: graphData.stock.guid,
                name: graphData.stock.name,
                value: graphData.stock.value,
                context: graphData.stock.context,
                isCenter: true,
            },
            ...graphData.related_stocks.map(stock => ({
                id: stock.guid,
                name: stock.name,
                value: stock.value,
                context: stock.context,
                relationship: stock.relationship
            }))
        ];
    }, [graphData]);

    const links: any[] = useMemo(() => {
        if (!graphData) return [];

        return graphData.related_stocks.map(stock => ({
            source: graphData.stock.guid,
            target: stock.guid,
            impact: stock.relationship?.impact || 'neutral',
            weight: stock.relationship?.weight || 0,
            flow: stock.relationship?.flow || 0,
            name: `Influence from ${graphData.stock.name} to ${stock.name}`
        }));
    }, [graphData]);

    useEffect(() => {
        if (!graphData) return;

        // Cyberpunk color palette
        const availableColors: [string, string][] = [
            ['#00FFFF', '#0088FF'], // Cyan to blue
            ['#FF00FF', '#FF0088'], // Magenta to pink
            ['#121212', '#2A2A2A'], // Dark gray gradient
        ];

        const initialNodeColors: Record<string, [string, string]> = {};
        const storedNodeColors = localStorage.getItem('nodeColors');

        if (storedNodeColors) {
            setNodeColors(JSON.parse(storedNodeColors));
        } else {
            nodes.forEach(node => {
                if (node.isCenter) {
                    initialNodeColors[node.id] = ['#1E1E1E', '#3A3A3A']; // Dark center node
                } else {
                    const colorIndex = Math.floor(Math.random() * availableColors.length);
                    initialNodeColors[node.id] = availableColors[colorIndex];
                }
            });

            localStorage.setItem('nodeColors', JSON.stringify(initialNodeColors));
            setNodeColors(initialNodeColors);
        }
    }, [nodes, graphData]);

    useEffect(() => {
        if (!graphData || !svgRef.current || containerDimensions.width === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // Add dark background for cyberpunk feel
        svg.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill", "#0A0A0A");

        // Add subtle grid pattern
        const gridSize = 30;
        const gridOpacity = 0.1;
        const gridGroup = svg.append("g").attr("class", "grid");

        for (let x = 0; x < containerDimensions.width; x += gridSize) {
            gridGroup.append("line")
                .attr("x1", x)
                .attr("y1", 0)
                .attr("x2", x)
                .attr("y2", containerDimensions.height)
                .attr("stroke", "#00FFFF")
                .attr("stroke-width", 0.5)
                .attr("opacity", gridOpacity);
        }

        for (let y = 0; y < containerDimensions.height; y += gridSize) {
            gridGroup.append("line")
                .attr("x1", 0)
                .attr("y1", y)
                .attr("x2", containerDimensions.width)
                .attr("y2", y)
                .attr("stroke", "#00FFFF")
                .attr("stroke-width", 0.5)
                .attr("opacity", gridOpacity);
        }

        const width = containerDimensions.width;
        const height = containerDimensions.height;
        const nodeRadius = 50;
        const centerNodeRadius = 70;

        const topMargin = 20;
        const bottomMargin = 20;
        const leftMargin = 20;
        const rightMargin = 30;

        const nodeBuffer = 5; // Small buffer to prevent visual clipping

        function constrain(x: number, y: number, radius: number) {
            return {
                x: Math.max(radius - nodeBuffer + leftMargin, Math.min(width - radius + nodeBuffer - rightMargin, x)),
                y: Math.max(radius - nodeBuffer + topMargin, Math.min(height - radius + nodeBuffer - bottomMargin, y))
            };
        }

        // Cyberpunk edge colors
        const edgeColor = d3.scaleOrdinal<string>()
            .domain(['positive', 'negative', 'neutral'])
            .range(['#00FFFF', '#FF00FF', '#FFFFFF']);

        const defs = svg.append("defs");

        // Create neon glow filter
        const filter = defs.append("filter")
            .attr("id", "neon-glow")
            .attr("height", "300%")
            .attr("width", "300%")
            .attr("x", "-100%")
            .attr("y", "-100%");
            
        filter.append("feGaussianBlur")
            .attr("stdDeviation", "5")
            .attr("result", "blur");
            
        filter.append("feFlood")
            .attr("flood-color", "#00FFFF")
            .attr("flood-opacity", "0.3")
            .attr("result", "color");
            
        filter.append("feComposite")
            .attr("in", "color")
            .attr("in2", "blur")
            .attr("operator", "in")
            .attr("result", "glow");
            
        filter.append("feMerge")
            .selectAll("feMergeNode")
            .data([null, null])
            .enter()
            .append("feMergeNode")
            .attr("in", (d, i) => i === 0 ? "glow" : "SourceGraphic");

        // Center node gradient
        const centerInnerGradient = defs.append("linearGradient")
            .attr("id", "centerInnerGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%");

        centerInnerGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#3A3A3A");

        centerInnerGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#1E1E1E");

        // Create gradients for each node
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

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(200))
            .force("charge", d3.forceManyBody().strength(-1000))
            .force("center", d3.forceCenter((width - sidebarWidth) / 2, height / 2))
            .force("x", d3.forceX((width - sidebarWidth) / 2).strength(0.1))
            .force("y", d3.forceY(height / 2).strength(0.1));

        // Create links with animated dash effect
        const link = svg.append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke", (d: any) => edgeColor(d.impact))
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 0.8)
            .attr("stroke-dasharray", "5,3")
            .attr("class", "link")
            .style("cursor", "pointer")
            .on("click", (event: any, d: any) => {
                setSelectedElement(d);
            });

        // Create subtle flowing animation for links
        svg.append("style").text(`
            @keyframes dash {
                to {
                    stroke-dashoffset: 8;
                }
            }
            .link {
                animation: dash 1.5s linear infinite;
            }
        `);

        const centerGroup = svg.append("g")
            .selectAll("g")
            .data(nodes.filter((d: any) => d.isCenter))
            .join("g");

        // Outer ring for center node
        centerGroup.append("circle")
            .attr("r", centerNodeRadius + 10)
            .attr("fill", "none")
            .attr("stroke", "#00FFFF")
            .attr("stroke-width", 1)
            .attr("opacity", 0.8)
            .style("filter", "url(#neon-glow)")
            .style("cursor", "pointer")
            .on("click", (event: any, d: any) => {
                setSelectedElement(d);
            });

        // Main center node
        centerGroup.append("circle")
            .attr("r", centerNodeRadius)
            .attr("fill", (d: any) => `url(#nodeGradient-${d.id})`)
            .attr("stroke", "#00FFFF")
            .attr("stroke-width", 2)
            .style("filter", "url(#neon-glow)")
            .style("cursor", "pointer")
            .on("click", (event: any, d: any) => {
                setSelectedElement(d);
            });

        // Inner center node
        centerGroup.append("circle")
            .attr("r", centerNodeRadius - 10)
            .attr("fill", "url(#centerInnerGradient)");

        // Add text to center circle
        centerGroup.each(function (d: any) {
            const group = d3.select(this);

            const roundedValue = Math.round(d.value.value);

            // Display the formatted name
            group.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "1em")
                .attr("class", "node-name")
                .style("font-size", "10px")
                .style("fill", "#FFFFFF")
                .style("font-family", "'Courier New', monospace")
                .style("font-weight", "normal")
                .text(formatStockName(d.name));

            // Display value with cyberpunk styling
            group.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "-0.35em")
                .attr("class", "node-value")
                .style("font-size", "16px")
                .style("fill", "#00FFFF")
                .style("font-family", "'Courier New', monospace")
                .style("font-weight", "bold")
                .text(`${roundedValue}`);
        });

        const nodeGroups = svg.append("g")
            .selectAll("g")
            .data(nodes.filter((d: any) => !d.isCenter))
            .join("g");

        // Regular nodes with neon border
        nodeGroups.append("circle")
            .attr("r", nodeRadius)
            .attr("fill", (d: any) => `url(#nodeGradient-${d.id})`)
            .attr("stroke", (d: any) => {
                // Get first color from node gradient for matching stroke
                return nodeColors[d.id]?.[0] || "#00FFFF";
            })
            .attr("stroke-width", 2)
            .style("filter", "url(#neon-glow)")
            .style("cursor", "pointer")
            .on("click", (event: any, d: any) => {
                setSelectedElement(d);
            });

        // Add thin ring around nodes
        nodeGroups.append("circle")
            .attr("r", nodeRadius + 5)
            .attr("fill", "none")
            .attr("stroke", (d: any) => {
                return nodeColors[d.id]?.[0] || "#00FFFF";
            })
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.5);

        nodeGroups.each(function (d: any) {
            const group = d3.select(this);

            const roundedValue = Math.round(d.value.value);

            // Display the formatted name
            group.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "1em")
                .attr("class", "node-name")
                .style("font-size", "10px")
                .style("fill", "#FFFFFF")
                .style("font-family", "'Courier New', monospace")
                .style("font-weight", "normal")
                .text(formatStockName(d.name));

            // Value
            group.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "-0.35em")
                .attr("class", "node-value")
                .style("font-size", "16px")
                .style("fill", (d: any) => {
                    // Match text color to node color for cyberpunk effect
                    return nodeColors[d.id]?.[0] || "#00FFFF";
                })
                .style("font-family", "'Courier New', monospace")
                .style("font-weight", "bold")
                .text(`${roundedValue}`);
        });

        function dragstarted(event: any, d: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event: any, d: any) {
            const nodeR = d.isCenter ? centerNodeRadius : nodeRadius;
            const constrained = constrain(event.x, event.y, nodeR);
            d.fx = constrained.x;
            d.fy = constrained.y;
        }

        function dragended(event: any, d: any) {
            if (!event.active) simulation.alphaTarget(0);

            // Ensure node stays within bounds even after drag ends
            const nodeR = d.isCenter ? centerNodeRadius : nodeRadius;
            const constrained = constrain(event.x, event.y, nodeR);
            d.fx = constrained.x;
            d.fy = constrained.y;

            // Save positions to localStorage
            const nodePositions: Record<string, { x: number, y: number }> = {};
            nodes.forEach(node => {
                if (node.fx !== undefined && node.fy !== undefined) {
                    nodePositions[node.id] = { x: node.fx, y: node.fy };
                }
            });
            localStorage.setItem('nodePositions', JSON.stringify(nodePositions));
        }

        nodeGroups.call(d3.drag<any, any>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended) as any);

        centerGroup.call(d3.drag<any, any>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended) as any);

        // Load saved positions if available
        const storedNodePositions = localStorage.getItem('nodePositions');
        if (storedNodePositions) {
            const parsedPositions = JSON.parse(storedNodePositions);
            nodes.forEach(node => {
                const storedPosition = parsedPositions[node.id];
                if (storedPosition) {
                    // Make sure loaded positions respect current bounds
                    const nodeR = node.isCenter ? centerNodeRadius : nodeRadius;
                    const constrained = constrain(storedPosition.x, storedPosition.y, nodeR);
                    node.fx = constrained.x;
                    node.fy = constrained.y;
                }
            });
        }

        simulation.on("tick", () => {
            nodeGroups.attr("transform", (d: any) => {
                // Apply constraints on each tick
                const constrained = constrain(d.x, d.y, nodeRadius);
                d.x = constrained.x;
                d.y = constrained.y;
                return `translate(${d.x},${d.y})`;
            });

            centerGroup.attr("transform", (d: any) => {
                // Apply constraints on each tick
                const constrained = constrain(d.x, d.y, centerNodeRadius);
                d.x = constrained.x;
                d.y = constrained.y;
                return `translate(${d.x},${d.y})`;
            });

            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);
        });

    }, [graphData, nodeColors, links, setSelectedElement, nodes, containerDimensions, sidebarWidth]);

    // Use a container div to measure available space
    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <svg ref={svgRef} width="100%" height="100%"></svg>
        </div>
    );
}

export default GraphComponent;