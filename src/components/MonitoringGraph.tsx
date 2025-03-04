import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface DataItem {
  time: string;
  value_unit: string;
  stockcreationtime: string;
  guid: string;
}

const GraphMonitorComponent: React.FC<{ data: DataItem[]; index: number }> = ({ data, index }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState<number>(0);
  useEffect(() => {
    if (data.length > 0) drawGraph();
  }, [data]);
  
  const parseValue = (valueUnit: string): number => {
    const match = valueUnit.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };
  

  const drawGraph = () => {
    if (!data || data.length === 0 || !svgRef.current) return;
    d3.select(svgRef.current).selectAll("*").remove();

    const processedData = data
    .map((item) => ({
      date: new Date(item.time),  // Ensure this is a valid Date object
      value: parseValue(item.value_unit),
      originalValue: item.value_unit,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
      console.log(processedData,',.,...');
      
      
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const height = 150 - margin.top - margin.bottom;
    const containerWidth = svgRef.current.clientWidth;
    const graphWidth = containerWidth - margin.left - margin.right;

    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", height + margin.top + margin.bottom)
      .style("background", "#1F2937") // Updated background color
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleTime()
      .domain(d3.extent(processedData, d => d.date) as [Date, Date]) 
      .range([0, graphWidth]);
    
    const y = d3.scaleLinear().domain([0, d3.max(processedData, (d) => d.value) as number]).range([height, 0]);

    const line = d3
      .line<{ date: Date; value: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX); // Smooth curve

    // Grid lines
    svg.append("g")
      .attr("class", "grid")
      .attr("stroke", "rgb(57, 255, 20)")
      .attr("stroke-dasharray", "3,3")
      .call(d3.axisLeft(y).tickSize(-graphWidth).tickFormat(() => "").ticks(5));

    svg.append("g")
      .attr("class", "grid")
      .attr("stroke", "#39FF14")
      .attr("stroke-dasharray", "3,3")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(-height).tickFormat(() => "").ticks(5));

    // X & Y Axes
    svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3.axisBottom(x)
        .ticks(d3.timeDay.every(1))  // Show one tick per day
        .tickFormat(d3.timeFormat("%b %d")) // Show only Month and Date
        .tickPadding(10)
    )
    .attr("color", "#00E5FF")
    .selectAll("text") // Rotate text for better readability
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");
  

    svg.append("g")
      .call(d3.axisLeft(y).ticks(3).tickPadding(10))
      .attr("color", "#00E5FF");

    // Gradient for line
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "lineGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#00E5FF").attr("stop-opacity", 0.8);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#00E5FF").attr("stop-opacity", 0.2);

    // Graph Line
    svg.append("path")
      .datum(processedData)
      .attr("fill", "none")
      .attr("stroke", "url(#lineGradient)")
      .attr("stroke-width", 2.5)
      .attr("d", line)
      .style("filter", "drop-shadow(0px 0px 6px #00E5FF)");

    // Create tooltip div
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "8px")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("border-radius", "4px")
      .style("color", "#fff")
      .style("font-size", "12px")
      .style("box-shadow", "0 0 10px rgba(0, 229, 255, 0.5)")
      .style("border", "1px solid #00E5FF")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000);

    // Data Points
    svg.selectAll(".dot")
      .data(processedData)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.value))
      .attr("r", 5)
      .attr("fill", "#00E5FF")
      .style("filter", "drop-shadow(0px 0px 8px #00E5FF)")
      .on("mouseover", function (event, d) {
        // Enlarge and change color of the dot
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 8)
          .attr("fill", "#FF4081");

        // Format date for display
        const formatDate = d3.timeFormat("%b %d, %Y %H:%M");

        // Show tooltip with value information
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 1);

        tooltip
          .html(`
            <div>
              <strong>Date:</strong> ${formatDate(d.date)}<br/>
              <strong>Value:</strong> ${d.originalValue}<br/>
            </div>
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        // Return dot to original style
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 5)
          .attr("fill", "#00E5FF");

        // Hide tooltip
        tooltip
          .transition()
          .duration(500)
          .style("opacity", 0);
      });

    // Clean up tooltip when component unmounts
    return () => {
      tooltip.remove();
    };
  };

  useEffect(() => {
    drawGraph();

    // Handle window resize
    const handleResize = () => {
      if (svgRef.current) {
        setWidth(svgRef.current.clientWidth);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data, width]);

  return (
    <div className="w-full h-48 mt-2 p-1 bg-gray-800 rounded-lg shadow-lg border border-gray-800">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

export default GraphMonitorComponent;