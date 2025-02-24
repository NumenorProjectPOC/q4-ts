import React, { useRef, useEffect, useState, useMemo } from "react";
import * as d3 from "d3";
import { GraphData, NodeData, LinkData } from '../services/types'

interface Stock {
  guid: string;
  name: string;
  value?: string;
  context?: string;
}

interface Relationship {
  impact?: string;
  weight?: number;
  flow?: number;
}

interface RelatedStock extends Stock {
  relationship?: Relationship;
}




interface GraphComponentProps {
  graphData: GraphData | null;
  selectedElement: NodeData | LinkData | null;
  setSelectedElement: (element: NodeData | LinkData | null) => void;
}

const GraphComponent: React.FC<GraphComponentProps> = ({ graphData, selectedElement, setSelectedElement }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [nodeColors, setNodeColors] = useState<Record<string, [string, string]>>({});

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
        relationship: stock.relationship,
      })),
    ];
  }, [graphData]);

  const links: any[] = useMemo(() => {
    if (!graphData) return [];
    return graphData.related_stocks.map(stock => ({
      source: graphData.stock.guid,
      target: stock.guid,
      impact: stock.relationship?.impact || "neutral",
      weight: stock.relationship?.weight || 0,
      flow: stock.relationship?.flow || 0,
      name: `Influence from ${graphData.stock.name} to ${stock.name}`,
    }));
  }, [graphData]);

  useEffect(() => {
    if (!graphData) return;

    const availableColors: [string, string][] = [
      ["#6A5ACD", d3.color("#6A5ACD")!.darker(0.7).toString()],
      ["#9370DB", d3.color("#9370DB")!.darker(0.7).toString()],
      ["#87CEFA", d3.color("#87CEFA")!.darker(0.7).toString()],
      ["#7B68EE", d3.color("#7B68EE")!.darker(0.7).toString()],
      ["#483D8B", d3.color("#483D8B")!.darker(0.7).toString()],
      ["#BA55D3", d3.color("#BA55D3")!.darker(0.7).toString()],
      ["#9400D3", d3.color("#9400D3")!.darker(0.7).toString()],
    ];

    const initialNodeColors: Record<string, [string, string]> = {};
    nodes.forEach(node => {
      if (node.isCenter) {
        initialNodeColors[node.id] = ["#ff69b4", d3.color("#ff69b4")!.darker(0.7).toString()];
      } else {
        const colorIndex = Math.floor(Math.random() * availableColors.length);
        initialNodeColors[node.id] = availableColors[colorIndex];
      }
    });

    setNodeColors(initialNodeColors);
  }, [nodes, graphData]);

  const formatValue = (value: string | undefined): string => {
    if (!value) return 'N/A';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return Math.round(numValue).toString();
  };

  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const nodeRadius = 50;
    const centerNodeRadius = 70;

    const edgeColor = d3.scaleOrdinal<string>().domain(["positive", "negative", "neutral"]).range(["green", "red", "#888"]);

    const defs = svg.append("defs");

    Object.entries(nodeColors).forEach(([key, [colorStart, colorEnd]]) => {
      const gradient = defs.append("linearGradient").attr("id", `nodeGradient-${key}`).attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%");

      gradient.append("stop").attr("offset", "0%").attr("stop-color", colorStart);
      gradient.append("stop").attr("offset", "100%").attr("stop-color", colorEnd);
    });

    const simulation = d3.forceSimulation<any>(nodes)
      .force("link", d3.forceLink<any, LinkData>(links).id(d => d.id).distance(200))
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1));

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", d => edgeColor(d.impact))
      .attr("stroke-width", 2)
      .attr("opacity", 0.6)
      .style("cursor", "pointer")
      .on("click", (_, d) => setSelectedElement(d));

    const nodeGroups = svg.append("g").selectAll("g").data(nodes).join("g");

    nodeGroups.append("circle")
      .attr("r", d => (d.isCenter ? centerNodeRadius : nodeRadius))
      .attr("fill", d => `url(#nodeGradient-${d.id})`)
      .style("cursor", "pointer")
      .on("click", (_, d) => setSelectedElement(d));

    nodeGroups.each(function(d) {
      const group = d3.select(this);
      
      // Display formatted value
      group.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.35em")
        .style("font-size", "16px")
        .style("fill", "white")
        .text(formatValue(d.value));
        
      // Display name
      group.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1em")
        .style("font-size", "10px")
        .style("fill", "white")
        .text(d.name);
    });

    simulation.on("tick", () => {
      nodeGroups.attr("transform", d => `translate(${d.x},${d.y})`);
      link.attr("x1", d => (d.source as NodeData).x!).attr("y1", d => (d.source as NodeData).y!)
          .attr("x2", d => (d.target as NodeData).x!).attr("y2", d => (d.target as NodeData).y!);
    });

  }, [graphData, nodeColors, nodes, links, setSelectedElement]);

  return <svg ref={svgRef} width="100%" height="100%"></svg>;
};

export default GraphComponent;