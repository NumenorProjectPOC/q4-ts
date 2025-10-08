import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { RotateCcw, X, BarChart3, Activity, Eye, ZoomIn, ZoomOut, Move, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMagnitude } from '../utils/utility';

interface DataPoint {
  time: string;
  value_unit: string;
  predicted_value_unit?: string | null;
  predicted_value_unit_1?: string | null;
  predicted_value_unit_1_scenario?: string | null;
  predicted_value_unit_2?: string | null;
  predicted_value_unit_2_scenario?: string | null;
  is_predicted?: boolean;
  guid: string;
  stockcreationtime: string;
}

interface ContinuousDataPoint {
  date: Date;
  value: number;
  type: 'historical' | 'predicted1' | 'predicted2';
  originalItem: DataPoint;
  isBridgePoint?: boolean;
}

// NEW: Scenario popup interface
interface ScenarioPopup {
  date: Date;
  value: number;
  type: 'predicted1' | 'predicted2';
  scenario: string;
  position: { x: number; y: number };
}

interface HoveredData {
  date: Date;
  points: ContinuousDataPoint[];
  mouseX: number;
  nearestPoint: ContinuousDataPoint;
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
  isDarkMode?: boolean;
}

const GraphMonitorComponent: React.FC<GraphMonitorComponentProps> = ({
  data,
  upperThreshold,
  lowerThreshold,
  index,
  availableRanges,
  defaultRange,
  sidebarCollapsed,
  stockName = "Data Monitor",
  isDarkMode = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedRange, setSelectedRange] = useState(defaultRange);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform | null>(null);
  
  // UPDATED: Separate states for hover and scenario popup
  const [hoveredData, setHoveredData] = useState<HoveredData | null>(null);
  const [scenarioPopup, setScenarioPopup] = useState<ScenarioPopup | null>(null);
  const [showThresholds, setShowThresholds] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Enhanced responsive breakpoints
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Extract actual data array - handle both formats
  const getDataArray = (): DataPoint[] => {
    console.log('🔧 Raw data input:', data); // DEBUG
    
    if (!data) {
      console.log('❌ No data provided'); // DEBUG
      return [];
    }

    // If data is an object with stock_data property
    if (data.stock_data && Array.isArray(data.stock_data)) {
      console.log('📊 Using stock_data array, length:', data.stock_data.length); // DEBUG
      console.log('📊 Sample stock_data item:', data.stock_data[0]); // DEBUG
      return data.stock_data;
    }

    // If data is already an array
    if (Array.isArray(data)) {
      console.log('📊 Using direct array, length:', data.length); // DEBUG
      console.log('📊 Sample array item:', data[0]); // DEBUG
      return data;
    }

    console.log('❌ Data format not recognized'); // DEBUG
    return [];
  };

  const parseValueUnit = (valueUnit: string | null | undefined): number | null => {
    if (!valueUnit || valueUnit === 'null' || valueUnit === '') return null;

    const parsedValue = parseFloat(valueUnit);
    return isNaN(parsedValue) ? null : parsedValue;
  };

  // ENHANCED: Get scenario text with comprehensive debugging
  const getScenario = (item: DataPoint, type: 'predicted1' | 'predicted2'): string | null => {
    console.log('🔍 Getting scenario for:', { item, type }); // DEBUG
    
    if (type === 'predicted1') {
      const scenario = item.predicted_value_unit_1_scenario;
      console.log('📊 Predicted 1 scenario found:', scenario); // DEBUG
      return scenario && scenario.trim() !== '' ? scenario : null;
    } else if (type === 'predicted2') {
      const scenario = item.predicted_value_unit_2_scenario;
      console.log('📊 Predicted 2 scenario found:', scenario); // DEBUG
      return scenario && scenario.trim() !== '' ? scenario : null;
    }
    
    console.log('❌ Invalid scenario type:', type); // DEBUG
    return null;
  };

  // INTELLIGENT TIME FORMATTER
  const createIntelligentTimeFormatter = (dates: Date[]) => {
    if (dates.length === 0) return d3.timeFormat('%Y-%m-%d');

    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];

    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    const yearsDiff = endDate.getFullYear() - startDate.getFullYear();

    // SMART LOGIC: Choose format based on data span
    if (daysDiff <= 1) {
      return d3.timeFormat('%H:%M');
    } else if (daysDiff <= 7) {
      return d3.timeFormat('%a %d');
    } else if (daysDiff <= 31 && monthsDiff === 0) {
      return d3.timeFormat('%b %d');
    } else if (monthsDiff <= 12 && yearsDiff === 0) {
      return d3.timeFormat('%b');
    } else if (yearsDiff <= 2) {
      return d3.timeFormat('%b %Y');
    } else {
      return d3.timeFormat('%Y');
    }
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

  // Create PROPERLY connected continuous line data
  const createContinuousLineData = (filteredData: DataPoint[]): ContinuousDataPoint[] => {
    if (filteredData.length === 0) return [];

    const continuousData: ContinuousDataPoint[] = [];

    // Sort data by time first
    const sortedData = filteredData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    // Process each data point and create continuous structure
    const processedPoints = new Map<string, {
      date: Date;
      historical?: number;
      predicted1?: number;
      predicted2?: number;
      originalItem: DataPoint;
    }>();

    // Group all values by timestamp
    sortedData.forEach(item => {
      const timeKey = item.time;
      const date = new Date(item.time);

      if (!processedPoints.has(timeKey)) {
        processedPoints.set(timeKey, { date, originalItem: item });
      }

      const point = processedPoints.get(timeKey)!;

      const historicalValue = parseValueUnit(item.value_unit);
      const predicted1Value = parseValueUnit(item.predicted_value_unit_1);
      const predicted2Value = parseValueUnit(item.predicted_value_unit_2);

      if (historicalValue !== null) point.historical = historicalValue;
      if (predicted1Value !== null) point.predicted1 = predicted1Value;
      if (predicted2Value !== null) point.predicted2 = predicted2Value;
    });

    // Convert to sorted array
    const sortedPoints = Array.from(processedPoints.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Create proper connectivity by finding transition points
    let lastHistoricalPoint: { date: Date; value: number; originalItem: DataPoint } | null = null;

    sortedPoints.forEach(point => {
      // HISTORICAL LINE: Add all historical points
      if (point.historical !== undefined) {
        const historicalPoint = {
          date: point.date,
          value: point.historical,
          type: 'historical' as const,
          originalItem: point.originalItem
        };

        continuousData.push(historicalPoint);
        lastHistoricalPoint = historicalPoint;
      }

      // PREDICTED 1 LINE: Create seamless connection
      if (point.predicted1 !== undefined) {
        if (lastHistoricalPoint && !continuousData.some(p =>
          p.date.getTime() === lastHistoricalPoint!.date.getTime() && p.type === 'predicted1'
        )) {
          continuousData.push({
            date: lastHistoricalPoint.date,
            value: lastHistoricalPoint.value,
            type: 'predicted1',
            originalItem: lastHistoricalPoint.originalItem,
            isBridgePoint: true
          });
        }

        continuousData.push({
          date: point.date,
          value: point.predicted1,
          type: 'predicted1',
          originalItem: point.originalItem
        });
      }

      // PREDICTED 2 LINE: Create seamless connection
      if (point.predicted2 !== undefined) {
        if (lastHistoricalPoint && !continuousData.some(p =>
          p.date.getTime() === lastHistoricalPoint!.date.getTime() && p.type === 'predicted2'
        )) {
          continuousData.push({
            date: lastHistoricalPoint.date,
            value: lastHistoricalPoint.value,
            type: 'predicted2',
            originalItem: lastHistoricalPoint.originalItem,
            isBridgePoint: true
          });
        }

        continuousData.push({
          date: point.date,
          value: point.predicted2,
          type: 'predicted2',
          originalItem: point.originalItem
        });
      }
    });

    return continuousData.sort((a, b) => {
      if (a.date.getTime() === b.date.getTime()) {
        const typeOrder = { 'historical': 0, 'predicted1': 1, 'predicted2': 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.date.getTime() - b.date.getTime();
    });
  };

  // Group continuous data by type for line rendering
  const groupContinuousData = (continuousData: ContinuousDataPoint[]) => {
    const groups = {
      historical: [] as ContinuousDataPoint[],
      predicted1: [] as ContinuousDataPoint[],
      predicted2: [] as ContinuousDataPoint[]
    };

    continuousData.forEach(point => {
      groups[point.type].push(point);
    });

    // Sort each group by date
    Object.values(groups).forEach(group => {
      group.sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    return groups;
  };

  // MOBILE-RESPONSIVE DIMENSIONS
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // MOBILE-OPTIMIZED HEIGHTS
        const height = isMobile ? 280 : isTablet ? 320 : 380;
        setDimensions({
          width: rect.width,
          height: height
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, isTablet]);

  // Handle sidebar collapse with responsive dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const applyWidth = () => {
      const el = containerRef.current!;
      const newWidth = el.clientWidth;
      const height = isMobile ? 280 : isTablet ? 320 : 380;
      setDimensions(prev => {
        if (prev.width === newWidth && prev.height === height) return prev;
        return {
          width: newWidth,
          height: height
        };
      });
    };

    applyWidth();
    const t = setTimeout(applyWidth, 310);
    return () => clearTimeout(t);
  }, [sidebarCollapsed, isMobile, isTablet]);

  // NEW: Handle dot click with proper workflow
  const handleDotClick = (event: MouseEvent, d: ContinuousDataPoint) => {
    event.stopPropagation();
    
    console.log('🖱️ Dot clicked:', { type: d.type, data: d.originalItem }); // DEBUG
    
    // Only handle predicted points that might have scenarios
    if (d.type !== 'predicted1' && d.type !== 'predicted2') {
      console.log('❌ Not a predicted point, ignoring click'); // DEBUG
      return;
    }

    // Check for scenario
    const scenario = getScenario(d.originalItem, d.type);
    
    if (!scenario) {
      console.log('❌ No scenario found for this predicted point'); // DEBUG
      return;
    }

    console.log('✅ Scenario found, creating popup:', scenario); // DEBUG

    // Close hover tooltip immediately
    setHoveredData(null);

    // Get click position relative to the chart
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    console.log('📍 Click position:', { clickX, clickY }); // DEBUG

    // Create scenario popup
    const popup: ScenarioPopup = {
      date: d.date,
      value: d.value,
      type: d.type,
      scenario: scenario,
      position: { x: clickX, y: clickY }
    };

    console.log('💡 Setting scenario popup:', popup); // DEBUG
    setScenarioPopup(popup);
  };

  // NEW: Close scenario popup
  const closeScenarioPopup = () => {
    console.log('❌ Closing scenario popup'); // DEBUG
    setScenarioPopup(null);
    // Hover will automatically work again since we're not preventing it
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const dataArray = getDataArray();
    if (dataArray.length === 0) return;

    const filteredData = getFilteredData();
    if (filteredData.length === 0) return;

    console.log('🎨 Rendering chart with filtered data:', filteredData.length, 'items'); // DEBUG

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // MOBILE-OPTIMIZED MARGINS
    const margin = {
      top: isMobile ? 15 : 25,
      right: isMobile ? 15 : 30,
      bottom: isMobile ? 30 : 50,
      left: isMobile ? 40 : 65
    };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    // Create main group
    const g = svg
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create properly connected continuous line data
    const continuousData = createContinuousLineData(filteredData);
    if (continuousData.length === 0) return;

    console.log('📊 Continuous data created:', continuousData.length, 'points'); // DEBUG

    // Group data by type for rendering
    const groupedData = groupContinuousData(continuousData);

    console.log('📈 Grouped data:', {
      historical: groupedData.historical.length,
      predicted1: groupedData.predicted1.length,
      predicted2: groupedData.predicted2.length
    }); // DEBUG

    // Get all values for domain calculation
    const allValues = continuousData.map(d => d.value);
    if (allValues.length === 0) return;

    // Include thresholds in domain calculation
    const allValuesWithThresholds = [...allValues];
    if (upperThreshold > 0) allValuesWithThresholds.push(upperThreshold);
    if (lowerThreshold > 0) allValuesWithThresholds.push(lowerThreshold);

    // SMART SCALING: Intelligent time formatter
    const allDates = continuousData.map(d => d.date);
    const intelligentTimeFormatter = createIntelligentTimeFormatter(allDates);

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(continuousData, d => d.date) as [Date, Date])
      .range([0, width]);

    // Enhanced Y-scale with better padding
    const yExtent = d3.extent(allValuesWithThresholds) as [number, number];
    const yPadding = (yExtent[1] - yExtent[0]) * 0.15;
    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .nice()
      .range([height, 0]);

    // Create line generator with enhanced smoothing
    const line = d3.line<ContinuousDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveCatmullRom.alpha(isMobile ? 0.3 : 0.4));

    // Create area generator for gradient fill
    const area = d3.area<ContinuousDataPoint>()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.value))
      .curve(d3.curveCatmullRom.alpha(isMobile ? 0.3 : 0.4));

    // Create ENHANCED gradients with Landing Page theme colors
    const defs = svg.append("defs");

    const createGradient = (id: string, color: string, opacity: number) => {
      const gradient = defs.append("linearGradient")
        .attr("id", id)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0).attr("y1", height)
        .attr("x2", 0).attr("y2", 0);

      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.0);

      gradient.append("stop")
        .attr("offset", "60%")
        .attr("stop-color", color)
        .attr("stop-opacity", opacity * 0.3);

      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color)
        .attr("stop-opacity", opacity);
    };

    createGradient(`historicalGradient-${index}`, "#DC2626", 0.2);
    createGradient(`predicted1Gradient-${index}`, "#F97316", 0.15);
    createGradient(`predicted2Gradient-${index}`, "#EF4444", 0.15);

    // ENHANCED GRIDLINES with Landing Page theme
    const gridColor = isDarkMode ? "#475569" : "#e2e8f0";
    const gridOpacity = isMobile ? 0.15 : 0.25;

    // Enhanced Y gridlines
    g.append("g")
      .attr("class", "grid-y")
      .call(d3.axisLeft(yScale)
        .ticks(isMobile ? 3 : 5)
        .tickSize(-width)
        .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", gridColor)
      .attr("stroke-dasharray", "2,3")
      .attr("opacity", gridOpacity);

    // Enhanced X gridlines
    g.append("g")
      .attr("class", "grid-x")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .ticks(isMobile ? 3 : 6)
        .tickSize(-height)
        .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", gridColor)
      .attr("stroke-dasharray", "2,3")
      .attr("opacity", gridOpacity * 0.6);

    g.selectAll(".grid-y path, .grid-x path").remove();

    // ENHANCED VISIBLE THRESHOLD LINES
    if (showThresholds) {
      // Upper Threshold
      if (upperThreshold > 0) {
        const upperY = yScale(upperThreshold);

        const upperZoneGradient = defs.append("linearGradient")
          .attr("id", `upperZoneGradient-${index}`)
          .attr("x1", "0%").attr("y1", "0%")
          .attr("x2", "0%").attr("y2", "100%");

        upperZoneGradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "#DC2626")
          .attr("stop-opacity", isMobile ? 0.04 : 0.06);

        upperZoneGradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "#DC2626")
          .attr("stop-opacity", 0.01);

        g.append("rect")
          .attr("class", "upper-threshold-zone")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", width)
          .attr("height", upperY)
          .attr("fill", `url(#upperZoneGradient-${index})`);

        g.append("line")
          .attr("class", "upper-threshold-line")
          .attr("x1", 0)
          .attr("x2", width)
          .attr("y1", upperY)
          .attr("y2", upperY)
          .attr("stroke", "#DC2626")
          .attr("stroke-width", isMobile ? 1.5 : 2)
          .attr("stroke-dasharray", "6,4")
          .attr("opacity", 0.8);

        // Enhanced threshold label
        const upperLabelGroup = g.append("g")
          .attr("class", "upper-threshold-label");

        const labelWidth = isMobile ? 60 : 85;
        upperLabelGroup.append("rect")
          .attr("x", width - labelWidth - 5)
          .attr("y", upperY - 14)
          .attr("width", labelWidth)
          .attr("height", isMobile ? 18 : 22)
          .attr("rx", 4)
          .attr("fill", "#DC2626")
          .attr("fill-opacity", 0.9);

        upperLabelGroup.append("text")
          .attr("x", width - labelWidth / 2 - 5)
          .attr("y", upperY - (isMobile ? 2 : 2))
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .attr("font-size", isMobile ? "8px" : "10px")
          .attr("font-weight", "600")
          .text(`Upper: ${formatMagnitude(upperThreshold)}`);
      }

      // Lower Threshold
      if (lowerThreshold > 0) {
        const lowerY = yScale(lowerThreshold);

        const lowerZoneGradient = defs.append("linearGradient")
          .attr("id", `lowerZoneGradient-${index}`)
          .attr("x1", "0%").attr("y1", "0%")
          .attr("x2", "0%").attr("y2", "100%");

        lowerZoneGradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "#059669")
          .attr("stop-opacity", 0.01);

        lowerZoneGradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "#059669")
          .attr("stop-opacity", isMobile ? 0.04 : 0.06);

        g.append("rect")
          .attr("class", "lower-threshold-zone")
          .attr("x", 0)
          .attr("y", lowerY)
          .attr("width", width)
          .attr("height", height - lowerY)
          .attr("fill", `url(#lowerZoneGradient-${index})`);

        g.append("line")
          .attr("class", "lower-threshold-line")
          .attr("x1", 0)
          .attr("x2", width)
          .attr("y1", lowerY)
          .attr("y2", lowerY)
          .attr("stroke", "#059669")
          .attr("stroke-width", isMobile ? 1.5 : 2)
          .attr("stroke-dasharray", "6,4")
          .attr("opacity", 0.8);

        // Enhanced threshold label
        const lowerLabelGroup = g.append("g")
          .attr("class", "lower-threshold-label");

        const labelWidth = isMobile ? 60 : 85;
        lowerLabelGroup.append("rect")
          .attr("x", width - labelWidth - 5)
          .attr("y", lowerY + 4)
          .attr("width", labelWidth)
          .attr("height", isMobile ? 18 : 22)
          .attr("rx", 4)
          .attr("fill", "#059669")
          .attr("fill-opacity", 0.9);

        lowerLabelGroup.append("text")
          .attr("x", width - labelWidth / 2 - 5)
          .attr("y", lowerY + (isMobile ? 16 : 18))
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .attr("font-size", isMobile ? "8px" : "10px")
          .attr("font-weight", "600")
          .text(`Lower: ${formatMagnitude(lowerThreshold)}`);
      }
    }

    // MOBILE-OPTIMIZED LINE RENDERING

    // 1. Historical line
    if (groupedData.historical.length > 0) {
      // Subtle shadow effect
      g.append("path")
        .datum(groupedData.historical)
        .attr("fill", "none")
        .attr("stroke", "#DC2626")
        .attr("stroke-width", isMobile ? 2 : 3)
        .attr("stroke-opacity", 0.06)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", line)
        .attr("transform", "translate(0, 1)");

      // Area fill
      g.append("path")
        .datum(groupedData.historical)
        .attr("fill", `url(#historicalGradient-${index})`)
        .attr("fill-opacity", isMobile ? 0.7 : 1)
        .attr("d", area);

      // Main line
      g.append("path")
        .datum(groupedData.historical)
        .attr("fill", "none")
        .attr("stroke", "#DC2626")
        .attr("stroke-width", isMobile ? 1.8 : 2.5)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", line);
    }

    // 2. Predicted 1 line
    if (groupedData.predicted1.length > 0) {
      // Subtle shadow effect
      g.append("path")
        .datum(groupedData.predicted1)
        .attr("fill", "none")
        .attr("stroke", "#F97316")
        .attr("stroke-width", isMobile ? 2 : 3)
        .attr("stroke-opacity", 0.06)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("stroke-dasharray", isMobile ? "6,4" : "8,5")
        .attr("d", line)
        .attr("transform", "translate(0, 1)");

      // Area fill
      g.append("path")
        .datum(groupedData.predicted1)
        .attr("fill", `url(#predicted1Gradient-${index})`)
        .attr("fill-opacity", isMobile ? 0.7 : 1)
        .attr("d", area);

      // Main line
      g.append("path")
        .datum(groupedData.predicted1)
        .attr("fill", "none")
        .attr("stroke", "#F97316")
        .attr("stroke-width", isMobile ? 1.8 : 2.5)
        .attr("stroke-dasharray", isMobile ? "6,4" : "8,5")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", line);
    }

    // 3. Predicted 2 line
    if (groupedData.predicted2.length > 0) {
      // Subtle shadow effect
      g.append("path")
        .datum(groupedData.predicted2)
        .attr("fill", "none")
        .attr("stroke", "#EF4444")
        .attr("stroke-width", isMobile ? 2 : 3)
        .attr("stroke-opacity", 0.06)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("stroke-dasharray", isMobile ? "8,5" : "10,6")
        .attr("d", line)
        .attr("transform", "translate(0, 1)");

      // Area fill
      g.append("path")
        .datum(groupedData.predicted2)
        .attr("fill", `url(#predicted2Gradient-${index})`)
        .attr("fill-opacity", isMobile ? 0.7 : 1)
        .attr("d", area);

      // Main line
      g.append("path")
        .datum(groupedData.predicted2)
        .attr("fill", "none")
        .attr("stroke", "#EF4444")
        .attr("stroke-width", isMobile ? 1.8 : 2.5)
        .attr("stroke-dasharray", isMobile ? "8,5" : "10,6")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", line);
    }

    // ENHANCED: Create clickable dots with improved workflow
    const createDots = (points: ContinuousDataPoint[], className: string, color: string, type: 'historical' | 'predicted1' | 'predicted2') => {
      console.log(`🎯 Creating ${type} dots:`, points.length, 'points'); // DEBUG
      
      const visiblePoints = points.filter(p => !p.isBridgePoint);
      console.log(`👁️ Visible ${type} points:`, visiblePoints.length); // DEBUG
      
      const dotSpacing = isMobile ? 20 : 25;
      const dotData = visiblePoints.filter((_, i) => i % Math.max(1, Math.floor(visiblePoints.length / dotSpacing)) === 0);

      console.log(`🔵 Final ${type} dot data:`, dotData.length); // DEBUG

      g.selectAll(`.${className}`)
        .data(dotData)
        .enter().append("circle")
        .attr("class", className)
        .attr("cx", d => xScale(d.date))
        .attr("cy", d => yScale(d.value))
        .attr("r", isMobile ? 3 : 4)
        .attr("fill", isDarkMode ? "#1e293b" : "#ffffff")
        .attr("stroke", color)
        .attr("stroke-width", isMobile ? 2 : 2.5)
        .style("cursor", "pointer")
        .style("pointer-events", "all")
        .on("click", function (event, d) {
          console.log(`🎯 ${type.toUpperCase()} dot clicked!`); // DEBUG
          handleDotClick(event, d);
        })
        .on("mouseover", function (d) {
          // Only show hover if no scenario popup is active
          if (!scenarioPopup && !isMobile) {
            d3.select(this)
              .transition()
              .duration(150)
              .attr("r", 6)
              .attr("fill", color)
              .attr("stroke-width", 3);
          }
        })
        .on("mouseout", function () {
          if (!scenarioPopup && !isMobile) {
            d3.select(this)
              .transition()
              .duration(150)
              .attr("r", isMobile ? 3 : 4)
              .attr("fill", isDarkMode ? "#1e293b" : "#ffffff")
              .attr("stroke-width", isMobile ? 2 : 2.5);
          }
        });
    };

    // Create enhanced dots for each data type
    createDots(groupedData.historical, "historical-dot", "#DC2626", "historical");
    createDots(groupedData.predicted1, "predicted1-dot", "#F97316", "predicted1");
    createDots(groupedData.predicted2, "predicted2-dot", "#EF4444", "predicted2");

    // MOBILE-OPTIMIZED AXES
    const axisTextColor = isDarkMode ? "#94a3b8" : "#64748b";
    const axisLineColor = isDarkMode ? "#475569" : "#cbd5e1";

    const xAxisGenerator = d3.axisBottom(xScale)
      .tickFormat(intelligentTimeFormatter as any)
      .ticks(isMobile ? 3 : Math.min(6, width / 120))
      .tickSizeOuter(0)
      .tickPadding(6);

    const yAxisGenerator = d3.axisLeft(yScale)
      .tickFormat((d: any) => formatMagnitude(d))
      .ticks(isMobile ? 3 : 5)
      .tickSizeOuter(0)
      .tickPadding(6);

    // Enhanced X-axis
    const xAxis = g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxisGenerator);

    xAxis.selectAll("text")
      .attr("fill", axisTextColor)
      .attr("font-size", isMobile ? "9px" : "11px")
      .attr("font-weight", "500")
      .attr("dy", "10px");

    // Enhanced Y-axis
    const yAxis = g.append("g")
      .attr("class", "y-axis")
      .call(yAxisGenerator);

    yAxis.selectAll("text")
      .attr("fill", axisTextColor)
      .attr("font-size", isMobile ? "9px" : "11px")
      .attr("font-weight", "500")
      .attr("dx", "-6px");

    // Style axis paths and ticks
    g.selectAll(".x-axis path, .y-axis path")
      .attr("stroke", axisLineColor)
      .attr("stroke-width", 1);

    g.selectAll(".x-axis .tick line, .y-axis .tick line")
      .attr("stroke", axisLineColor)
      .attr("stroke-width", 0.8)
      .attr("opacity", 0.7);

    // HOVER EFFECT - ONLY WHEN NO SCENARIO POPUP IS ACTIVE
    if (!isMobile) {
      const hoverGroup = g.append("g").attr("class", "hover-group").style("pointer-events", "none");

      const hoverLine = hoverGroup.append("line")
        .attr("class", "hover-line")
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", isDarkMode ? "#cbd5e1" : "#475569")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3")
        .attr("opacity", 0);

      const createHoverCircle = (className: string, color: string) => {
        return hoverGroup.append("circle")
          .attr("class", className)
          .attr("r", 4)
          .attr("fill", color)
          .attr("stroke", isDarkMode ? "#1e293b" : "#ffffff")
          .attr("stroke-width", 2)
          .attr("opacity", 0);
      };

      const historicalHoverCircle = createHoverCircle("hover-circle-historical", "#DC2626");
      const predicted1HoverCircle = createHoverCircle("hover-circle-predicted1", "#F97316");
      const predicted2HoverCircle = createHoverCircle("hover-circle-predicted2", "#EF4444");

      const bisectDate = d3.bisector<ContinuousDataPoint, Date>((d) => d.date).left;

      // Enhanced overlay for mouse events - DISABLED WHEN SCENARIO POPUP IS ACTIVE
      g.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "transparent")
        .style("pointer-events", "all")
        .on("mousemove", (event) => {
          // Don't show hover if scenario popup is active
          if (scenarioPopup) return;

          const [mouseX] = d3.pointer(event);
          const x0 = xScale.invert(mouseX);

          const i = bisectDate(continuousData, x0, 1);
          const d0 = continuousData[i - 1];
          const d1 = continuousData[i];
          let nearestPoint = d0;
          if (d1 && d0) {
            nearestPoint = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;
          }

          if (!nearestPoint) {
            hoverLine.attr("opacity", 0);
            historicalHoverCircle.attr("opacity", 0);
            predicted1HoverCircle.attr("opacity", 0);
            predicted2HoverCircle.attr("opacity", 0);
            setHoveredData(null);
            return;
          }

          hoverLine
            .attr("x1", mouseX)
            .attr("x2", mouseX)
            .attr("opacity", 0.7);

          const pointsAtTime = continuousData.filter(p => {
            const timeDiff = Math.abs(p.date.getTime() - nearestPoint.date.getTime());
            return timeDiff < 60000;
          }).filter(p => !p.isBridgePoint);

          historicalHoverCircle.attr("opacity", 0);
          predicted1HoverCircle.attr("opacity", 0);
          predicted2HoverCircle.attr("opacity", 0);

          pointsAtTime.forEach(point => {
            const cx = xScale(point.date);
            const cy = yScale(point.value);

            if (cx >= 0 && cx <= width && cy >= 0 && cy <= height) {
              if (point.type === 'historical') {
                historicalHoverCircle.attr("cx", cx).attr("cy", cy).attr("opacity", 1);
              } else if (point.type === 'predicted1') {
                predicted1HoverCircle.attr("cx", cx).attr("cy", cy).attr("opacity", 1);
              } else if (point.type === 'predicted2') {
                predicted2HoverCircle.attr("cx", cx).attr("cy", cy).attr("opacity", 1);
              }
            }
          });

          setHoveredData({
            date: nearestPoint.date,
            points: pointsAtTime,
            mouseX: mouseX + margin.left,
            nearestPoint: nearestPoint
          });
        })
        .on("mouseout", () => {
          // Don't hide hover if scenario popup is active
          if (scenarioPopup) return;

          hoverLine.attr("opacity", 0);
          historicalHoverCircle.attr("opacity", 0);
          predicted1HoverCircle.attr("opacity", 0);
          predicted2HoverCircle.attr("opacity", 0);
          setHoveredData(null);
        })
        .on("click", (event) => {
          // If clicking on empty space and no popup, do nothing
          // If clicking with popup open, close it
          if (scenarioPopup) {
            closeScenarioPopup();
          }
        });
    } else {
      // Mobile: Simple click overlay
      g.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "transparent")
        .style("pointer-events", "all")
        .on("click", () => {
          if (scenarioPopup) {
            closeScenarioPopup();
          }
        });
    }

    // MOBILE-OPTIMIZED ZOOM BEHAVIOR
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, isMobile ? 8 : 20])
      .extent([[0, 0], [width, height]])
      .translateExtent([
        [0, 0],
        [width, height]
      ])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const transform = event.transform;

        let constrainedTransform = transform;

        if (transform.k <= 1.1) {
          constrainedTransform = d3.zoomIdentity.scale(transform.k);
        } else {
          const maxTranslateX = (transform.k - 1) * width * 0.5;
          const maxTranslateY = (transform.k - 1) * height * 0.5;

          constrainedTransform = d3.zoomIdentity
            .scale(transform.k)
            .translate(
              Math.max(-maxTranslateX, Math.min(maxTranslateX, transform.x)),
              Math.max(-maxTranslateY, Math.min(maxTranslateY, transform.y))
            );
        }

        setZoomTransform(constrainedTransform);
        setZoomLevel(constrainedTransform.k);

        const newXScale = constrainedTransform.rescaleX(xScale);
        const newYScale = constrainedTransform.rescaleY(yScale);

        g.select('.x-axis')
          .call(d3.axisBottom(newXScale).tickFormat(intelligentTimeFormatter as any).tickSizeOuter(0).tickPadding(6) as any);

        g.select('.y-axis')
          .call(d3.axisLeft(newYScale).tickFormat((d: any) => formatMagnitude(d)).tickSizeOuter(0).tickPadding(6) as any);

        const controlledTransformString = `translate(${constrainedTransform.x}, ${constrainedTransform.y}) scale(${constrainedTransform.k})`;

        g.selectAll("path:not(.domain):not(.upper-threshold-line):not(.lower-threshold-line)")
          .attr("transform", controlledTransformString);
        g.selectAll("circle").attr("transform", controlledTransformString);

        g.selectAll(".upper-threshold-line, .lower-threshold-line")
          .attr("transform", controlledTransformString);
        g.selectAll(".upper-threshold-zone, .lower-threshold-zone")
          .attr("transform", controlledTransformString);
        g.selectAll(".upper-threshold-label, .lower-threshold-label")
          .attr("transform", controlledTransformString);

        g.selectAll(".grid-y line")
          .attr("transform", controlledTransformString);
        g.selectAll(".grid-x line")
          .attr("transform", controlledTransformString);

        if (hoveredData && !scenarioPopup) setHoveredData(null);
      });

    // Apply zoom with enhanced behavior
    if (!isMobile) {
      svg.call(zoom);
    }

  }, [data, dimensions, selectedRange, upperThreshold, lowerThreshold, index, isDarkMode, isMobile, isTablet, showThresholds, scenarioPopup]);

  const resetZoom = () => {
    if (svgRef.current && !isMobile) {
      const svg = d3.select(svgRef.current);
      svg.transition()
        .duration(750)
        .call(
          d3.zoom<SVGSVGElement, unknown>().transform,
          d3.zoomIdentity
        );
      setZoomTransform(null);
      setZoomLevel(1);
    }
  };

  const zoomIn = () => {
    if (svgRef.current && !isMobile) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy,
        1.4
      );
    }
  };

  const zoomOut = () => {
    if (svgRef.current && !isMobile) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy,
        1 / 1.4
      );
    }
  };

  const dataArray = getDataArray();
  if (dataArray.length === 0) {
    return (
      <div
        className={`w-full rounded-2xl sm:rounded-3xl border relative backdrop-blur-xl ${isDarkMode
          ? 'border-neutral-700/50 bg-slate-900/60'
          : 'border-neutral-200/60 bg-white/95'
          }`}
        style={{ height: isMobile ? '380px' : isTablet ? '450px' : '550px' }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <motion.div
              className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}>Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full border relative rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl backdrop-blur-xl transition-all duration-300 ${isDarkMode
        ? 'border-neutral-700/50 bg-slate-900/60'
        : 'border-neutral-200/60 bg-white/95'
        }`}
      style={{ height: isMobile ? '380px' : isTablet ? '450px' : '550px' }}
    >
      {/* MOBILE-OPTIMIZED HEADER */}
      <div className={`${isMobile
          ? 'flex flex-col gap-3 p-3'
          : 'flex flex-row items-center justify-between p-6 gap-4'
        } border-b rounded-t-2xl sm:rounded-t-3xl backdrop-blur-xl ${isDarkMode ? 'border-neutral-700/50 bg-slate-900/80' : 'border-neutral-200/60 bg-white/80'
        }`}>

        {/* Stock Info */}
        <motion.div
          className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={`${isMobile ? 'p-1.5' : 'p-2.5 sm:p-3'} rounded-xl shadow-lg ${
                  isDarkMode
                    ? 'bg-red-800 text-white hover:bg-red-700'
                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                }`}>
            <BarChart3 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-white`} />
          </div>
          <div>
            <h3 className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg'} font-bold leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}>{stockName}</h3>
            <p className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} flex items-center gap-1.5 font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
              }`}>
              <Activity className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4'}`} />
              Real-time Analytics{!isMobile && ` • Zoom: ${zoomLevel.toFixed(1)}x`}
            </p>
          </div>
        </motion.div>

        {/* MOBILE-STACKED CONTROLS */}
        {isMobile ? (
          <div className="flex flex-col items-center justify-between">
            {/* Legend */}
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-sm"></div>
                <span className={`font-bold ${isDarkMode ? 'text-white/80' : 'text-neutral-700'}`}>Historical</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-sm"></div>
                <span className={`font-bold ${isDarkMode ? 'text-white/80' : 'text-neutral-700'}`}>Pred 1</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2.5 h-2.5 bg-red-400 rounded-full shadow-sm"></div>
                <span className={`font-bold ${isDarkMode ? 'text-white/80' : 'text-neutral-700'}`}>Pred 2</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              {/* Time Range Selector */}
              <div className={`flex items-center space-x-1 rounded-lg p-0.5 border backdrop-blur-xl ${isDarkMode ? 'bg-white/5 border-white/20' : 'bg-white/60 border-neutral-200/60'
                }`}>
                {availableRanges.map((range) => (
                  <motion.button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    className={`px-2 py-1 text-xs font-bold rounded-md transition-all duration-200 ${selectedRange === range
                        ? 'bg-neutral-600 text-white shadow-md'
                        : isDarkMode
                          ? 'text-white/70 hover:text-white hover:bg-white/10'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/80'
                      }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {range}
                  </motion.button>
                ))}
              </div>

              {/* Threshold Toggle */}
              <motion.button
                onClick={() => setShowThresholds(!showThresholds)}
                className={`p-1.5 rounded-lg transition-all duration-200 border backdrop-blur-xl ${showThresholds
                    ? isDarkMode
                      ? 'text-red-400 bg-red-500/10 border-red-500/30'
                      : 'text-red-600 bg-red-50/80 border-red-200/50'
                    : isDarkMode
                      ? 'text-white/70 hover:text-white hover:bg-white/10 border-white/20'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/80 border-neutral-200/60'
                  }`}
                whileTap={{ scale: 0.9 }}
              >
                <Eye className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>
        ) : (
          /* DESKTOP LAYOUT */
          <>
            {/* Legend */}
            <div className="flex items-center space-x-4 sm:space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded-full shadow-sm border border-red-200/50"></div>
                <span className={`font-bold ${isDarkMode ? 'text-white/80' : 'text-neutral-700'}`}>Historical</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm border border-orange-200/50"></div>
                <span className={`font-bold ${isDarkMode ? 'text-white/80' : 'text-neutral-700'}`}>Predicted 1</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full shadow-sm border border-red-100/50"></div>
                <span className={`font-bold ${isDarkMode ? 'text-white/80' : 'text-neutral-700'}`}>Predicted 2</span>
              </div>
            </div>

            {/* Desktop Controls */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Time Range Selector */}
              <div className={`flex items-center space-x-1 rounded-xl p-1 border backdrop-blur-xl ${isDarkMode ? 'bg-white/5 border-white/20' : 'bg-white/60 border-neutral-200/60'
                }`}>
                {availableRanges.map((range) => (
                  <motion.button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-bold rounded-lg transition-all duration-200 ${selectedRange === range
                        ? isDarkMode
                        ? 'bg-red-800 text-white hover:bg-red-700 shadow-md'
                    : 'bg-neutral-800 text-white hover:bg-neutral-700 shadow-md'
                        : isDarkMode
                          ? 'text-white/70 hover:text-white hover:bg-white/10'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/80'
                      }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {range}
                  </motion.button>
                ))}
              </div>

              {/* Zoom Controls */}
              <div className={`flex items-center space-x-1 rounded-xl p-1 border backdrop-blur-xl ${isDarkMode ? 'bg-white/5 border-white/20' : 'bg-white/60 border-neutral-200/60'
                }`}>
                <motion.button
                  onClick={zoomOut}
                  className={`p-2 rounded-lg transition-all duration-200 ${isDarkMode
                      ? 'text-white/70 hover:text-white hover:bg-white/10'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/80'
                    }`}
                  whileTap={{ scale: 0.9 }}
                >
                  <ZoomOut className="w-4 h-4" />
                </motion.button>

                <motion.button
                  onClick={zoomIn}
                  className={`p-2 rounded-lg transition-all duration-200 ${isDarkMode
                      ? 'text-white/70 hover:text-white hover:bg-white/10'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/80'
                    }`}
                  whileTap={{ scale: 0.9 }}
                >
                  <ZoomIn className="w-4 h-4" />
                </motion.button>

                <motion.button
                  onClick={resetZoom}
                  className={`p-2 rounded-lg transition-all duration-200 ${isDarkMode
                      ? 'text-white/70 hover:text-white hover:bg-white/10'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/80'
                    }`}
                  whileTap={{ scale: 0.9 }}
                >
                  <RotateCcw className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Threshold Toggle */}
              <motion.button
                onClick={() => setShowThresholds(!showThresholds)}
                className={`p-2 rounded-xl transition-all duration-200 border backdrop-blur-xl ${showThresholds
                    ? isDarkMode
                      ? 'text-red-400 bg-red-500/10 border-red-500/30'
                      : 'text-red-600 bg-red-50/80 border-red-200/50'
                    : isDarkMode
                      ? 'text-white/70 hover:text-white hover:bg-white/10 border-white/20'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/80 border-neutral-200/60'
                  }`}
                whileTap={{ scale: 0.9 }}
              >
                <Eye className="w-4 h-4" />
              </motion.button>
            </div>
          </>
        )}
      </div>

      {/* Chart Container */}
      <div className={`relative ${isMobile ? 'p-3' : 'p-4 sm:p-6'}`}
        style={{ height: isMobile ? '300px' : isTablet ? '360px' : '420px' }}>
        <svg
          ref={svgRef}
          className={`w-full ${!isMobile ? 'cursor-move' : ''}`}
          style={{ height: isMobile ? '300px' : isTablet ? '360px' : '420px' }}
        ></svg>

        {/* Hover Tooltip - Desktop Only - ONLY WHEN NO SCENARIO POPUP */}
        <AnimatePresence>
          {hoveredData && !isMobile && !scenarioPopup && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={`absolute top-4 p-3 sm:p-4 rounded-xl shadow-2xl border pointer-events-none backdrop-blur-xl z-10 ${isDarkMode
                  ? 'border-neutral-700/50 bg-slate-900/95 text-white'
                  : 'border-neutral-200/60 bg-white/95 text-neutral-900'
                }`}
              style={{
                left: Math.min(Math.max(10, hoveredData.mouseX + 15), dimensions.width - 200),
              }}
            >
              <p className={`text-xs font-bold mb-3 ${isDarkMode ? 'text-white/70' : 'text-neutral-600'}`}>
                {d3.timeFormat("%b %d, %Y %H:%M")(hoveredData.date)}
              </p>
              <div className="space-y-2">
                {hoveredData.points.map((point, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${point.type === 'historical' ? 'bg-red-600' :
                          point.type === 'predicted1' ? 'bg-orange-500' : 'bg-red-400'
                        }`} />
                      <span className="font-bold">
                        {point.type === 'predicted1' ? 'Predicted 1' : point.type === 'predicted2' ? 'Predicted 2' : 'Historical'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-base">{formatMagnitude(point.value)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NEW: Scenario Popup - ONLY FOR PREDICTED VALUES WITH SCENARIOS */}
        <AnimatePresence>
          {scenarioPopup && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm z-20"
                onClick={closeScenarioPopup}
              />

              {/* Scenario Popup */}
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.9,
                  y: 20
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0
                }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`absolute z-30 rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-xl ${isMobile
                    ? 'w-[90vw] max-w-sm left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2'
                    : 'w-[400px]'
                  } ${isDarkMode
                    ? 'border-neutral-700/50 bg-slate-900/95'
                    : 'border-neutral-200/60 bg-white/95'
                  }`}
                style={!isMobile ? {
                  left: Math.min(
                    Math.max(20, scenarioPopup.position.x - 200),
                    dimensions.width - 420
                  ),
                  top: Math.max(
                    20,
                    Math.min(scenarioPopup.position.y - 100, dimensions.height - 300)
                  )
                } : {}}
              >
                {/* Header */}
                <div className={`p-4 border-b ${isDarkMode ? 'border-neutral-700/50 bg-slate-900/80' : 'border-neutral-200/60 bg-white/80'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${scenarioPopup.type === 'predicted1'
                          ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`font-bold text-base leading-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
                          }`}>
                          Scenario Analysis
                        </h3>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                          }`}>
                          {scenarioPopup.type === 'predicted1' ? 'Predicted Value 1' : 'Predicted Value 2'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={closeScenarioPopup}
                      className={`p-2 rounded-lg transition-colors hover:bg-red-100 dark:hover:bg-red-900/20 ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                        }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Value Display */}
                  <div className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/20' : 'bg-neutral-50 border-neutral-200'
                    }`}>
                    <div>
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                        }`}>Value</p>
                      <p className={`text-xl font-bold font-mono ${isDarkMode ? 'text-white' : 'text-neutral-900'
                        }`}>{formatMagnitude(scenarioPopup.value)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                        }`}>Date</p>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white/80' : 'text-neutral-700'
                        }`}>
                        {d3.timeFormat("%b %d, %Y")(scenarioPopup.date)}
                      </p>
                    </div>
                  </div>

                  {/* Scenario Text */}
                  <div className={`p-4 rounded-xl border ${scenarioPopup.type === 'predicted1'
                      ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700/50'
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700/50'
                    }`}>
                    <h4 className={`font-bold text-sm mb-2 ${isDarkMode ? 'text-white' : 'text-neutral-900'
                      }`}>
                      Scenario Description
                    </h4>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-white/80' : 'text-neutral-700'
                      }`}>
                      {scenarioPopup.scenario}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className={`px-4 py-3 border-t ${isDarkMode ? 'border-neutral-700/50 bg-slate-900/60' : 'border-neutral-200/60 bg-neutral-50'
                  }`}>
                  <p className={`text-xs text-center font-medium ${isDarkMode ? 'text-white/60' : 'text-neutral-500'
                    }`}>
                    Click anywhere to close
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div>
        <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-center flex items-center justify-center gap-2 font-bold ${isDarkMode ? 'text-white/60' : 'text-neutral-500'
          }`}>
          <Move className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
          {isMobile ? 'Tap predicted dots with scenarios' : 'Hover for details • Click predicted dots for scenario analysis'}
        </p>
      </div>
    </div>
  );
};

export default GraphMonitorComponent;