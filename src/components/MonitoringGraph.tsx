import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { formatLargeNumber } from "../utils/utility";

interface DataItem {
  time: string;
  value_unit: string;
  predicted_value_unit: string | null;
  predicted_value_unit_1: string | null;
  predicted_value_unit_2: string | null;
  stockcreationtime: string;
  guid: string;
}

interface GraphMonitorProps {
  data: DataItem[];
  index: number;
  upperThreshold: number;
  lowerThreshold: number;
  availableRanges?: string[];
  defaultRange?: string;
  onRangeChange?: (range: string) => void;
}

const GraphMonitorComponent: React.FC<GraphMonitorProps> = ({
  data,
  index,
  upperThreshold,
  lowerThreshold,
  availableRanges = ["1D", "5D", "1M", "6M", "1Y", "Max"],
  defaultRange = "1M",
  onRangeChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);
  const fullXDomainRef = useRef<[Date, Date] | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [selectedRange, setSelectedRange] = useState<string>(defaultRange);
  const [zoomDomain, setZoomDomain] = useState<[Date, Date] | null>(null);
  const [isZooming, setIsZooming] = useState(false);

  const parseValue = (valueUnit: string): number => {
    const match = valueUnit.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  };

  // Smart Y-axis scaling function
  const getSmartYDomain = (values: number[], thresholds: { upper: number; lower: number }) => {
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Include thresholds in the calculation if they're meaningful
    const allValues = [...values];
    if (thresholds.upper > 0) allValues.push(thresholds.upper);
    if (thresholds.lower > 0) allValues.push(thresholds.lower);

    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    const range = dataMax - dataMin;

    // If range is very small, use a minimum range
    const minRange = Math.max(dataMax * 0.1, 1);
    const actualRange = Math.max(range, minRange);

    // Calculate smart bounds based on the data range
    let yMin: number, yMax: number;

    if (actualRange <= 10) {
      // For small ranges (0-10), use nice round numbers
      yMin = Math.floor(dataMin);
      yMax = Math.ceil(dataMax);

      // Ensure minimum range of 2
      if (yMax - yMin < 2) {
        const center = (yMin + yMax) / 2;
        yMin = Math.floor(center - 1);
        yMax = Math.ceil(center + 1);
      }
    } else if (actualRange <= 100) {
      // For medium ranges (10-100), round to nearest 5 or 10
      const padding = actualRange * 0.05;
      yMin = Math.floor((dataMin - padding) / 5) * 5;
      yMax = Math.ceil((dataMax + padding) / 5) * 5;
    } else if (actualRange <= 1000) {
      // For larger ranges (100-1000), round to nearest 10 or 50
      const padding = actualRange * 0.05;
      yMin = Math.floor((dataMin - padding) / 10) * 10;
      yMax = Math.ceil((dataMax + padding) / 10) * 10;
    } else {
      // For very large ranges, use percentage-based padding
      const padding = actualRange * 0.1;
      yMin = dataMin - padding;
      yMax = dataMax + padding;

      // Round to significant figures
      const magnitude = Math.pow(10, Math.floor(Math.log10(actualRange)) - 1);
      yMin = Math.floor(yMin / magnitude) * magnitude;
      yMax = Math.ceil(yMax / magnitude) * magnitude;
    }

    // Ensure we don't go below 0 for positive data
    if (dataMin >= 0 && yMin < 0) {
      yMin = 0;
    }

    return [yMin, yMax];
  };

  // Enhanced time formatting based on data range
  const getTimeFormatter = (domain: [Date, Date]) => {
    const [start, end] = domain;
    const diffInDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const diffInYears = diffInDays / 365;

    if (diffInYears > 2) {
      return d3.timeFormat("%Y");
    } else if (diffInYears > 1) {
      return d3.timeFormat("%b %Y");
    } else if (diffInDays > 30) {
      return d3.timeFormat("%b %d");
    } else if (diffInDays > 1) {
      return d3.timeFormat("%m/%d");
    } else {
      return d3.timeFormat("%H:%M");
    }
  };

  const getTicks = (domain: [Date, Date], width: number) => {
    const [start, end] = domain;
    const diffInDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const maxTicks = Math.floor(width / 80); // Minimum 80px between ticks

    if (diffInDays > 365) {
      return Math.min(maxTicks, Math.floor(diffInDays / 365) + 1);
    } else if (diffInDays > 30) {
      return Math.min(maxTicks, Math.floor(diffInDays / 30) + 1);
    } else if (diffInDays > 7) {
      return Math.min(maxTicks, Math.floor(diffInDays / 7) + 1);
    } else {
      return Math.min(maxTicks, Math.floor(diffInDays) + 1);
    }
  };

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    setZoomDomain(null); // Reset zoom when changing range
    onRangeChange?.(range);
  };

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        // Debounce resize events
        setTimeout(() => drawGraph(), 100);
      }
    });
    if (svgRef.current) resizeObserver.observe(svgRef.current);
    return () => resizeObserver.disconnect();
  }, [data, selectedRange, zoomDomain]);

  useEffect(() => {
    // Create tooltip
    tooltipRef.current = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "8px")
      .style("background", "rgba(0, 0, 0, 0.9)")
      .style("border-radius", "6px")
      .style("color", "#fff")
      .style("font-size", "12px")
      .style("box-shadow", "0 0 15px rgba(0, 229, 255, 0.6)")
      .style("border", "1px solid #00E5FF")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000)
      .style("backdrop-filter", "blur(4px)");

    return () => {
      tooltipRef.current?.remove();
    };
  }, []);

  const drawGraph = () => {
    if (!data || data.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const processedData = data.map((item) => ({
      date: new Date(item.time),
      historic: item.value_unit ? parseValue(item.value_unit) : null,
      predicted: item.predicted_value_unit ? parseValue(item.predicted_value_unit) : null,
      predicted_1: item.predicted_value_unit_1 ? parseValue(item.predicted_value_unit_1) : null,
      predicted_2: item.predicted_value_unit_2 ? parseValue(item.predicted_value_unit_2) : null,
      originalValue: item.value_unit || item.predicted_value_unit || "",
      originalPredicted1: item.predicted_value_unit_1 || "",
      originalPredicted2: item.predicted_value_unit_2 || ""
    })).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Filter data based on selected range
    const now = new Date();
    const cutoff = new Date(now);
    const daysAgo = {
      "1D": 1, "5D": 5, "1M": 30, "6M": 180, "1Y": 365, "Max": Infinity
    }[selectedRange] ?? 30;

    if (selectedRange !== "Max") {
      cutoff.setDate(now.getDate() - daysAgo);
    }

    const filteredData = processedData.filter(d => selectedRange === "Max" || d.date >= cutoff);

    // Separate historical and predicted data
    const historicalData = filteredData
      .filter(d => d.historic !== null)
      .map(d => ({
        date: d.date,
        value: d.historic!,
        type: 'historical' as const,
        originalValue: d.originalValue
      }));

    const predictedData = filteredData
      .filter(d => d.predicted !== null)
      .map(d => ({
        date: d.date,
        value: d.predicted!,
        type: 'predicted' as const,
        originalValue: d.originalValue
      }));

    const predictedData1 = filteredData
      .filter(d => d.predicted_1 !== null)
      .map(d => ({
        date: d.date,
        value: d.predicted_1!,
        type: 'predicted_1' as const,
        originalValue: d.originalPredicted1
      }));

    const predictedData2 = filteredData
      .filter(d => d.predicted_2 !== null)
      .map(d => ({
        date: d.date,
        value: d.predicted_2!,
        type: 'predicted_2' as const,
        originalValue: d.originalPredicted2
      }));

    // Combine all data for domain calculations
    const allData = [...historicalData, ...predictedData, ...predictedData1, ...predictedData2];

    if (allData.length === 0) return;

    const allDates = allData.map(d => d.date);
    const allValues = allData.map(d => d.value);

    // Increased height for better visibility
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const height = 220 - margin.top - margin.bottom;
    const width = svgRef.current.clientWidth - margin.left - margin.right;

    svg.attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom + 60)
      .style("background", "#1F2937");

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up domains
    const fullXDomain = d3.extent(allDates) as [Date, Date];
    fullXDomainRef.current = fullXDomain;

    const currentXDomain = zoomDomain || fullXDomain;

    // For zoomed view, extend the domain slightly to eliminate edge spacing
    const domainPadding = zoomDomain ? 0 : 0;
    const extendedDomain = zoomDomain ? currentXDomain : [
      new Date(currentXDomain[0].getTime() - domainPadding),
      new Date(currentXDomain[1].getTime() + domainPadding)
    ];

    const x = d3.scaleTime()
      .domain(extendedDomain)
      .range([0, width]);

    // Use smart Y-axis scaling
    const smartYDomain = getSmartYDomain(allValues, {
      upper: upperThreshold,
      lower: lowerThreshold
    });

    const y = d3.scaleLinear()
      .domain(smartYDomain)
      .range([height, 0]);

    // Filter data for current zoom domain
    const filterByDomain = (data: typeof allData) =>
      data.filter(d => d.date >= currentXDomain[0] && d.date <= currentXDomain[1]);

    const visibleHistorical = filterByDomain(historicalData);
    const visiblePredicted = filterByDomain(predictedData);
    const visiblePredicted1 = filterByDomain(predictedData1);
    const visiblePredicted2 = filterByDomain(predictedData2);

    // Enhanced downsampling for better performance
    const MAX_POINTS = Math.floor(width / 2);
    const downsampleData = (data: typeof allData) => {
      if (data.length <= MAX_POINTS) return data;

      const step = data.length / MAX_POINTS;
      const sampled = [];

      for (let i = 0; i < data.length; i += step) {
        const index = Math.floor(i);
        if (index < data.length) {
          sampled.push(data[index]);
        }
      }

      if (sampled.length > 0 && sampled[sampled.length - 1] !== data[data.length - 1]) {
        sampled.push(data[data.length - 1]);
      }

      return sampled;
    };

    const displayHistorical = downsampleData(visibleHistorical);
    const displayPredicted = downsampleData(visiblePredicted);
    const displayPredicted1 = downsampleData(visiblePredicted1);
    const displayPredicted2 = downsampleData(visiblePredicted2);

    // Create axes with dynamic formatting
    const timeFormatter = getTimeFormatter(currentXDomain);
    const tickCount = getTicks(currentXDomain, width);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(tickCount).tickFormat(timeFormatter as any))
      .selectAll("text")
      .style("fill", "#ccc")
      .style("font-size", "11px")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    g.append("g")
      .call(
        d3.axisLeft(y)
          .ticks(6)
          .tickFormat((d: d3.NumberValue) => formatLargeNumber(d.valueOf()))
      )
      .selectAll("text")
      .style("fill", "#ccc")
      .style("font-size", "11px");

    // Add grid lines
    g.selectAll(".grid-line-x")
      .data(x.ticks(tickCount))
      .enter()
      .append("line")
      .attr("class", "grid-line-x")
      .attr("x1", d => x(d))
      .attr("x2", d => x(d))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#374151")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.5);

    g.selectAll(".grid-line-y")
      .data(y.ticks(6))
      .enter()
      .append("line")
      .attr("class", "grid-line-y")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "#374151")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.5);

    // Create gradients for different lines
    const gradients = [
      { id: `gradient-historical-${index}`, color1: "#00E5FF", color2: "#0091EA" },
      { id: `gradient-predicted-${index}`, color1: "#FFA500", color2: "#FF8C00" },
      { id: `gradient-predicted1-${index}`, color1: "#FF6B6B", color2: "#FF5252" },
      { id: `gradient-predicted2-${index}`, color1: "#4ECDC4", color2: "#26A69A" }
    ];

    gradients.forEach(({ id, color1, color2 }) => {
      const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", id)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0).attr("y1", y(smartYDomain[0]))
        .attr("x2", 0).attr("y2", y(smartYDomain[1]));

      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color1)
        .attr("stop-opacity", 0.8);

      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color2)
        .attr("stop-opacity", 0.2);
    });

    // Line generator
    const lineGen = d3.line<typeof allData[0]>()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Area generator
    const area = d3.area<typeof allData[0]>()
      .x(d => x(d.date))
      .y0(height)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Draw historical area and line
    if (displayHistorical.length > 0) {
      g.append("path")
        .datum(displayHistorical)
        .attr("fill", `url(#gradient-historical-${index})`)
        .attr("d", area);

      g.append("path")
        .datum(displayHistorical)
        .attr("fill", "none")
        .attr("stroke", "#00E5FF")
        .attr("stroke-width", 2.5)
        .attr("d", lineGen);
    }

    // Draw predicted lines with different colors and styles
    const predictedLines = [
      { data: displayPredicted, color: "#FFA500", label: "Predicted", dashArray: "8,4", strokeWidth: 2.5 },
      { data: displayPredicted1, color: "#FF6B6B", label: "Predicted 1", dashArray: "12,6", strokeWidth: 2.5 },
      { data: displayPredicted2, color: "#4ECDC4", label: "Predicted 2", dashArray: "16,4,4,4", strokeWidth: 2.5 }
    ];

    predictedLines.forEach(({ data, color, label, dashArray, strokeWidth }) => {
      if (data.length > 0) {
        // Draw predicted area with lower opacity
        g.append("path")
          .datum(data)
          .attr("fill", color)
          .attr("fill-opacity", 0.15)
          .attr("d", area);

        // Draw predicted line with distinct styling
        g.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", strokeWidth)
          .attr("stroke-dasharray", dashArray)
          .attr("d", lineGen);
      }
    });

    // Draw threshold lines
    const drawThresholdLine = (value: number, label: string, color: string) => {
      if (value <= 0) return;

      // Only draw threshold lines if they're within the visible range
      if (value >= smartYDomain[0] && value <= smartYDomain[1]) {
        g.append("line")
          .attr("x1", 0)
          .attr("x2", width)
          .attr("y1", y(value))
          .attr("y2", y(value))
          .attr("stroke", color)
          .attr("stroke-dasharray", "8 4")
          .attr("stroke-width", 2);

        g.append("text")
          .attr("x", width - 80)
          .attr("y", y(value) - 8)
          .attr("fill", color)
          .attr("font-size", "11px")
          .attr("font-weight", "bold")
          .text(`${label}: ${formatLargeNumber(value)}`);
      }
    };

    drawThresholdLine(upperThreshold, "Upper", "#FF3300");
    drawThresholdLine(lowerThreshold, "Lower", "#FFD700");

    // Add interactive dots for all data types
    const dotConfigs = [
      { data: displayHistorical, color: "#00E5FF", type: "Historical" },
      { data: displayPredicted, color: "#FFA500", type: "Predicted" },
      { data: displayPredicted1, color: "#FF6B6B", type: "Predicted 1" },
      { data: displayPredicted2, color: "#4ECDC4", type: "Predicted 2" }
    ];

    dotConfigs.forEach(({ data, color, type }) => {
      if (data.length <= 300) {
        g.selectAll(`.dot-${type.toLowerCase().replace(' ', '-')}`)
          .data(data)
          .enter()
          .append("circle")
          .attr("class", `dot-${type.toLowerCase().replace(' ', '-')}`)
          .attr("cx", d => x(d.date))
          .attr("cy", d => y(d.value))
          .attr("r", 4)
          .attr("fill", d => {
            if (upperThreshold > 0 && d.value > upperThreshold) return "#ff4c4c";
            if (lowerThreshold > 0 && d.value < lowerThreshold) return "#FFD700";
            return color;
          })
          .attr("stroke", "#fff")
          .attr("stroke-width", 1)
          .style("cursor", "pointer")
          .style("filter", d => {
            if (upperThreshold > 0 && d.value > upperThreshold) return "drop-shadow(0px 0px 8px #ff4c4c)";
            if (lowerThreshold > 0 && d.value < lowerThreshold) return "drop-shadow(0px 0px 8px #FFD700)";
            return `drop-shadow(0px 0px 6px ${color})`;
          })
          .on("mouseover", function (event, d) {
            d3.select(this).transition().duration(200).attr("r", 7);
            tooltipRef.current?.html(
              `<div style="font-weight: bold; margin-bottom: 4px;">${type} Value</div>
               <div><strong>Date:</strong> ${d3.timeFormat("%b %d, %Y %H:%M")(d.date)}</div>
               <div><strong>Value:</strong> ${d.originalValue}</div>
               <div><strong>Formatted:</strong> ${formatLargeNumber(d.value)}</div>`
            ).style("opacity", 1)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function () {
            d3.select(this).transition().duration(200).attr("r", 4);
            tooltipRef.current?.style("opacity", 0);
          });
      }
    });

    // Enhanced zoom functionality
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 50])
      .translateExtent([[-width * 0.1, 0], [width * 1.1, height]])
      .extent([[0, 0], [width, height]])
      .on("start", () => {
        setIsZooming(true);
      })
      .on("zoom", (event) => {
        const transform = event.transform;
        const newX = transform.rescaleX(d3.scaleTime().domain(fullXDomain).range([0, width]));
        const newDomain = newX.domain() as [Date, Date];

        const padding = (fullXDomain[1].getTime() - fullXDomain[0].getTime()) * 0.001;
        const clampedDomain: [Date, Date] = [
          new Date(Math.max(newDomain[0].getTime(), fullXDomain[0].getTime() - padding)),
          new Date(Math.min(newDomain[1].getTime(), fullXDomain[1].getTime() + padding))
        ];

        setZoomDomain(clampedDomain);
      })
      .on("end", () => {
        setIsZooming(false);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Add brush for overview
    const brushHeight = 50;
    const brushMarginTop = height + margin.top + 70;

    const xBrush = d3.scaleTime().domain(fullXDomain).range([0, width]);
    const yBrush = d3.scaleLinear().domain(smartYDomain).range([brushHeight, 0]);

    const brushLine = d3.line<typeof allData[0]>()
      .x(d => xBrush(d.date))
      .y(d => yBrush(d.value))
      .curve(d3.curveMonotoneX);

    const context = svg.append("g")
      .attr("transform", `translate(${margin.left},${brushMarginTop})`);

    context.append("rect")
      .attr("width", width)
      .attr("height", brushHeight)
      .attr("fill", "#374151")
      .attr("opacity", 0.3);

    // Draw brush lines for all data types with distinct styling
    const brushLines = [
      { data: historicalData, color: "#00E5FF", strokeWidth: 1.5 },
      { data: predictedData, color: "#FFA500", strokeWidth: 1.5 },
      { data: predictedData1, color: "#FF6B6B", strokeWidth: 1.5 },
      { data: predictedData2, color: "#4ECDC4", strokeWidth: 1.5 }
    ];

    brushLines.forEach(({ data, color, strokeWidth }) => {
      if (data.length > 0) {
        context.append("path")
          .datum(downsampleData(data))
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", strokeWidth)
          .attr("opacity", 0.8)
          .attr("d", brushLine);
      }
    });

    // Add brush
    const brush = d3.brushX()
      .extent([[0, 0], [width, brushHeight]])
      .on("brush end", (event) => {
        if (!event.selection || isZooming) return;

        const [x0, x1] = event.selection.map(xBrush.invert);
        const newDomain: [Date, Date] = [
          new Date(Math.max(x0.getTime(), fullXDomain[0].getTime())),
          new Date(Math.min(x1.getTime(), fullXDomain[1].getTime()))
        ];

        setZoomDomain(newDomain);
      });

    context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, zoomDomain ? [xBrush(zoomDomain[0]), xBrush(zoomDomain[1])] : null);

    // Add axis labels
    svg.append("text")
      .attr("transform", `translate(${width / 2 + margin.left}, ${height + margin.top + 40})`)
      .style("text-anchor", "middle")
      .style("fill", "#ccc")
      .style("font-size", "12px")
      .text("Time");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 + 15)
      .attr("x", 0 - (height / 2 + margin.top))
      .style("text-anchor", "middle")
      .style("fill", "#ccc")
      .style("font-size", "12px")
      .text("Value");
  };

  const resetZoom = () => {
    setZoomDomain(null);
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div className="relative w-full mt-2 p-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 text-sm font-medium text-gray-400">
          {availableRanges.map((range, idx) => (
            <span key={range} className="flex items-center">
              <button
                onClick={() => handleRangeChange(range)}
                className={`relative px-3 py-1.5 rounded transition-all duration-200 ${selectedRange === range
                  ? "bg-cyan-600 text-white shadow-lg"
                  : "hover:bg-gray-700 hover:text-cyan-400"
                  }`}
              >
                {range}
              </button>
              {idx < availableRanges.length - 1 && (
                <span className="mx-1 text-gray-500">|</span>
              )}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            className="text-xs px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
            onClick={resetZoom}
          >
            Reset Zoom
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-cyan-400"></div>
          <span className="text-gray-300">Historical</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-orange-400" style={{ borderTop: "2px dashed" }}></div>
          <span className="text-gray-300">Predicted</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-red-400" style={{ borderTop: "2px dashed" }}></div>
          <span className="text-gray-300">Predicted 1</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-teal-400" style={{ borderTop: "2px dashed" }}></div>
          <span className="text-gray-300">Predicted 2</span>
        </div>
      </div>

      {/* Graph Container */}
      <div className="relative">
        <svg ref={svgRef} className="w-full" style={{ minHeight: '300px' }}></svg>

        {/* Loading indicator */}
        {isZooming && (
          <div className="absolute top-2 right-2 bg-gray-700 text-cyan-400 px-2 py-1 rounded text-xs">
            Zooming...
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphMonitorComponent;