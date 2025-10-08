//Mobile Responsive SignalTrackerPage.tsx
import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { Marker, Popup } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import RightSidebar from "../components/RightSidebar";
import { AnimatePresence, motion } from "framer-motion";
import Dock from "../components/ui/Dock";
import ThemeToggle from "../components/ui/ThemeToggle";
import AISearchComponent from "../components/AISearchComponent";
import Toast from "../components/ui/Toast";
import {
  BarChart3,
  Menu,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Globe,
  Eye,
  Share2,
  Trash2,
  Search,
  ZoomIn,
  ArrowLeft,
  Signal,
  AlertCircle,
  Shield,
  Plane,
  Factory,
  Users,
  Building2,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  Layers
} from "lucide-react";
import { useTheme } from '../context/ThemeContext';

// Use environment variable or fallback
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoidGVzdCIsImEiOiJjbGFtcGxlIn0.test';

interface EventLocation {
  place: string;
  lat: number;
  lng: number;
}

interface SignalEvent {
  id: string;
  name: string;
  value: number;
  location: EventLocation;
  region: string;
  trend: 'up' | 'down' | 'stable';
  impactLevel: 'high' | 'medium' | 'low';
  related: SignalEvent[];
}

// Enhanced mock events with realistic Dubai Crime and UAE SAF data
const mockEvents: SignalEvent[] = [
  {
    id: "DUBAI_CRIME",
    name: "Dubai Crime Impact",
    value: 95,
    location: { place: "Dubai", lat: 25.2048, lng: 55.2708 },
    region: "UAE",
    trend: "down",
    impactLevel: "high",
    related: [
      {
        id: "ECONOMIC_GROWTH",
        name: "Economic Growth Impact",
        value: 88,
        location: { place: "Dubai Financial District", lat: 25.1972, lng: 55.2744 },
        region: "UAE",
        trend: "up",
        impactLevel: "high",
        related: [],
      },
      {
        id: "TOURISM_SURGE",
        name: "Tourism Surge Effect",
        value: 82,
        location: { place: "Dubai Tourism Areas", lat: 25.2084, lng: 55.2719 },
        region: "UAE",
        trend: "up",
        impactLevel: "medium",
        related: [],
      },
      {
        id: "POLICE_TECH",
        name: "Smart Policing Technology",
        value: 91,
        location: { place: "Dubai Police HQ", lat: 25.2450, lng: 55.3059 },
        region: "UAE",
        trend: "up",
        impactLevel: "high",
        related: [],
      },
      {
        id: "SOCIAL_PROGRAMS",
        name: "Community Social Programs",
        value: 76,
        location: { place: "Dubai Municipality", lat: 25.2285, lng: 55.2889 },
        region: "UAE",
        trend: "up",
        impactLevel: "medium",
        related: [],
      },
    ],
  },
  {
    id: "UAE_SAF",
    name: "UAE SAF Transition",
    value: 82,
    location: { place: "UAE", lat: 24.4539, lng: 54.3773 },
    region: "UAE",
    trend: "up",
    impactLevel: "high",
    related: [
      {
        id: "EU_SAF_MANDATE",
        name: "EU SAF Mandates",
        value: 89,
        location: { place: "Brussels, EU", lat: 50.8503, lng: 4.3517 },
        region: "Global",
        trend: "up",
        impactLevel: "high",
        related: [],
      },
      {
        id: "US_SAF_POLICY",
        name: "US SAF Policy Changes",
        value: 85,
        location: { place: "Washington DC", lat: 38.9072, lng: -77.0369 },
        region: "Global",
        trend: "up",
        impactLevel: "high",
        related: [],
      },
      {
        id: "ADNOC_INVESTMENT",
        name: "ADNOC SAF Investment",
        value: 78,
        location: { place: "Abu Dhabi", lat: 24.4539, lng: 54.3773 },
        region: "UAE",
        trend: "up",
        impactLevel: "medium",
        related: [],
      },
      {
        id: "EMIRATES_FLEET",
        name: "Emirates Fleet Transition",
        value: 71,
        location: { place: "Dubai International Airport", lat: 25.2532, lng: 55.3657 },
        region: "UAE",
        trend: "up",
        impactLevel: "medium",
        related: [],
      },
    ],
  },
];

// Enhanced location data with realistic Dubai crime locations
const mockLocationData: Record<
  string,
  { location: string; value: number; lat: number; lng: number; trend: 'up' | 'down' | 'stable'; innerRegions?: any[] }[]
> = {
  "DUBAI_CRIME": [
    {
      location: "Dubai",
      value: 94,
      lat: 25.2048,
      lng: 55.2708,
      trend: "down",
      innerRegions: [
        { name: "Dubai Marina", value: 96, lat: 25.0769, lng: 55.1413, trend: "down", crimeType: "Petty Theft" },
        { name: "Downtown Dubai", value: 98, lat: 25.1968, lng: 55.2788, trend: "down", crimeType: "Financial Crime" },
        { name: "Jumeirah Beach", value: 93, lat: 25.2285, lng: 55.2708, trend: "stable", crimeType: "Tourist-Related" },
        { name: "Deira Old Souk", value: 91, lat: 25.2697, lng: 55.3094, trend: "down", crimeType: "Commercial Crime" },
      ]
    },
    {
      location: "Abu Dhabi",
      value: 96,
      lat: 24.4539,
      lng: 54.3773,
      trend: "down",
      innerRegions: [
        { name: "Al Reem Island", value: 97, lat: 24.4945, lng: 54.4091, trend: "down", crimeType: "Residential" },
        { name: "Saadiyat Island", value: 99, lat: 24.5609, lng: 54.4341, trend: "down", crimeType: "Tourist Areas" },
      ]
    },
    { location: "Sharjah", value: 89, lat: 25.3463, lng: 55.4209, trend: "stable" },
    { location: "Ajman", value: 87, lat: 25.4052, lng: 55.5136, trend: "down" },
  ],
  "UAE_SAF": [],
};

export default function SignalTrackerPage() {
  const { isDarkMode } = useTheme();

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [activeEvent, setActiveEvent] = useState<SignalEvent | null>(null);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'location' | 'contributing'>('location');
  const [selectedStock, setSelectedStock] = useState<string>('DUBAI_CRIME');
  const [zoomedRegion, setZoomedRegion] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  // Mobile responsive states
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showMobileToggle, setShowMobileToggle] = useState(false);

  const arrowLayerId = "animated-arrows";
  const animationFrameId = useRef<number | null>(null);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);

      // Auto-collapse sidebar on mobile
      if (width < 768) {
        setIsLeftSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get impact level color
  const getImpactColor = (impactLevel: 'high' | 'medium' | 'low'): string => {
    switch (impactLevel) {
      case 'high': return '#EF4444'; // Red - High impact
      case 'medium': return '#F97316'; // Orange - Medium impact  
      case 'low': return '#10B981'; // Green - Low impact
      default: return '#3B82F6';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return '#EF4444';
      case 'down': return '#10B981';
      case 'stable': return '#6B7280';
      default: return '#3B82F6';
    }
  };

  // Clean up markers helper
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  const resetZoom = () => {
    const map = mapRef.current;
    if (!map) return;

    setZoomedRegion(null);
    map.flyTo({
      center: [55, 25],
      zoom: 6,
      duration: 1500
    });
  };

  // Map initialization with dynamic theme
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: isDarkMode ? "mapbox://styles/mapbox/dark-v10" : "mapbox://styles/mapbox/light-v10",
      center: [55, 25],
      zoom: 6,
      projection: "mercator",
      maxBounds: [[-180, -85], [180, 85]],
      preserveDrawingBuffer: true,
      antialias: true
    });

    mapRef.current = map;

    map.on("load", () => {
      addRegionLayers();
      renderEventsOnMap();
    });

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      clearMarkers();
      if (map) {
        map.remove();
      }
      mapRef.current = null;
    };
  }, []);

  // Update map style when theme changes
  useEffect(() => {
    if (mapRef.current) {
      const newStyle = isDarkMode ? "mapbox://styles/mapbox/dark-v10" : "mapbox://styles/mapbox/light-v10";
      mapRef.current.setStyle(newStyle);

      mapRef.current.once('style.load', () => {
        addRegionLayers();
        renderEventsOnMap();
      });
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (mapRef.current) {
      renderEventsOnMap();
    }
  }, [viewMode, selectedStock, zoomedRegion]);

  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.resize();
    }, 300);
    return () => clearTimeout(timer);
  }, [isLeftSidebarCollapsed, isPanelOpen]);

  // Auto-switch to contributing view for UAE SAF
  useEffect(() => {
    if (selectedStock === 'UAE_SAF' && viewMode === 'location') {
      setViewMode('contributing');
    }
  }, [selectedStock]);

  const addRegionLayers = () => {
    const map = mapRef.current;
    if (!map) return;

    const uaeGeoJSON: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [51.5795, 22.4969],
          [56.3264, 22.4969],
          [56.3264, 26.2041],
          [51.5795, 26.2041],
          [51.5795, 22.4969]
        ]]
      },
      properties: {
        region: "UAE",
        color: "#10B981"
      }
    };

    if (!map.getSource('region-source')) {
      map.addSource('region-source', {
        type: 'geojson',
        data: uaeGeoJSON
      });

      map.addLayer({
        id: 'region-fill',
        type: 'fill',
        source: 'region-source',
        layout: {},
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.15
        }
      });

      map.addLayer({
        id: 'region-glow',
        type: 'line',
        source: 'region-source',
        layout: {},
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
          'line-opacity': 0.6,
          'line-blur': 2
        }
      });
    }
  };

  const renderEventsOnMap = () => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers and layers
    clearMarkers();
    if (map.getLayer(arrowLayerId)) {
      map.removeLayer(arrowLayerId);
    }
    if (map.getSource(arrowLayerId)) {
      map.removeSource(arrowLayerId);
    }

    const currentEvent = mockEvents.find(e => e.id === selectedStock);
    if (!currentEvent) return;

    if (zoomedRegion) {
      renderInnerRegions(zoomedRegion);
    } else {
      if (viewMode === 'location' && selectedStock === 'DUBAI_CRIME') {
        const locationData = mockLocationData[selectedStock] || [];
        locationData.forEach((location, index) => {
          createEnhancedGlowMarker(location, index, getTrendColor(location.trend));
        });
      } else {
        drawContributingEvents(currentEvent);
      }
    }
  };

  const renderInnerRegions = (parentRegion: any) => {
    if (!parentRegion.innerRegions) return;

    parentRegion.innerRegions.forEach((region: any, index: number) => {
      createInnerRegionMarker(region, index);
    });
  };

  const createEnhancedGlowMarker = (location: any, index: number, color: string) => {
    const map = mapRef.current;
    if (!map) return;

    const el = document.createElement("div");
    el.className = "enhanced-pulse-marker";

    el.style.cssText = `
      width: 40px;
      height: 40px;
      cursor: pointer;
    `;

    // Create pulse waves
    for (let i = 0; i < 3; i++) {
      const wave = document.createElement("div");
      wave.className = "pulse-wave";
      wave.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: ${60 + i * 40}px;
        height: ${60 + i * 40}px;
        border: 1px solid ${color};
        border-radius: 50%;
        transform: translate(-50%, -50%);
        opacity: 0;
        z-index: ${3 - i};
        pointer-events: none;
      `;
      el.appendChild(wave);
    }

    const marker = document.createElement("div");
    marker.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 32px;
      height: 32px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: linear-gradient(135deg, ${color}80, ${adjustColorBrightness(color, -20)}80);
      border: 1px solid ${color};
      box-shadow: 
        0 0 20px ${color}60,
        0 0 40px ${color}30,
        inset 0 0 10px ${color}40;
      backdrop-filter: blur(2px);
      z-index: 10;
      transition: all 0.3s ease;
    `;

    const valueDisplay = document.createElement("div");
    valueDisplay.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 11px;
      font-weight: bold;
      text-shadow: 0 0 10px ${color}, 0 0 20px ${color}80;
      z-index: 11;
      pointer-events: none;
      line-height: 1;
    `;
    valueDisplay.textContent = location.value.toString();

    const tooltip = document.createElement("div");
    tooltip.className = "enhanced-glow-tooltip";
    tooltip.innerHTML = `
      <div class="tooltip-header">
        <strong>${location.location}</strong>
        <span class="trend-badge trend-${location.trend}">${location.trend}</span>
      </div>
      <div class="tooltip-content">
        <div>Crime Index: <strong>${location.value}</strong></div>
        ${location.innerRegions ? '<div class="click-hint">👆 Click to zoom into areas</div>' : ''}
      </div>
    `;

    marker.appendChild(valueDisplay);
    el.appendChild(marker);
    el.appendChild(tooltip);

    let isHovered = false;
    el.addEventListener('mouseenter', () => {
      if (isHovered) return;
      isHovered = true;
      marker.style.transform = 'translate(-50%, -50%) scale(1.3)';
      tooltip.classList.add('show');
    });

    el.addEventListener('mouseleave', () => {
      if (!isHovered) return;
      isHovered = false;
      marker.style.transform = 'translate(-50%, -50%) scale(1)';
      tooltip.classList.remove('show');
    });

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (location.innerRegions) {
        setZoomedRegion(location);
        map.flyTo({
          center: [location.lng, location.lat],
          zoom: 12,
          duration: 1500
        });
      }
    });

    const mapboxMarker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    }).setLngLat([location.lng, location.lat]).addTo(map);

    markersRef.current.push(mapboxMarker);

    setTimeout(() => {
      const waves = el.querySelectorAll('.pulse-wave');
      waves.forEach((wave, waveIndex) => {
        const delay = index * 300 + waveIndex * 800;
        setTimeout(() => {
          (wave as HTMLElement).style.animation = `enhanced-pulse-wave ${2 + waveIndex}s infinite ease-out`;
        }, delay);
      });
    }, 100);
  };

  const createInnerRegionMarker = (region: any, index: number) => {
    const map = mapRef.current;
    if (!map) return;

    const color = getTrendColor(region.trend);
    const el = document.createElement("div");
    el.className = "inner-region-marker";

    el.style.cssText = `
      width: 28px;
      height: 28px;
      cursor: pointer;
    `;

    const marker = document.createElement("div");
    marker.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      height: 100%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: linear-gradient(135deg, ${color}90, ${adjustColorBrightness(color, -20)}90);
      border: 1px solid ${color};
      box-shadow: 0 0 15px ${color}50;
      backdrop-filter: blur(1px);
      animation: inner-region-pulse 3s ease-in-out infinite;
      animation-delay: ${index * 0.2}s;
      z-index: 10;
    `;

    const valueDisplay = document.createElement("div");
    valueDisplay.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 9px;
      font-weight: bold;
      text-shadow: 0 0 5px ${color};
      pointer-events: none;
      line-height: 1;
      z-index: 11;
    `;
    valueDisplay.textContent = region.value.toString();

    const tooltip = document.createElement("div");
    tooltip.className = "inner-region-tooltip";
    tooltip.innerHTML = `
      <div><strong>${region.name}</strong></div>
      <div>Crime Index: <strong>${region.value}</strong></div>
      <div>Type: <strong>${region.crimeType}</strong></div>
      <div class="trend-${region.trend}">${region.trend}</div>
    `;

    el.appendChild(marker);
    el.appendChild(valueDisplay);
    el.appendChild(tooltip);

    el.addEventListener('mouseenter', () => {
      marker.style.transform = 'translate(-50%, -50%) scale(1.3)';
      tooltip.classList.add('show');
    });

    el.addEventListener('mouseleave', () => {
      marker.style.transform = 'translate(-50%, -50%) scale(1)';
      tooltip.classList.remove('show');
    });

    const mapboxMarker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    }).setLngLat([region.lng, region.lat]).addTo(map);

    markersRef.current.push(mapboxMarker);
  };

  const adjustColorBrightness = (color: string, amount: number): string => {
    const usePound = color[0] === "#";
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = (num >> 8 & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;
    return (usePound ? "#" : "") + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
  };

  const drawContributingEvents = (mainEvent: SignalEvent) => {
    const map = mapRef.current;
    if (!map) return;

    createMainEventMarker(mainEvent);

    mainEvent.related.forEach((relatedEvent, index) => {
      createRelatedEventMarker(relatedEvent, index);
    });

    drawEnhancedConnections(mainEvent);
  };

  const createMainEventMarker = (event: SignalEvent) => {
    const map = mapRef.current;
    if (!map) return;

    const el = document.createElement("div");
    el.className = "main-event-marker enhanced-pulse-marker";
    el.style.cssText = `
      width: 50px;
      height: 50px;
    `;

    const color = getImpactColor(event.impactLevel);

    const pulse = document.createElement("div");
    pulse.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      height: 100%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: linear-gradient(135deg, ${color}70, ${adjustColorBrightness(color, -30)}70);
      border: 2px solid ${color};
      animation: main-enhanced-pulse 2s infinite ease-in-out;
      box-shadow: 
        0 0 30px ${color}60,
        0 0 60px ${color}30;
      backdrop-filter: blur(3px);
      z-index: 10;
    `;

    const icon = document.createElement("div");
    icon.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 14px;
      font-weight: bold;
      text-shadow: 0 0 10px ${color};
      z-index: 11;
      line-height: 1;
    `;
    icon.textContent = event.value.toString();

    const tooltip = document.createElement("div");
    tooltip.className = "main-event-tooltip";
    tooltip.innerHTML = `
      <div class="tooltip-header">
        <strong>${event.name}</strong>
        <span class="impact-badge impact-${event.impactLevel}">${event.impactLevel} impact</span>
      </div>
      <div class="tooltip-content">
        <div>Index: <strong>${event.value}</strong></div>
        <div>Location: <strong>${event.location.place}</strong></div>
      </div>
    `;

    el.appendChild(pulse);
    el.appendChild(icon);
    el.appendChild(tooltip);

    el.addEventListener('mouseenter', () => {
      tooltip.classList.add('show');
    });

    el.addEventListener('mouseleave', () => {
      tooltip.classList.remove('show');
    });

    const mapboxMarker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    }).setLngLat([event.location.lng, event.location.lat]).addTo(map);

    markersRef.current.push(mapboxMarker);
  };

  const createRelatedEventMarker = (event: SignalEvent, index: number) => {
    const map = mapRef.current;
    if (!map) return;

    const el = document.createElement("div");
    el.className = "related-event-marker";
    el.style.cssText = `
      width: 36px;
      height: 36px;
    `;

    const color = getImpactColor(event.impactLevel);

    const pulse = document.createElement("div");
    pulse.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      height: 100%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: linear-gradient(135deg, ${color}60, ${adjustColorBrightness(color, -20)}60);
      border: 1px solid ${color};
      animation: related-enhanced-pulse 2.5s infinite ease-in-out;
      animation-delay: ${index * 0.4}s;
      box-shadow: 0 0 20px ${color}40;
      backdrop-filter: blur(2px);
      z-index: 10;
    `;

    const valueText = document.createElement("div");
    valueText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 10px;
      font-weight: bold;
      text-shadow: 0 0 8px ${color};
      z-index: 11;
      line-height: 1;
    `;
    valueText.textContent = event.value.toString();

    const tooltip = document.createElement("div");
    tooltip.className = "related-event-tooltip";
    tooltip.innerHTML = `
      <div class="tooltip-header">
        <strong>${event.name}</strong>
        <span class="impact-badge impact-${event.impactLevel}">${event.impactLevel}</span>
      </div>
      <div class="tooltip-content">
        <div>Impact Index: <strong>${event.value}</strong></div>
        <div>Location: <strong>${event.location.place}</strong></div>
        <div>Trend: <span class="trend-${event.trend}">${event.trend}</span></div>
      </div>
    `;

    el.appendChild(pulse);
    el.appendChild(valueText);
    el.appendChild(tooltip);

    el.addEventListener('mouseenter', () => {
      tooltip.classList.add('show');
    });

    el.addEventListener('mouseleave', () => {
      tooltip.classList.remove('show');
    });

    const mapboxMarker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    }).setLngLat([event.location.lng, event.location.lat]).addTo(map);

    markersRef.current.push(mapboxMarker);
  };

  const drawEnhancedConnections = (mainEvent: SignalEvent) => {
    const map = mapRef.current;
    if (!map) return;

    const lineFeatures: GeoJSON.Feature<GeoJSON.LineString>[] = mainEvent.related.map((related) => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [mainEvent.location.lng, mainEvent.location.lat],
          [related.location.lng, related.location.lat]
        ]
      },
      properties: {
        impact: related.impactLevel,
        color: getImpactColor(related.impactLevel)
      }
    }));

    if (lineFeatures.length > 0) {
      map.addSource(arrowLayerId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: lineFeatures
        }
      });

      map.addLayer({
        id: arrowLayerId,
        type: 'line',
        source: arrowLayerId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.7
        }
      });
    }
  };

  const renderEmptyState = () => (
    <div className={`flex flex-col items-center justify-center h-full rounded-2xl sm:rounded-3xl border shadow-lg backdrop-blur-xl ${isDarkMode
        ? 'border-neutral-700/50 bg-slate-900/60'
        : 'border-neutral-200/60 bg-white/95'
      }`}>
      <motion.div
        className="text-center space-y-6 sm:space-y-8 p-8 sm:p-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center mx-auto relative ${isDarkMode
            ? 'bg-white/5'
            : 'bg-gradient-to-tr from-neutral-200/80 to-neutral-300/80'
          }`}>
          <Globe className={`w-10 h-10 sm:w-12 sm:h-12 ${isDarkMode ? 'text-red-500' : 'text-neutral-600'
            }`} />
          <motion.div
            className={`absolute inset-0 rounded-2xl border-2 ${isDarkMode ? 'border-red-500/30' : 'border-neutral-400/30'}`}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div>
          <h3 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
            }`}>No Signal Data Available</h3>
          <p className={`max-w-md text-sm sm:text-base font-medium leading-relaxed ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
            }`}>
            Select tracking signals to view on the map or use AI search to find new data sources.
          </p>
        </div>
        <motion.button
          onClick={() => setIsAiSearchOpen(true)}
          className={`px-6 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl text-sm sm:text-base ${isDarkMode
              ? 'bg-red-800 text-white hover:bg-red-700'
              : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          whileTap={{ scale: 0.97 }}
        >
          Find Signals with AI
        </motion.button>
      </motion.div>
    </div>
  );

  const renderContributingView = () => {
    const currentEvent = mockEvents.find(e => e.id === selectedStock);
    if (!currentEvent) return null;

    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-2xl border ${isDarkMode
            ? 'bg-red-900/20 border-red-700/50'
            : 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
          }`}>
          <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-red-300' : 'text-red-800'
            }`}>
            Selected Signal: {currentEvent.name}
          </h4>
          <p className={`text-sm ${isDarkMode ? 'text-red-400/80' : 'text-red-700'
            }`}>
            Click markers to zoom into crime hotspots
          </p>
        </div>

        <div className="space-y-3">
          <h5 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? 'text-white/80' : 'text-gray-700'
            }`}>
            <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
            Contributing Events
          </h5>

          {currentEvent.related && currentEvent.related.length > 0 ? (
            currentEvent.related
              .sort((a, b) => {
                const impactOrder = { high: 3, medium: 2, low: 1 };
                return impactOrder[b.impactLevel] - impactOrder[a.impactLevel];
              })
              .map((event, index) => (
                <motion.div
                  key={`${event.id}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 group ${isDarkMode
                      ? 'bg-slate-800/40 border-neutral-700/50 hover:bg-slate-800/60'
                      : 'bg-white/90 border-gray-200/60'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{event.name}</p>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getImpactColor(event.impactLevel) }}
                        ></div>
                      </div>
                      <p className={`text-sm mb-1 ${isDarkMode ? 'text-white/60' : 'text-gray-600'
                        }`}>Location: {event.location.place}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-full font-medium ${event.impactLevel === 'high' ?
                            (isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700') :
                            event.impactLevel === 'medium' ?
                              (isDarkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700') :
                              (isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700')
                          }`}>
                          {event.impactLevel} impact
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-xl font-bold"
                        style={{ color: getImpactColor(event.impactLevel) }}
                      >
                        {event.value}
                      </p>
                      <div className="flex items-center text-sm">
                        {event.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3 mr-1 text-red-600" />
                        ) : event.trend === 'down' ? (
                          <TrendingDown className="w-3 h-3 mr-1 text-green-600" />
                        ) : (
                          <ArrowRight className="w-3 h-3 mr-1 text-gray-600" />
                        )}
                        <span className={`font-medium ${event.trend === 'up' ? 'text-red-600' :
                            event.trend === 'down' ? 'text-green-600' :
                              'text-gray-600'
                          }`}>
                          {event.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
          ) : (
            <div className={`p-4 rounded-xl text-center ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
              No contributing events found for this signal.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLocationView = () => {
    const currentEvent = mockEvents.find(e => e.id === selectedStock);
    const locationData = mockLocationData[selectedStock] || [];

    if (selectedStock === 'UAE_SAF') {
      return (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border ${isDarkMode
              ? 'bg-orange-900/20 border-orange-700/50'
              : 'bg-orange-50 border-orange-200'
            }`}>
            <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-orange-300' : 'text-orange-800'
              }`}>
              UAE SAF Transition
            </h4>
            <p className={`text-sm ${isDarkMode ? 'text-orange-400/80' : 'text-orange-700'
              }`}>
              Location view not available for SAF analysis. Switch to Contributing view to see impact factors.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-2xl border ${isDarkMode
            ? 'bg-red-900/20 border-red-700/50'
            : 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
          }`}>
          <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-red-300' : 'text-red-800'
            }`}>
            Selected Signal: {currentEvent?.name}
          </h4>
          <p className={`text-sm ${isDarkMode ? 'text-red-400/80' : 'text-red-700'
            }`}>
            {zoomedRegion ? `Showing crime areas in ${zoomedRegion.location}` : 'Click markers to zoom into crime hotspots'}
          </p>
        </div>

        {zoomedRegion && (
          <motion.button
            onClick={resetZoom}
            className={`w-full flex items-center gap-2 p-3 rounded-xl transition-colors ${isDarkMode
                ? 'bg-slate-800/50 hover:bg-slate-700/50'
                : 'bg-gray-100 hover:bg-gray-200'
              }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to main regions
          </motion.button>
        )}

        <div className="space-y-3">
          <h5 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? 'text-white/80' : 'text-gray-700'
            }`}>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
            {zoomedRegion ? 'Crime Areas' : 'Regional Crime Index'}
          </h5>

          {zoomedRegion ? (
            zoomedRegion.innerRegions?.map((region: any, index: number) => (
              <motion.div
                key={region.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-2xl border shadow-sm ${isDarkMode
                    ? 'bg-slate-800/40 border-neutral-700/50'
                    : 'bg-white/90 border-gray-200/60'
                  }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{region.name}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-600'
                      }`}>Type: {region.crimeType}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-xl font-bold"
                      style={{ color: getTrendColor(region.trend) }}
                    >
                      {region.value}
                    </p>
                    <div className="flex items-center text-sm">
                      {region.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 mr-1 text-red-600" />
                      ) : region.trend === 'down' ? (
                        <TrendingDown className="w-3 h-3 mr-1 text-green-600" />
                      ) : (
                        <ArrowRight className="w-3 h-3 mr-1 text-gray-600" />
                      )}
                      <span className={`font-medium ${region.trend === 'up' ? 'text-red-600' :
                          region.trend === 'down' ? 'text-green-600' :
                            'text-gray-600'
                        }`}>
                        {region.trend}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            locationData.map((location, index) => (
              <motion.div
                key={location.location}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${isDarkMode
                    ? 'bg-slate-800/40 border-neutral-700/50 hover:bg-slate-800/60'
                    : 'bg-white/90 border-gray-200/60'
                  }`}
                onClick={() => {
                  if (location.innerRegions) {
                    setZoomedRegion(location);
                    const map = mapRef.current;
                    if (map) {
                      map.flyTo({
                        center: [location.lng, location.lat],
                        zoom: 12,
                        duration: 1500
                      });
                    }
                  }
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{location.location}</p>
                    {location.innerRegions && (
                      <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-600'
                        }`}>Click to view areas</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className="text-xl font-bold"
                      style={{ color: getTrendColor(location.trend) }}
                    >
                      {location.value}
                    </p>
                    <div className="flex items-center text-sm">
                      {location.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 mr-1 text-red-600" />
                      ) : location.trend === 'down' ? (
                        <TrendingDown className="w-3 h-3 mr-1 text-green-600" />
                      ) : (
                        <ArrowRight className="w-3 h-3 mr-1 text-gray-600" />
                      )}
                      <span className={`font-medium ${location.trend === 'up' ? 'text-red-600' :
                          location.trend === 'down' ? 'text-green-600' :
                            'text-gray-600'
                        }`}>
                        {location.trend}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`h-screen flex flex-col transition-all duration-500 font-inter antialiased relative overflow-hidden ${isDarkMode
        ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white'
        : 'bg-gradient-to-br from-brand-secondary-950 via-white to-brand-secondary-900 text-gray-900'
      }`}>

      {/* Enhanced Professional Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 blur-3xl ${isDarkMode
            ? 'bg-gradient-to-br from-red-500 to-neutral-600'
            : 'bg-gradient-to-br from-red-400 to-neutral-400'
          }`} />
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 blur-3xl ${isDarkMode
            ? 'bg-gradient-to-tr from-neutral-600 to-red-500'
            : 'bg-gradient-to-tr from-neutral-400 to-red-400'
          }`} />
      </div>

      {/* MOBILE MINIMAL HEADER */}
      {isMobile ? (
        <header className={`flex items-center justify-between px-4 h-16 backdrop-blur-xl shadow-sm border-b flex-shrink-0 z-30 transition-all duration-500 ${isDarkMode
            ? 'bg-slate-900/90 border-neutral-700/30'
            : 'bg-white/90 border-neutral-200/60'
          }`}>
          {/* Q Logo */}
          <motion.div
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src="/Q-logo.svg"
              alt="Quantifore logo"
              className="h-8 select-none drop-shadow-sm"
            />
          </motion.div>

          {/* Right Icons */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Menu Button */}
            <motion.button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className={`rounded-lg p-2.5 transition-all duration-200 shadow-sm border backdrop-blur-sm ${isDarkMode
                  ? 'text-white/80 hover:text-white hover:bg-white/10 bg-white/5 border-white/20'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 bg-white/60 border-neutral-200/60'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="h-5 w-5" />
            </motion.button>
          </div>
        </header>
      ) : (
        /* DESKTOP HEADER - Same as original */
        <header className={`flex items-center justify-between px-4 sm:px-8 lg:px-12 h-20 sm:h-24 backdrop-blur-xl shadow-sm border-b flex-shrink-0 z-30 transition-all duration-500 ${isDarkMode
            ? 'bg-slate-900/90 border-neutral-700/30'
            : 'bg-white/90 border-neutral-200/60'
          }`}>
          <motion.div
            className="flex items-center space-x-3 sm:space-x-5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={isDarkMode ? "/qf-logo-light.svg" : "/qf-logo-dark.svg"}
              alt="Quantifore logo"
              className="h-8 sm:h-10 select-none drop-shadow-sm"
            />
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`p-2 sm:p-3 rounded-xl shadow-lg ${isDarkMode ? 'bg-red-500/20' : 'bg-gradient-to-r from-neutral-300 to-neutral-400'
                }`}>
                <Signal className={`w-5 h-5 sm:w-6 sm:h-6 ${isDarkMode ? 'text-red-400' : 'text-neutral-900'
                  }`} />
              </div>
              <div>
                <div className={`text-lg sm:text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
                  }`}>
                  Signal
                </div>
                <div className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                  }`}>Location Analytics</div>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center space-x-3">
            {/* Live Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${isDarkMode
                ? 'bg-white/5 text-emerald-400 border border-white/20'
                : 'bg-white/60 text-emerald-700 border border-neutral-200/60'
              }`}>
              <motion.div
                className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                animate={{
                  opacity: [1, 0.5, 1],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="hidden sm:inline">Live Data</span>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Settings Button */}
            <motion.button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className={`rounded-lg sm:rounded-xl p-2 sm:p-3 transition-all duration-200 shadow-sm border backdrop-blur-sm ${isDarkMode
                  ? 'text-white/80 hover:text-white hover:bg-white/10 bg-white/5 border-white/20'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 bg-white/60 border-neutral-200/60'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.button>
          </div>
        </header>
      )}

      {/* MAIN CONTENT LAYOUT */}
      <main className={`flex-1 min-h-0 ${isMobile ? 'flex flex-col pb-20' : 'flex px-4 sm:px-8 lg:px-12 py-6 sm:py-8 gap-6'}`}>

        {/* MOBILE HORIZONTAL CONTROL BAR */}
        {isMobile && (
          <div className={`border-b backdrop-blur-xl flex-shrink-0 ${isDarkMode ? 'border-neutral-700/50 bg-slate-900/60' : 'border-neutral-200/60 bg-white/80'
            }`}>
            <div className="px-4 py-3">
              {/* Signal Selection */}
              <div className="mb-3">
                <div className={`flex items-center gap-2 mb-2`}>
                  <Signal className={`w-4 h-4 ${isDarkMode ? 'text-white' : 'text-neutral-900'}`} />
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                    Tracking Signals (2)
                  </span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {mockEvents.map((event) => (
                    <motion.button
                      key={event.id}
                      onClick={() => setSelectedStock(event.id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedStock === event.id
                          ? isDarkMode
                            ? 'bg-red-800 text-white'
                            : 'bg-neutral-800 text-white'
                          : isDarkMode
                            ? 'bg-white/5 text-white/70 hover:bg-white/10'
                            : 'bg-white/60 text-neutral-600 hover:bg-neutral-100/80'
                        }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {event.name}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Toggle Control - Mobile Version */}
              <div className="flex items-center justify-between">
                <div className={`text-sm font-bold ${isDarkMode ? 'text-white/80' : 'text-neutral-700'}`}>
                  View Mode
                </div>
                <motion.div
                  className={`flex items-center rounded-xl p-1 border backdrop-blur-xl ${isDarkMode ? 'bg-white/5 border-white/20' : 'bg-white/60 border-neutral-200/60'
                    }`}
                >
                  <button
                    onClick={() => setViewMode('location')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'location'
                        ? isDarkMode
                          ? 'bg-red-800 text-white'
                          : 'bg-neutral-800 text-white'
                        : isDarkMode
                          ? 'text-white/70 hover:text-white'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                  >
                    <MapPin className="w-3 h-3" />
                    Location
                  </button>
                  <button
                    onClick={() => setViewMode('contributing')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'contributing'
                        ? isDarkMode
                          ? 'bg-red-800 text-white'
                          : 'bg-neutral-800 text-white'
                        : isDarkMode
                          ? 'text-white/70 hover:text-white'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                  >
                    <Layers className="w-3 h-3" />
                    Contributing
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* DESKTOP SIDEBAR - Same as original but hidden on mobile */}
        {!isMobile && (
          <motion.aside
            className={`${isLeftSidebarCollapsed ? "w-16" : "w-80 lg:w-96"
              } flex-shrink-0 border rounded-2xl sm:rounded-3xl flex flex-col transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden backdrop-blur-xl ${isDarkMode
                ? 'border-neutral-700/50 bg-slate-900/60'
                : 'border-neutral-200/60 bg-white/95'
              }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ height: 'calc(100vh - 200px)' }}
          >
            {/* Sidebar Header */}
            <div className={`p-4 sm:p-6 border-b flex-shrink-0 flex items-center justify-between ${isDarkMode ? 'border-neutral-700/50' : 'border-neutral-200/60'
              }`}>
              {!isLeftSidebarCollapsed && (
                <h2 className={`text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 sm:gap-3 ${isDarkMode ? 'text-white' : 'text-neutral-900'
                  }`}>
                  <Signal className="w-5 h-5 sm:w-6 sm:h-6" />
                  Signal Tracker
                </h2>
              )}
              <button
                onClick={() => setIsLeftSidebarCollapsed((v) => !v)}
                className={`ms-[-16px] p-2 sm:p-3 rounded-xl transition-all backdrop-blur-sm shadow-sm border ${isDarkMode
                    ? 'hover:bg-white/10 text-white/80 hover:text-white border-white/20'
                    : 'hover:bg-neutral-100/80 text-neutral-600 hover:text-neutral-900 border-neutral-200/60'
                  }`}
              >
                {isLeftSidebarCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Sidebar Content */}
            {!isLeftSidebarCollapsed ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Signal Selection */}
                <div className="p-4 sm:p-6 flex-shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDarkMode ? 'text-white/80' : 'text-neutral-600'
                      }`}>
                      Tracking Signals
                    </h3>
                    <span className={`text-xs sm:text-sm px-3 py-1.5 rounded-full font-bold ${isDarkMode
                        ? 'bg-white/10 text-white/70 border border-white/20'
                        : 'bg-neutral-100/80 text-neutral-600 border border-neutral-200/60'
                      }`}>
                      {mockEvents.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {mockEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        onClick={() => setSelectedStock(event.id)}
                        className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${selectedStock === event.id
                            ? isDarkMode
                              ? "bg-slate-900/80 border-red-500/50 shadow-lg shadow-red-500/10"
                              : "bg-white border-red-500/50 shadow-lg shadow-red-500/10"
                            : isDarkMode
                              ? "bg-slate-900/60 border-neutral-700/50 hover:border-neutral-600/70 hover:bg-slate-900/80"
                              : "bg-white/80 border-neutral-200/60 hover:border-neutral-300/80 hover:bg-white hover:shadow-md"
                          }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -2 }}
                      >
                        {selectedStock === event.id && (
                          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
                        )}

                        <div className="flex items-start justify-between relative z-10">
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm sm:text-base font-bold mb-2 truncate leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
                              }`}>
                              {event.name}
                            </div>
                            <div className={`text-xs sm:text-sm font-medium mb-1 ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                              }`}>
                              {event.location.place} • {event.region}
                            </div>
                            <span className={`inline-flex items-center text-xs font-bold ${event.trend === 'up' ? 'text-red-600' : event.trend === 'down' ? 'text-green-600' : 'text-gray-600'
                              }`}>
                              <motion.div
                                className={`w-2 h-2 rounded-full mr-2 ${event.trend === 'up' ? 'bg-red-500' : event.trend === 'down' ? 'bg-green-500' : 'bg-gray-500'
                                  }`}
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                              {event.trend} trend
                            </span>
                          </div>

                          <div className="text-right">
                            <p className="text-xl font-bold" style={{ color: getImpactColor(event.impactLevel) }}>
                              {event.value}
                            </p>
                            <p className={`text-xs font-medium ${isDarkMode ? 'text-white/60' : 'text-neutral-500'
                              }`}>
                              {event.impactLevel} impact
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Toggle Control - Desktop */}
                <div className="px-4 sm:px-6 mb-4 sm:mb-6 flex-shrink-0">
                  <div className="mb-4">
                    <h4 className={`text-sm font-bold tracking-tight mb-3 ${isDarkMode ? 'text-white/80' : 'text-neutral-600'
                      }`}>
                      View Mode
                    </h4>
                    <motion.div
                      className={`flex items-center rounded-xl p-1 border backdrop-blur-xl ${isDarkMode ? 'bg-white/5 border-white/20' : 'bg-white/60 border-neutral-200/60'
                        }`}
                    >
                      <button
                        onClick={() => setViewMode('location')}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${viewMode === 'location'
                            ? isDarkMode
                              ? 'bg-red-800 text-white shadow-md'
                              : 'bg-neutral-800 text-white shadow-md'
                            : isDarkMode
                              ? 'text-white/70 hover:text-white hover:bg-white/10'
                              : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/80'
                          }`}
                      >
                        <MapPin className="w-4 h-4" />
                        Location
                      </button>
                      <button
                        onClick={() => setViewMode('contributing')}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${viewMode === 'contributing'
                            ? isDarkMode
                              ? 'bg-red-800 text-white shadow-md'
                              : 'bg-neutral-800 text-white shadow-md'
                            : isDarkMode
                              ? 'text-white/70 hover:text-white hover:bg-white/10'
                              : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/80'
                          }`}
                      >
                        <Layers className="w-4 h-4" />
                        Contributing
                      </button>
                    </motion.div>
                  </div>
                </div>

                {/* Scrollable Event List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {viewMode === 'contributing' ? renderContributingView() : renderLocationView()}
                  </div>
                </div>
              </div>
            ) : (
              // Collapsed: Quick button
              <div className="p-4 flex flex-col items-center gap-4 flex-1">
                <motion.div
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl ${isDarkMode
                      ? 'bg-red-800 text-white hover:bg-red-700'
                      : 'bg-neutral-800 text-white hover:bg-neutral-700'
                    }`}
                  title="Signal Tracker"
                  whileTap={{ scale: 0.95 }}
                >
                  <Signal className="w-5 h-5" />
                </motion.div>
              </div>
            )}
          </motion.aside>
        )}

        {/* MAP SECTION - RESPONSIVE */}
        <section
          className={`${isMobile
              ? 'flex-1 min-h-0'
              : 'flex-1 min-h-0'
            }`}
          style={!isMobile ? { height: 'calc(100vh - 200px)' } : undefined}
        >
          {mockEvents.length > 0 ? (
            <motion.div
              className={`h-full rounded-2xl sm:rounded-3xl border shadow-lg hover:shadow-2xl backdrop-blur-xl overflow-hidden relative ${isDarkMode
                  ? 'border-neutral-700/50 bg-slate-900/60'
                  : 'border-neutral-200/60 bg-white/95'
                }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Map Header - Only on Mobile */}
              {isMobile && (
                <div className={`flex items-center justify-between p-3 border-b backdrop-blur-xl ${isDarkMode ? 'border-neutral-700/50 bg-slate-900/80' : 'border-neutral-200/60 bg-white/80'
                  }`}>
                  <div className="flex items-center gap-2">
                    <Globe className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-neutral-600'}`} />
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                      Signal Map
                    </span>
                  </div>

                  {zoomedRegion && (
                    <motion.button
                      onClick={resetZoom}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${isDarkMode
                          ? 'bg-white/10 text-white/70 hover:bg-white/20'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Reset
                    </motion.button>
                  )}
                </div>
              )}

              {/* Map Container - Full Height on Mobile */}
              <div className={`${isMobile ? 'h-full' : 'h-full p-4 sm:p-6'}`}>
                {zoomedRegion && !isMobile && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`backdrop-blur-sm text-sm px-4 py-2 rounded-full shadow-lg border font-medium mb-4 ${isDarkMode
                        ? 'bg-red-900/50 text-red-300 border-red-700/50'
                        : 'bg-red-100/95 text-red-700 border-red-200/50'
                      }`}
                  >
                    Viewing: {zoomedRegion.location}
                  </motion.div>
                )}

                <div ref={mapContainer} className={`w-full h-full ${isMobile ? '' : 'rounded-2xl sm:rounded-3xl'}`} />
              </div>
            </motion.div>
          ) : (
            renderEmptyState()
          )}
        </section>
      </main>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <AnimatePresence>
        {isPanelOpen && (
          <RightSidebar isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
        )}
      </AnimatePresence>

      <Dock />

      <AISearchComponent
        isOpen={isAiSearchOpen}
        onClose={() => setIsAiSearchOpen(false)}
      />

      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${isDarkMode ? '#475569 #1e293b' : '#cbd5e1 #f1f5f9'};
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#1e293b' : '#f1f5f9'};
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#475569' : '#cbd5e1'};
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#64748b' : '#94a3b8'};
        }

        @keyframes enhanced-pulse-wave {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.7;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.4;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.8);
            opacity: 0;
          }
        }

        @keyframes main-enhanced-pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        @keyframes inner-region-pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.9;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 1;
          }
        }

        @keyframes related-enhanced-pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.05);
          }
        }

        .enhanced-glow-tooltip, .main-event-tooltip, .related-event-tooltip, .inner-region-tooltip {
          position: absolute;
          bottom: 120%;
          left: 50%;
          transform: translateX(-50%);
          background: ${isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
          border: 1px solid ${isDarkMode ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.6)'};
          color: ${isDarkMode ? '#ffffff' : '#1f2937'};
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease, transform 0.3s ease;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          z-index: 1000;
        }

        .enhanced-glow-tooltip.show, .main-event-tooltip.show, .related-event-tooltip.show, .inner-region-tooltip.show {
          opacity: 1;
          transform: translateX(-50%) translateY(-5px);
        }

        .tooltip-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .trend-badge, .impact-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
        }

        .impact-high {
          background: rgba(239, 68, 68, 0.2);
          color: #EF4444;
        }

        .impact-medium {
          background: rgba(249, 115, 22, 0.2);
          color: #F97316;
        }

        .impact-low {
          background: rgba(16, 185, 129, 0.2);
          color: #10B981;
        }

        .trend-up {
          color: #EF4444;
        }

        .trend-down {
          color: #10B981;
        }

        .trend-stable {
          color: #6B7280;
        }

        .click-hint {
          color: ${isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'};
          font-style: italic;
        }
      `}</style>
    </div>
  );
}