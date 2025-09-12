import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { RotateCcw, X, TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DataPoint {
  time: string;
  value_unit: string;
  predicted_value_unit?: string | null;
  predicted_value_unit_1?: string | null;
  predicted_value_unit_2?: string | null;
  is_predicted?: boolean;
  guid: string;
  stockcreationtime: string;
}

interface ProcessedDataPoint {
  date: Date;
  historic: number | null;
  predicted1: number | null;
  predicted2: number | null;
  originalItem: DataPoint;
}

interface ClickedDataPoint {
  date: Date;
  value: number;
  type: 'historical' | 'predicted1' | 'predicted2';
  originalItem: DataPoint;
  previousValue?: number;
  changePercent?: number;
  position: { x: number; y: number };
}

interface GraphMonitorComponentProps {
  data: DataPoint[] | any;
  upperThreshold: number;
  lowerThreshold: number;
  index: number;
  availableRanges: string[];
  defaultRange: string;
  sidebarCollapsed?: boolean;
  stockName?: string;
}

const GraphMonitorComponent: React.FC<GraphMonitorComponentProps> = ({
  data,
  upperThreshold,
  lowerThreshold,
  index,
  availableRanges,
  defaultRange,
  sidebarCollapsed,
  stockName = "Data Monitor"
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedRange, setSelectedRange] = useState(defaultRange);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform | null>(null);
  const [clickedPoint, setClickedPoint] = useState<ClickedDataPoint | null>(null);

  // Extract actual data array - handle both formats
  const getDataArray = (): DataPoint[] => {
    if (!data) return [];
    
    // If data is an object with stock_data property
    if (data.stock_data && Array.isArray(data.stock_data)) {
      return data.stock_data;
    }
    
    // If data is already an array
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  };

  const parseValueUnit = (valueUnit: string | null | undefined): number | null => {
    if (!valueUnit || valueUnit === 'null' || valueUnit === '') return null;
    
    const parsedValue = parseFloat(valueUnit);
    return isNaN(parsedValue) ? null : parsedValue;
  };

  // Filter data based on selected range
  const getFilteredData = () => {
    const dataArray = getDataArray();
    if (dataArray.length === 0) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    switch (selectedRange) {
      case '1D':
        startDate.setDate(now.getDate() - 1);
        break;
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return dataArray;
    }
    
    return dataArray.filter(d => new Date(d.time) >= startDate);
  };

  // Handle resize with FIXED HEIGHT
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: 400 // FIXED HEIGHT - clean and consistent
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle sidebar collapse with FIXED HEIGHT
  useEffect(() => {
    if (!containerRef.current) return;

    const applyWidth = () => {
      const el = containerRef.current!;
      const newWidth = el.clientWidth;
      setDimensions(prev => {
        if (prev.width === newWidth) return prev;
        return { 
          width: newWidth, 
          height: 400 // KEEP HEIGHT FIXED
        };
      });
    };

    applyWidth();
    const t = setTimeout(applyWidth, 310);
    return () => clearTimeout(t);
  }, [sidebarCollapsed]);

  // Generate static analysis data
  const generateAnalysis = (clickedData: ClickedDataPoint) => {
    const insights = [
      "Data shows consistent upward trend in the selected timeframe.",
      "Volatility has increased by approximately 15% compared to previous period.",
      "Current value exceeds the 30-day moving average by 8.2%.",
      "Prediction accuracy has improved by 12% with latest model updates.",
      "Strong correlation detected with market sentiment indicators."
    ];

    const risks = [
      "Potential market correction expected within next 2 weeks.",
      "External economic factors may impact future predictions.",
      "Data quality concerns in recent automated collection.",
      "Seasonal adjustments may be required for accuracy."
    ];

    return {
      insights: insights.slice(0, Math.floor(Math.random() * 3) + 2),
      risks: risks.slice(0, Math.floor(Math.random() * 2) + 1),
      confidence: Math.floor(Math.random() * 20) + 75,
      volatility: (Math.random() * 0.3 + 0.1).toFixed(3),
      trend: Math.random() > 0.5 ? 'bullish' : 'bearish'
    };
  };

  useEffect(() => {
    if (!svgRef.current) return;
    
    const dataArray = getDataArray();
    if (dataArray.length === 0) return;

    const filteredData = getFilteredData();
    if (filteredData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 60, bottom: 60, left: 60 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    // Create main group
    const g = svg
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Process data
    const processedData: ProcessedDataPoint[] = filteredData.map(d => {
      const historicValue = parseValueUnit(d.value_unit);
      const predictedValue1 = parseValueUnit(d.predicted_value_unit_1);
      const predictedValue2 = parseValueUnit(d.predicted_value_unit_2);
      
      return {
        date: new Date(d.time),
        historic: historicValue,
        predicted1: predictedValue1,
        predicted2: predictedValue2,
        originalItem: d
      };
    }).filter(d => !isNaN(d.date.getTime()) && (d.historic !== null || d.predicted1 !== null || d.predicted2 !== null));

    if (processedData.length === 0) return;

    // Separate data types
    const historicalData = processedData.filter(d => d.historic !== null);
    const predicted1Data = processedData.filter(d => d.predicted1 !== null);
    const predicted2Data = processedData.filter(d => d.predicted2 !== null);

    // Get all values for domain calculation
    const allValues: number[] = [];
    historicalData.forEach(d => d.historic !== null && allValues.push(d.historic));
    predicted1Data.forEach(d => d.predicted1 !== null && allValues.push(d.predicted1));
    predicted2Data.forEach(d => d.predicted2 !== null && allValues.push(d.predicted2));

    if (allValues.length === 0) return;

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(processedData, d => d.date) as [Date, Date])
      .range([0, width]);

    const yExtent = d3.extent(allValues) as [number, number];
    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .nice()
      .range([height, 0]);

    // Create line generators
    const line = d3.line<{date: Date, value: number}>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Create area generators for gradient fill
    const area = d3.area<{date: Date, value: number}>()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Create gradients with refined theme
    const defs = svg.append("defs");

    // Historical gradient (subtle red theme)
    const historicalGradient = defs.append("linearGradient")
      .attr("id", `historicalGradient-${index}`)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", height)
      .attr("x2", 0).attr("y2", 0);

    historicalGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#DC2626")
      .attr("stop-opacity", 0.05);

    historicalGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#DC2626")
      .attr("stop-opacity", 0.3);

    // Predicted gradients
    const predicted1Gradient = defs.append("linearGradient")
      .attr("id", `predicted1Gradient-${index}`)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", height)
      .attr("x2", 0).attr("y2", 0);

    predicted1Gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#F97316")
      .attr("stop-opacity", 0.05);

    predicted1Gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#F97316")
      .attr("stop-opacity", 0.25);

    const predicted2Gradient = defs.append("linearGradient")
      .attr("id", `predicted2Gradient-${index}`)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", height)
      .attr("x2", 0).attr("y2", 0);

    predicted2Gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#EF4444")
      .attr("stop-opacity", 0.05);

    predicted2Gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#EF4444")
      .attr("stop-opacity", 0.25);

    // Add threshold lines with refined styling
    if (upperThreshold > 0) {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", yScale(upperThreshold))
        .attr("y2", yScale(upperThreshold))
        .attr("stroke", "#DC2626")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("opacity", 0.6);

      g.append("text")
        .attr("x", width - 5)
        .attr("y", yScale(upperThreshold) - 5)
        .attr("text-anchor", "end")
        .attr("fill", "#DC2626")
        .attr("font-size", "12px")
        .attr("font-weight", "600")
        .text(`Upper: ${upperThreshold}`);
    }

    if (lowerThreshold > 0) {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", yScale(lowerThreshold))
        .attr("y2", yScale(lowerThreshold))
        .attr("stroke", "#059669")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("opacity", 0.6);

      g.append("text")
        .attr("x", width - 5)
        .attr("y", yScale(lowerThreshold) + 15)
        .attr("text-anchor", "end")
        .attr("fill", "#059669")
        .attr("font-size", "12px")
        .attr("font-weight", "600")
        .text(`Lower: ${lowerThreshold}`);
    }

    // Draw historical data
    if (historicalData.length > 0) {
      const historicalLineData = historicalData
        .filter(d => d.historic !== null)
        .map(d => ({ date: d.date, value: d.historic! }));
      
      if (historicalLineData.length > 0) {
        g.append("path")
          .datum(historicalLineData)
          .attr("fill", `url(#historicalGradient-${index})`)
          .attr("d", area)
          .attr("opacity", 0.8);

        g.append("path")
          .datum(historicalLineData)
          .attr("fill", "none")
          .attr("stroke", "#DC2626")
          .attr("stroke-width", 3)
          .attr("d", line);

        // Add clickable dots for historical data
        const dotData = historicalLineData.filter((_, i) => i % Math.max(1, Math.floor(historicalLineData.length / 50)) === 0);
        g.selectAll(".historical-dot")
          .data(dotData)
          .enter().append("circle")
          .attr("class", "historical-dot")
          .attr("cx", d => xScale(d.date))
          .attr("cy", d => yScale(d.value))
          .attr("r", 4)
          .attr("fill", "#DC2626")
          .attr("stroke", "white")
          .attr("stroke-width", 2)
          .style("cursor", "pointer")
          .on("click", function(event, d) {
            event.stopPropagation();
            const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
            const originalData = historicalData.find(hd => hd.date.getTime() === d.date.getTime());
            const dataIndex = historicalData.findIndex(hd => hd.date.getTime() === d.date.getTime());
            const previousValue = dataIndex > 0 ? historicalData[dataIndex - 1]?.historic : null;
            
            setClickedPoint({
              date: d.date,
              value: d.value,
              type: 'historical',
              originalItem: originalData?.originalItem!,
              previousValue: previousValue || undefined,
              changePercent: previousValue ? ((d.value - previousValue) / previousValue) * 100 : undefined,
              position: { x: mouseX + 60, y: mouseY + 20 }
            });
          })
          .on("mouseover", function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 6)
              .attr("stroke-width", 3);
          })
          .on("mouseout", function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 4)
              .attr("stroke-width", 2);
          });
      }
    }

    // Draw predicted data 1
    if (predicted1Data.length > 0) {
      const predicted1LineData = predicted1Data
        .filter(d => d.predicted1 !== null)
        .map(d => ({ date: d.date, value: d.predicted1! }));
      
      if (predicted1LineData.length > 0) {
        g.append("path")
          .datum(predicted1LineData)
          .attr("fill", `url(#predicted1Gradient-${index})`)
          .attr("d", area)
          .attr("opacity", 0.7);

        g.append("path")
          .datum(predicted1LineData)
          .attr("fill", "none")
          .attr("stroke", "#F97316")
          .attr("stroke-width", 3)
          .attr("stroke-dasharray", "8,4")
          .attr("d", line);

        // Add clickable dots for predicted data 1
        const dotData = predicted1LineData.filter((_, i) => i % Math.max(1, Math.floor(predicted1LineData.length / 30)) === 0);
        g.selectAll(".predicted1-dot")
          .data(dotData)
          .enter().append("circle")
          .attr("class", "predicted1-dot")
          .attr("cx", d => xScale(d.date))
          .attr("cy", d => yScale(d.value))
          .attr("r", 4)
          .attr("fill", "#F97316")
          .attr("stroke", "white")
          .attr("stroke-width", 2)
          .attr("opacity", 0.9)
          .style("cursor", "pointer")
          .on("click", function(event, d) {
            event.stopPropagation();
            const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
            const originalData = predicted1Data.find(pd => pd.date.getTime() === d.date.getTime());
            
            setClickedPoint({
              date: d.date,
              value: d.value,
              type: 'predicted1',
              originalItem: originalData?.originalItem!,
              position: { x: mouseX + 60, y: mouseY + 20 }
            });
          })
          .on("mouseover", function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 6)
              .attr("stroke-width", 3);
          })
          .on("mouseout", function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 4)
              .attr("stroke-width", 2);
          });
      }
    }

    // Draw predicted data 2
    if (predicted2Data.length > 0) {
      const predicted2LineData = predicted2Data
        .filter(d => d.predicted2 !== null)
        .map(d => ({ date: d.date, value: d.predicted2! }));
      
      if (predicted2LineData.length > 0) {
        g.append("path")
          .datum(predicted2LineData)
          .attr("fill", `url(#predicted2Gradient-${index})`)
          .attr("d", area)
          .attr("opacity", 0.7);

        g.append("path")
          .datum(predicted2LineData)
          .attr("fill", "none")
          .attr("stroke", "#EF4444")
          .attr("stroke-width", 3)
          .attr("stroke-dasharray", "12,6")
          .attr("d", line);

        // Add clickable dots for predicted data 2
        const dotData = predicted2LineData.filter((_, i) => i % Math.max(1, Math.floor(predicted2LineData.length / 30)) === 0);
        g.selectAll(".predicted2-dot")
          .data(dotData)
          .enter().append("circle")
          .attr("class", "predicted2-dot")
          .attr("cx", d => xScale(d.date))
          .attr("cy", d => yScale(d.value))
          .attr("r", 4)
          .attr("fill", "#EF4444")
          .attr("stroke", "white")
          .attr("stroke-width", 2)
          .attr("opacity", 0.9)
          .style("cursor", "pointer")
          .on("click", function(event, d) {
            event.stopPropagation();
            const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
            const originalData = predicted2Data.find(pd => pd.date.getTime() === d.date.getTime());
            
            setClickedPoint({
              date: d.date,
              value: d.value,
              type: 'predicted2',
              originalItem: originalData?.originalItem!,
              position: { x: mouseX + 60, y: mouseY + 20 }
            });
          })
          .on("mouseover", function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 6)
              .attr("stroke-width", 3);
          })
          .on("mouseout", function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 4)
              .attr("stroke-width", 2);
          });
      }
    }

    // Add axes with refined styling
    const formatTime: any = d3.timeFormat("%Y");
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(formatTime)
      .ticks(Math.min(10, width / 100));

    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d3.format("d"))
      .ticks(8);

    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", "#6b7280")
      .attr("font-size", "12px")
      .attr("font-weight", "500");

    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .selectAll("text")
      .attr("fill", "#6b7280")
      .attr("font-size", "12px")
      .attr("font-weight", "500");

    // Add axis lines with subtle styling
    g.append("line")
      .attr("class", "axis-line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", height)
      .attr("y2", height)
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 1);

    g.append("line")
      .attr("class", "axis-line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 1);

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 50])
      .extent([[0, 0], [width, height]])
      .translateExtent([[0, 0], [width, height]])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        setZoomTransform(event.transform);
        
        const newXScale = event.transform.rescaleX(xScale);
        const newYScale = event.transform.rescaleY(yScale);

        g.select(".x-axis")
          .call(d3.axisBottom(newXScale).tickFormat(formatTime) as any);
        
        g.select(".y-axis")
          .call(d3.axisLeft(newYScale).tickFormat(d3.format("d")) as any);

        g.selectAll("path:not(.axis-line)").attr("transform", event.transform.toString());
        g.selectAll("circle").attr("transform", event.transform.toString());
        g.selectAll("line:not(.axis-line)").attr("transform", event.transform.toString());
      });

    svg.call(zoom);

    // Enhanced tooltip
    const tooltip = d3.select("body").selectAll<HTMLDivElement, unknown>(".chart-tooltip")
      .data([0]);
      
    const tooltipEnter = tooltip.enter()
      .append("div")
      .attr("class", "chart-tooltip");
      
    const tooltipMerged = tooltipEnter.merge(tooltip)
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.9)")
      .style("color", "white")
      .style("padding", "12px 16px")
      .style("border-radius", "12px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("border", "1px solid rgba(220, 38, 38, 0.2)")
      .style("box-shadow", "0 4px 20px rgba(0, 0, 0, 0.3)")
      .style("backdrop-filter", "blur(8px)");

    // Add invisible overlay for mouse events
    g.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mousemove", function(event: MouseEvent) {
        const [mouseX] = d3.pointer(event);
        const date = xScale.invert(mouseX);
        
        const bisect = d3.bisector((d: ProcessedDataPoint) => d.date).left;
        const index = bisect(processedData, date);
        const d0 = processedData[index - 1];
        const d1 = processedData[index];
        const d = d0 && d1 ? (date.getTime() - d0.date.getTime() > d1.date.getTime() - date.getTime() ? d1 : d0) : d0 || d1;
        
        if (d) {
          const [mouseX, mouseY] = d3.pointer(event, document.body);
          
          tooltipMerged
            .style("opacity", 1)
            .style("left", `${mouseX + 10}px`)
            .style("top", `${mouseY - 10}px`)
            .html(`
              <div style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px; margin-bottom: 8px;">
                <strong>📅 ${d3.timeFormat("%Y-%m-%d")(d.date)}</strong>
              </div>
              ${d.historic !== null ? `<div style="margin: 3px 0;"><span style="color: #DC2626;">●</span> <strong>Historical:</strong> ${d.historic.toFixed(2)}</div>` : ''}
              ${d.predicted1 !== null ? `<div style="margin: 3px 0;"><span style="color: #F97316;">●</span> <strong>Predicted 1:</strong> ${d.predicted1.toFixed(2)}</div>` : ''}
              ${d.predicted2 !== null ? `<div style="margin: 3px 0;"><span style="color: #EF4444;">●</span> <strong>Predicted 2:</strong> ${d.predicted2.toFixed(2)}</div>` : ''}
            `);
        }
      })
      .on("mouseleave", () => {
        tooltipMerged.style("opacity", 0);
      })
      .on("click", () => {
        setClickedPoint(null); // Close modal when clicking on chart area
      });

  }, [data, dimensions, selectedRange, upperThreshold, lowerThreshold, index]);

  const resetZoom = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition()
        .duration(750)
        .call(
          d3.zoom<SVGSVGElement, unknown>().transform,
          d3.zoomIdentity
        );
      setZoomTransform(null);
    }
  };

  const dataArray = getDataArray();
  if (dataArray.length === 0) {
    return (
      <div className="w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200/60 relative" style={{ height: '520px' }}>
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-white rounded-3xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading data...</p>
            <p className="text-sm text-gray-500">Data points: {dataArray.length}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full bg-white/90 backdrop-blur-sm border border-gray-200/60 relative" 
      style={{ height: '520px' }} // FIXED CONTAINER HEIGHT
    >
      {/* Refined Header - Matching Dashboard Style */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200/60">
        {/* Left: Stock Name with Icon */}
        <motion.div 
          className="flex items-center space-x-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{stockName}</h3>
            <p className="text-sm text-gray-600">Real-time monitoring</p>
          </div>
        </motion.div>

        {/* Center: Legend */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-2 bg-gradient-to-r from-red-500/30 to-red-600 rounded-full border border-red-600"></div>
            <span className="text-sm font-medium text-gray-700">Historical</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-2 bg-gradient-to-r from-orange-500/30 to-orange-500 rounded-full border border-orange-500 border-dashed"></div>
            <span className="text-sm font-medium text-gray-700">Predicted 1</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-2 bg-gradient-to-r from-red-400/30 to-red-400 rounded-full border border-red-400 border-dashed"></div>
            <span className="text-sm font-medium text-gray-700">Predicted 2</span>
          </div>
        </div>

        {/* Right: Range Selector + Reset Button */}
        <div className="flex items-center space-x-3">
          {/* Range Selector */}
          <div className="flex items-center space-x-1 bg-white/90 rounded-xl p-1 border border-gray-200/60 shadow-sm backdrop-blur-sm">
            {availableRanges.map((range) => (
              <motion.button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  selectedRange === range
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {range}
              </motion.button>
            ))}
          </div>

          {/* Reset Button */}
          <motion.button
            onClick={resetZoom}
            className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-gray-200/60 shadow-sm bg-white/90 backdrop-blur-sm"
            title="Reset Zoom"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Chart Container with FIXED HEIGHT */}
      <div className="p-6" style={{ height: '400px' }}>
        <svg 
          ref={svgRef} 
          className="w-full" 
          style={{ height: '400px' }} // FIXED SVG HEIGHT
        ></svg>
      </div>

      {/* Instructions */}
      <div className="px-6 pb-4">
        <p className="text-xs text-gray-500 text-center">
          <span className="font-medium">Click data points for analysis</span> • Drag to pan • Scroll to zoom • Data points: {dataArray.length}
        </p>
      </div>

      {/* Enhanced Data Point Modal */}
      <AnimatePresence>
        {clickedPoint && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-40 rounded-3xl"
              onClick={() => setClickedPoint(null)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: clickedPoint.position.x - 200, y: clickedPoint.position.y - 150 }}
              animate={{ opacity: 1, scale: 1, x: clickedPoint.position.x - 200, y: clickedPoint.position.y - 150 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute z-50 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden"
              style={{
                left: Math.min(clickedPoint.position.x - 200, dimensions.width - 400),
                top: Math.max(50, clickedPoint.position.y - 150)
              }}
            >
              {/* Modal Header */}
              <div className={`p-4 bg-gradient-to-r ${
                clickedPoint.type === 'historical' 
                  ? 'from-red-600 to-red-700' 
                  : clickedPoint.type === 'predicted1'
                  ? 'from-orange-600 to-orange-700'
                  : 'from-red-500 to-red-600'
              } text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      {clickedPoint.type === 'historical' ? (
                        <BarChart3 className="w-4 h-4" />
                      ) : (
                        <TrendingUp className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold">
                        {clickedPoint.type === 'historical' ? 'Historical Data' : 
                         clickedPoint.type === 'predicted1' ? 'Prediction Model 1' : 'Prediction Model 2'}
                      </h3>
                      <p className="text-sm text-white/80">
                        {d3.timeFormat("%B %d, %Y")(clickedPoint.date)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setClickedPoint(null)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Value Information */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm text-gray-600">Current Value</p>
                      <p className="text-2xl font-bold text-gray-900">{clickedPoint.value.toFixed(4)}</p>
                    </div>
                    {clickedPoint.previousValue && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Change</p>
                        <div className={`flex items-center gap-1 ${
                          clickedPoint.changePercent! > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {clickedPoint.changePercent! > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="font-bold">
                            {Math.abs(clickedPoint.changePercent!).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium">CONFIDENCE</p>
                      <p className="text-lg font-bold text-blue-900">
                        {generateAnalysis(clickedPoint).confidence}%
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-purple-600 font-medium">VOLATILITY</p>
                      <p className="text-lg font-bold text-purple-900">
                        {generateAnalysis(clickedPoint).volatility}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Analysis Section */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Key Insights
                  </h4>
                  <div className="space-y-2">
                    {generateAnalysis(clickedPoint).insights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                        <p className="text-sm text-gray-700">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Factors */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-orange-600" />
                    Risk Factors
                  </h4>
                  <div className="space-y-2">
                    {generateAnalysis(clickedPoint).risks.map((risk, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                        <p className="text-sm text-gray-700">{risk}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Details */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3">Technical Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Point ID:</span>
                      <span className="font-mono text-gray-900">{clickedPoint.originalItem.guid.substring(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-900">{d3.timeFormat("%Y-%m-%d %H:%M")(new Date(clickedPoint.originalItem.stockcreationtime))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trend:</span>
                      <span className={`font-medium capitalize ${
                        generateAnalysis(clickedPoint).trend === 'bullish' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {generateAnalysis(clickedPoint).trend}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GraphMonitorComponent;