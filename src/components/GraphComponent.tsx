import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { GraphData, NodeData, LinkData } from '../services/types';
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

const GraphComponent: React.FC<GraphComponentProps> = ({ isLoading, graphData, selectedElement, setSelectedElement, sidebarWidth, nodeValueChangeCallback, simulationSettings, simulationValue, runSimulation }) => {
    
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [nodeColors, setNodeColors] = useState<Record<string, [string, string]>>({});
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
    const [initialRender, setInitialRender] = useState(true);

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

        const primaryNodes = [
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

        // Add secondary related stocks with faded styling
        const secondaryNodes = graphData.related_stocks.flatMap(stock => {
            if (stock.related_stocks) {
                return stock.related_stocks.map(secondaryStock => ({
                    id: secondaryStock.guid,
                    name: secondaryStock.name,
                    value: secondaryStock.value,
                    context: secondaryStock.context,
                    relationship: secondaryStock.relationship,
                    isSecondary: true // Flag to apply different styling
                }));
            }
            return [];
        });

        return [...primaryNodes, ...secondaryNodes];
    }, [graphData]);

    const links: any[] = useMemo(() => {
        if (!graphData) return [];

        const primaryLinks = graphData.related_stocks.map(stock => ({
            source: graphData.stock.guid,
            target: stock.guid,
            impact: stock.relationship?.impact || 'neutral',
            weight: stock.relationship?.weight || 0,
            flow: stock.relationship?.flow || 0,
            name: `Influence from ${graphData.stock.name} to ${stock.name}`
        }));

        // Add links from related stocks to their related stocks
        const secondaryLinks = graphData.related_stocks.flatMap(stock => {
            if (stock.related_stocks) {
                return stock.related_stocks.map(secondaryStock => ({
                    source: stock.guid,
                    target: secondaryStock.guid,
                    impact: secondaryStock.relationship?.impact || 'neutral',
                    weight: secondaryStock.relationship?.weight || 0,
                    flow: secondaryStock.relationship?.flow || 0,
                    name: `Influence from ${stock.name} to ${secondaryStock.name}`,
                    isSecondary: true // Flag to apply different styling
                }));
            }
            return [];
        });

        return [...primaryLinks, ...secondaryLinks];
    }, [graphData]);

    useEffect(() => {
        if (!graphData) return;

        const availableColors: [string, string][] = [
            ['#B0E2FF', d3.color('#B0E2FF')!.darker(0.9).toString()],
            ['#FFDAB9', d3.color('#FFDAB9')!.darker(0.9).toString()],
            ['#B0E2FF', d3.color('#B0E2FF')!.darker(0.9).toString()],
            ['#E6E6FA', d3.color('#E6E6FA')!.darker(0.9).toString()],
            ['#E6FFE6', d3.color('#E6FFE6')!.darker(0.9).toString()],
            ['#B2DFDB', d3.color('#B2DFDB')!.darker(0.9).toString()],
        ];

        let initialNodeColors: Record<string, [string, string]> = {};
        const storedNodeColors = localStorage.getItem('nodeColors');

        if (storedNodeColors) {
            try {
                initialNodeColors = JSON.parse(storedNodeColors);
                setNodeColors(initialNodeColors);
            } catch (error) {
                console.error("Error parsing node colors from local storage:", error);
                // If parsing fails, proceed with initial color assignment
                initialNodeColors = {};
            }
        }

        // Assign colors if not found in local storage or after parsing failure
        if (Object.keys(initialNodeColors).length === 0) {
            nodes.forEach(node => {
                if (node.isCenter) {
                    initialNodeColors[node.id] = ['#6A958F', d3.color('#6A958F')!.darker(0.7).toString()];
                } else {
                    const colorIndex = Math.floor(Math.random() * availableColors.length);
                    initialNodeColors[node.id] = availableColors[colorIndex];
                }
            });

            localStorage.setItem('nodeColors', JSON.stringify(initialNodeColors));
            setNodeColors(initialNodeColors);
        } else {
            // Ensure that all nodes have a color assigned, and if not, assign a default color
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
            setNodeColors(initialNodeColors);
        }
    }, [nodes, graphData]);

    useEffect(() => {

        if (!graphData || !svgRef.current || containerDimensions.width === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

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

        const edgeColor = d3.scaleOrdinal<string>()
            .domain(['positive', 'negative', 'neutral'])
            .range(['#6A958F', '#DC143C', '#888']);

        const defs = svg.append("defs");

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


        // Load saved positions if available
        const storedNodePositions = localStorage.getItem('nodePositions');
        let initialPositions: Record<string, { x: number; y: number }> = {};
        if (storedNodePositions) {
            initialPositions = JSON.parse(storedNodePositions);
        }

        // Initialize node positions (randomly or from localStorage)
        nodes.forEach(node => {
            if (initialPositions[node.id]) {
                node.fx = initialPositions[node.id].x;
                node.fy = initialPositions[node.id].y;
            } else {
                // Random initial positions
                node.x = Math.random() * (width - leftMargin - rightMargin) + leftMargin;
                node.y = Math.random() * (height - topMargin - bottomMargin) + topMargin;
            }
        });


        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(200))
            .force("charge", d3.forceManyBody().strength(-1000))
            .force("center", d3.forceCenter((width - sidebarWidth) / 2, height / 2))
            .force("x", d3.forceX((width - sidebarWidth) / 2).strength(0.1))
            .force("y", d3.forceY(height / 2).strength(0.1))
            .force(
                "collide",
                d3.forceCollide((d: any) => (d.isCenter ? centerNodeRadius : nodeRadius) + nodeBuffer).iterations(16)
            );



        const link = svg.append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke", (d: any) => edgeColor(d.impact))
            .attr("stroke-width", 2)
            .attr("opacity", (d: any) => d.isSecondary ? 0.6 : 0.6)
            .attr("class", "link")
            .style("cursor", "pointer")
            .on("click", (event: any, d: any) => {
                setSelectedElement(d);
            });

        const centerGroup = svg.append("g")
            .selectAll("g")
            .data(nodes.filter((d: any) => d.isCenter))
            .join("g");

        centerGroup.append("circle")
            .attr("r", centerNodeRadius + 10)
            .attr("fill", (d: any) => `url(#nodeGradient-${d.id})`)
            .style("filter", "drop-shadow(0px 0px 10px rgba(106, 149, 143, 0.5))")
            .style("cursor", "pointer")
            .on("click", (event: any, d: any) => {
                setSelectedElement(d);
            });

        centerGroup.append("circle")
            .attr("r", centerNodeRadius - 10)
            .attr("fill", "url(#centerInnerGradient)");

        // Add text to center circle
        centerGroup.each(function (d: any) {
            const group = d3.select(this);

            const animatedValue = animatedValues[d.id];
            const roundedValue = animatedValue !== undefined ? Math.round(animatedValue) : Math.round(d.value.value);

            // Display the formatted name
            group.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "1em")
                .attr("class", "node-name")
                .style("font-size", "10px")
                .style("fill", "#2C3333")
                .style("font-weight", "normal")
                .text(formatStockName(d.name));

            // Display value and unit on one line with icons on the right
            group.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "-0.35em")
                .attr("class", "node-value")
                .style("font-size", "16px")
                .style("fill", "#2C3333")
                .style("font-weight", "bold")
                .text(formatLargeNumber(roundedValue)) // Use formatLargeNumber here
                .append("title") // Add title for hover effect
                .text(`${roundedValue} ${d.value.unit}`);
        });

        const nodeGroups = svg.append("g")
            .selectAll("g")
            .data(nodes.filter((d: any) => !d.isCenter))
            .join("g");

        nodeGroups.append("circle")
            .attr("r", nodeRadius)
            .attr("fill", (d: any) => {
                if (d.isSecondary) {
                    // Apply a faded fill (e.g., light gray)
                    return `url(#nodeGradient-${d.id})`;
                    // return "#ddd"; // Or any light color
                } else {
                    return `url(#nodeGradient-${d.id})`;
                }
            })
            .style("filter", (d: any) => `drop-shadow(0px 0px 10px ${nodeColors[d.id]?.[0]})`)
            .style("cursor", "pointer")
            .attr("opacity", (d: any) => d.isSecondary ? 0.5 : 1) // Adjust opacity for secondary nodes
            .on("click", (event: any, d: any) => {
                setSelectedElement(d);
            });

        nodeGroups.each(function (d: any) {
            const group = d3.select(this);

            const animatedValue = animatedValues[d.id];
            const roundedValue = animatedValue !== undefined ? Math.round(animatedValue) : Math.round(d.value.value);

            // Display the formatted name
            group.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "1em")
                .attr("class", "node-name")
                .style("font-size", "10px")
                .style("fill", "#2C3333")
                .style("font-weight", "normal")
                .text(formatStockName(d.name));

            // Value
            group.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "-0.35em")
                .attr("class", "node-value")
                .style("font-size", "16px")
                .style("fill", "#2C3333")
                .style("font-weight", "bold")
                .text(formatLargeNumber(roundedValue)) // Use formatLargeNumber here
                .append("title") // Add title for hover effect
                .text(`${roundedValue} ${d.value.unit}`);
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

        simulation.on("tick", () => {
            nodeGroups.attr("transform", (d: any) => {
                // If the position is fixed, don't apply constraints.
                if (d.fx !== undefined && d.fy !== undefined) {
                    return `translate(${d.fx},${d.fy})`;
                }

                // Apply constraints only if the position is not fixed.
                const constrained = constrain(d.x, d.y, nodeRadius);
                d.x = constrained.x;
                d.y = constrained.y;
                return `translate(${d.x},${d.y})`;
            });

            centerGroup.attr("transform", (d: any) => {
                // Apply constraints on each tick
                if (d.fx !== undefined && d.fy !== undefined) {
                    return `translate(${d.fx},${d.fy})`;
                }

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
            case "days":
                yearEquivalent = simulationValue / 365;
                break;
            case "weeks":
                yearEquivalent = simulationValue / 52;
                break;
            case "months":
                yearEquivalent = simulationValue / 12;
                break;
            case "years":
                yearEquivalent = simulationValue;
                break;
        }

        const targetValues = nodes.reduce((acc, node) => {
            const growthFactor = 0.02; // Example growth factor

            acc[node.id] = node.value.value * Math.pow(1 + growthFactor, yearEquivalent);
            return acc;
        }, {} as Record<string, number>);

        const startTime = performance.now();
        const duration = 2000; // 2000ms duration for animation

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
    }, [runSimulation, graphData, nodes, simulationValue, simulationSettings]);

   useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);

        svg.selectAll(".node-value")
            .text((d: any) => {
                const animatedValue = animatedValues[d.id];
                const roundedValue = animatedValue !== undefined ? Math.round(animatedValue) : Math.round(d.value.value);
                return formatLargeNumber(roundedValue);
            })
            .attr("title", (d: any) => {
                const animatedValue = animatedValues[d.id];
                const roundedValue = animatedValue !== undefined ? Math.round(animatedValue) : Math.round(d.value.value);
                return `${roundedValue} ${d.value.unit}`;
            });
    }, [animatedValues]);

    return (
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {isLoading && (
            <LoadingScreen
              message="Loading visualization..."
              fullscreen={false}
            />
          )}
          {!isLoading && (
            <div className="absolute inset-0">
              <svg ref={svgRef} width="100%" height="100%" />
            </div>
          )}
        </div>
      );
      
}

export default React.memo(GraphComponent);