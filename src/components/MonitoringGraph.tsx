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

    console.log(processedData, ',.,...');


    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const height = 150 - margin.top - margin.bottom;
    const containerWidth = svgRef.current.clientWidth;
    const graphWidth = containerWidth - margin.left - margin.right;

    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", height + margin.top + margin.bottom)
      .style("background", "#121212") // Deep Color: Dark Background
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

    // Grid lines - Dark Blue Grey
    svg.append("g")
      .attr("class", "grid")
      .attr("stroke", "#2A2A2A") // Dark Blue Grey Grid
      .attr("stroke-dasharray", "3,3")
      .call(d3.axisLeft(y).tickSize(-graphWidth).tickFormat(() => "").ticks(5));

    svg.append("g")
      .attr("class", "grid")
      .attr("stroke", "#2A2A2A") // Dark Blue Grey Grid
      .attr("stroke-dasharray", "3,3")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(-height).tickFormat(() => "").ticks(5));

    // X & Y Axes - Light Grey for contrast
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3.axisBottom(x)
          .ticks(d3.timeDay.every(1))  // Show one tick per day
          .tickFormat(d3.timeFormat("%b %d")) // Show only Month and Date
          .tickPadding(10)
      )
      .attr("color", "#E0E0E0") // Light Grey Axis color
      .selectAll("text") // Rotate text for better readability
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("fill", "#E0E0E0"); // Light Grey Text color


    svg.append("g")
      .call(d3.axisLeft(y).ticks(3).tickPadding(10))
      .attr("color", "#E0E0E0") // Light Grey Axis color
      .selectAll("text")
      .style("fill", "#E0E0E0"); // Light Grey Text color

    // Gradient for line - Deep Purple to Deep Blue Gradient (Reversed)
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "lineGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#6A00FF").attr("stop-opacity", 0.9); // Deep Purple (Start)
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#007BFF").attr("stop-opacity", 0.9); // Deep Blue (End)

    // Graph Line - Apply Gradient
    svg.append("path")
      .datum(processedData)
      .attr("fill", "none")
      .attr("stroke", "url(#lineGradient)")
      .attr("stroke-width", 2)
      .attr("d", line)
      .style("filter", "drop-shadow(0px 0px 5px #6A00FF)"); // Purple shadow - still appropriate as purple is now the starting color

    // Create tooltip div - Dark Background, Light Text, Vibrant Border
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "8px")
      .style("background", "rgba(0, 0, 0, 0.9)") // Dark Tooltip Background
      .style("border-radius", "4px")
      .style("color", "#E0E0E0") // Light Text Color
      .style("font-size", "12px")
      .style("box-shadow", "0 0 8px rgba(106, 0, 255, 0.7)") // Purple Shadow
      .style("border", "1px solid #007BFF") // Deep Blue Border
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000);

    // Data Points - Vibrant Blue
    svg.selectAll(".dot")
      .data(processedData)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.value))
      .attr("r", 4)
      .attr("fill", "#52ff03") // Vibrant Blue Dots
      .style("filter", "drop-shadow(0px 0px 6px #0ac27e)") // Blue dot shadow
      .on("mouseover", function (event, d) {
        // Enlarge and change color of the dot - Vibrant Pink on Hover
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 7)
          .attr("fill", "#FF4081"); // Vibrant Pink on hover

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
          .attr("r", 4)
          .attr("fill", "#007BFF"); // Back to Vibrant Blue

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
    <div className="w-full h-48 mt-2 p-1 bg-gray-900 rounded-lg shadow-lg border border-gray-800"> {/* Updated container background and border for deep color */}
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

export default GraphMonitorComponent;