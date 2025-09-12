import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { Marker, Popup } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import RightSidebar from "../components/RightSidebar";
import { AnimatePresence, motion } from "framer-motion";
import Dock from "../components/ui/Dock";
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
  Search
} from "lucide-react";

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
  related: SignalEvent[];
}

const mockEvents: SignalEvent[] = [
  {
    id: "ASIA_GW",
    name: "Asia Global Warming",
    value: 95,
    location: { place: "Asia", lat: 34.0479, lng: 100.6197 },
    region: "Asia",
    trend: "up",
    related: [
      {
        id: "ASIA_TEMP",
        name: "Asia Temperature Rise",
        value: 88,
        location: { place: "Asia", lat: 35.0, lng: 105.0 },
        region: "Asia",
        trend: "up",
        related: [],
      },
      {
        id: "ASIA_ICE",
        name: "Asia Ice Melting",
        value: 92,
        location: { place: "Asia", lat: 33.0, lng: 95.0 },
        region: "Asia",
        trend: "up",
        related: [],
      },
    ],
  },
  {
    id: "EUR_INFL",
    name: "Europe Inflation",
    value: 82,
    location: { place: "Europe", lat: 54.5260, lng: 15.2551 },
    region: "Europe",
    trend: "down",
    related: [
      {
        id: "EUR_RATE",
        name: "Europe Interest Rate",
        value: 76,
        location: { place: "Europe", lat: 50.0, lng: 10.0 },
        region: "Europe",
        trend: "stable",
        related: [],
      },
    ],
  },
];

// Mock location data for the selected stock
const mockLocationData: Record<
  string,
  { location: string; value: number; lat: number; lng: number }[]
> = {
  "ASIA_GW": [
    { location: "China", value: 94, lat: 35.8617, lng: 104.1954 },
    { location: "India", value: 96, lat: 20.5937, lng: 78.9629 },
    { location: "Japan", value: 89, lat: 36.2048, lng: 138.2529 },
    { location: "Indonesia", value: 93, lat: -0.7893, lng: 113.9213 },
    { location: "Thailand", value: 91, lat: 15.8700, lng: 100.9925 },
  ],
  "EUR_INFL": [
    { location: "Germany", value: 84, lat: 51.1657, lng: 10.4515 },
    { location: "France", value: 81, lat: 46.6034, lng: 1.8883 },
    { location: "Italy", value: 79, lat: 41.8719, lng: 12.5674 },
    { location: "Spain", value: 80, lat: 40.4637, lng: -3.7492 },
    { location: "Netherlands", value: 77, lat: 52.1326, lng: 5.2913 },
  ],
};

export default function SignalTrackerPage() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const [activeEvent, setActiveEvent] = useState<SignalEvent | null>(null);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'location' | 'contributing'>('location');
  const [selectedStock, setSelectedStock] = useState<string>('ASIA_GW');
  const arrowLayerId = "animated-arrows";
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Map initialization with custom style
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v10",
      center: [0, 20],
      zoom: 1.3,
      projection: "mercator",
      maxBounds: [[-180, -85], [180, 85]],
      preserveDrawingBuffer: true,
      antialias: true
    });

    mapRef.current = map;

    map.on("load", () => {
      renderEventsOnMap();
    });

    map.on("zoom", () => {
      const zoom = map.getZoom();
      if (map.getLayer(arrowLayerId)) {
        map.setLayoutProperty(arrowLayerId, "visibility", zoom >= 2 ? "visible" : "none");
      }
    });

    return () => {
      if (map) {
        map.remove();
      }
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      renderEventsOnMap();
    }
  }, [viewMode, selectedStock]);

  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.resize();
    }, 300);
    return () => clearTimeout(timer);
  }, [isLeftSidebarCollapsed, isPanelOpen]);

  const renderEventsOnMap = () => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers and layers
    document.querySelectorAll(".mapboxgl-marker").forEach((el) => el.remove());
    if (map.getLayer("animated-arrows")) {
      map.removeLayer("animated-arrows");
    }
    if (map.getSource("animated-arrows")) {
      map.removeSource("animated-arrows");
    }
    if (map.getLayer("arrow-symbols")) {
      map.removeLayer("arrow-symbols");
    }
    if (map.getSource("arrow-symbols")) {
      map.removeSource("arrow-symbols");
    }

    const currentEvent = mockEvents.find(e => e.id === selectedStock);
    if (!currentEvent) return;

    if (viewMode === 'location') {
      const locationData = mockLocationData[selectedStock] || [];
      locationData.forEach((location) => {
        const el = document.createElement("div");
        el.className = "outer-marker";
        el.style.cssText = `
        position: relative;
        width: 24px;
        height: 24px;
      `;

        const pulse = document.createElement("div");
        pulse.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(45deg, #DC2626, #B91C1C);
        border: 2px solid white;
        animation: pulse-blink 2s infinite ease-in-out;
        box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
      `;
        el.appendChild(pulse);

        const tooltip = document.createElement("div");
        tooltip.className = "marker-tooltip";
        tooltip.innerHTML = `<strong>${location.location}</strong><br/>Value: ${location.value}`;
        el.appendChild(tooltip);

        el.addEventListener('mouseenter', () => {
          el.style.filter = 'brightness(1.2)';
          el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 20px rgba(220, 38, 38, 0.6)';
          el.style.zIndex = '1000';
          tooltip.classList.add('show');
        });

        el.addEventListener('mouseleave', () => {
          el.style.filter = 'brightness(1)';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          el.style.zIndex = 'auto';
          tooltip.classList.remove('show');
        });

        new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat([location.lng, location.lat])
          .addTo(map);
      });
    } else {
      drawContributingEvents(currentEvent);
    }
  };

  const drawContributingEvents = (mainEvent: SignalEvent) => {
    const map = mapRef.current;
    if (!map) return;

    const mainEl = document.createElement("div");
    mainEl.className = "main-event-marker";
    mainEl.style.cssText = `
    position: relative;
    width: 28px;
    height: 28px;
  `;

    const pulse = document.createElement("div");
    pulse.style.cssText = `
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(45deg, #DC2626, #B91C1C);
    border: 3px solid white;
    animation: pulse-blink 2s infinite ease-in-out;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
  `;
    mainEl.appendChild(pulse);

    const mainTooltip = document.createElement("div");
    mainTooltip.className = "marker-tooltip";
    mainTooltip.innerHTML = `<strong>${mainEvent.name}</strong><br/>Value: ${mainEvent.value}<br/>Main Event`;
    mainEl.appendChild(mainTooltip);

    mainEl.addEventListener('mouseenter', () => {
      mainEl.style.filter = 'brightness(1.2)';
      mainEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 25px rgba(220, 38, 38, 0.8)';
      mainTooltip.classList.add('show');
    });

    mainEl.addEventListener('mouseleave', () => {
      mainEl.style.filter = 'brightness(1)';
      mainEl.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      mainTooltip.classList.remove('show');
    });

    new mapboxgl.Marker({
      element: mainEl,
      anchor: 'center'
    })
      .setLngLat([mainEvent.location.lng, mainEvent.location.lat])
      .addTo(map);

    mainEvent.related.forEach((relatedEvent) => {
      const relatedEl = document.createElement("div");
      relatedEl.className = "related-event-marker";
      relatedEl.style.cssText = `
    position: relative;
    width: 24px;
    height: 24px;
  `;

      const pulse = document.createElement("div");
      pulse.style.cssText = `
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(45deg, #F59E0B, #D97706);
    border: 2px solid white;
    animation: pulse-blink 2s infinite ease-in-out;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  `;
      relatedEl.appendChild(pulse);

      const relatedTooltip = document.createElement("div");
      relatedTooltip.className = "marker-tooltip";
      relatedTooltip.innerHTML = `<strong>${relatedEvent.name}</strong><br/>Value: ${relatedEvent.value}<br/>Trend: ${relatedEvent.trend}`;
      relatedEl.appendChild(relatedTooltip);

      relatedEl.addEventListener('mouseenter', () => {
        relatedEl.style.filter = 'brightness(1.2)';
        relatedEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4), 0 0 18px rgba(245, 158, 11, 0.8)';
        relatedTooltip.classList.add('show');
      });

      relatedEl.addEventListener('mouseleave', () => {
        relatedEl.style.filter = 'brightness(1)';
        relatedEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        relatedTooltip.classList.remove('show');
      });

      new mapboxgl.Marker({
        element: relatedEl,
        anchor: 'center'
      })
        .setLngLat([relatedEvent.location.lng, relatedEvent.location.lat])
        .addTo(map);
    });

    drawCurvedConnections(mainEvent);
  };

  const drawCurvedConnections = (mainEvent: SignalEvent) => {
    const map = mapRef.current;
    if (!map) return;

    const arcFeatures = mainEvent.related.map((rel) => {
      const line = createArc(
        [mainEvent.location.lng, mainEvent.location.lat],
        [rel.location.lng, rel.location.lat]
      );
      return {
        type: "Feature" as const,
        geometry: {
          type: "LineString" as const,
          coordinates: line,
        },
        properties: { to: rel.name },
      };
    });

    if (arcFeatures.length > 0) {
      if (!map.getSource(arrowLayerId)) {
        map.addSource(arrowLayerId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: arcFeatures,
          },
        });

        map.addLayer({
          id: arrowLayerId,
          type: "line",
          source: arrowLayerId,
          layout: {
            visibility: "visible",
          },
          paint: {
            "line-color": "#DC2626",
            "line-width": 3,
            "line-opacity": ["interpolate", ["linear"], ["zoom"], 1, 0.4, 5, 0.9],
            "line-dasharray": [2, 2],
          },
        });
      }

      const arrowPoints = mainEvent.related.map((rel) => {
        const midLng = (mainEvent.location.lng + rel.location.lng) / 2;
        const midLat = (mainEvent.location.lat + rel.location.lat) / 2 + 2;
        return {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [midLng, midLat],
          },
          properties: {
            symbol: "▶",
          },
        };
      });

      if (!map.getSource("arrow-symbols")) {
        map.addSource("arrow-symbols", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: arrowPoints,
          },
        });

        map.addLayer({
          id: "arrow-symbols",
          type: "symbol",
          source: "arrow-symbols",
          layout: {
            "text-field": "▶",
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-size": 14,
          },
          paint: {
            "text-color": "#DC2626",
          },
        });
      }
    }
  };

  const createArc = (start: [number, number], end: [number, number]): [number, number][] => {
    const points = 50;
    const arc: [number, number][] = [];
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      const lng = start[0] * (1 - t) + end[0] * t;
      const lat = start[1] * (1 - t) + end[1] * t + Math.sin(t * Math.PI) * 8;
      arc.push([lng, lat]);
    }
    return arc;
  };

  const renderLocationView = () => {
    const locationData = mockLocationData[selectedStock] || [];
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-2xl border border-red-200 shadow-sm">
          <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Selected Stock: {selectedStock}
          </h4>
          <p className="text-sm text-red-700">Showing latest values across Asia region</p>
        </div>

        <div className="space-y-3">
          <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <div className="w-2 h-2 bg-green-600 rounded-full" />
            Regional Values
          </h5>
          {locationData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/90 p-4 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">{item.location}</p>
                  <p className="text-sm text-gray-600">Latest Value</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-700">{item.value}</p>
                  <div className="flex items-center text-sm text-green-600">
                    <Activity className="w-3 h-3 mr-1" />
                    <span>Active</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderContributingView = () => {
    const mainEvent = mockEvents.find(e => e.id === selectedStock);
    if (!mainEvent) return null;

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-2xl border border-purple-200 shadow-sm">
          <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Selected Stock: {selectedStock}
          </h4>
          <p className="text-sm text-purple-700">Showing related contributing events</p>
        </div>

        <div className="space-y-3">
          <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-600 rounded-full" />
            Contributing Events
          </h5>
          {mainEvent.related.map((event, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/90 p-4 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">{event.name}</p>
                  <p className="text-sm text-gray-600">{event.location.place}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-orange-700">{event.value}</p>
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
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 antialiased relative overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 bg-gradient-to-br from-red-400 to-orange-400 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 bg-gradient-to-tr from-blue-400 to-purple-400 blur-3xl" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-8 h-20 bg-white shadow-sm border-b border-gray-200/60 sticky top-0 z-30 flex-shrink-0">
        <motion.div
          className="flex items-center space-x-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src="/qf-logo0.1.svg" alt="Quantifore logo" className="h-8 select-none" />
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-red-600" />
            <span className="text-lg font-semibold text-gray-900">Signal</span>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">View Mode:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('location')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'location'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                Location
              </button>
              <button
                onClick={() => setViewMode('contributing')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'contributing'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                Contributing Events
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Data Connected
          </div>
          <motion.button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="rounded-lg p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 shadow-sm border border-gray-200/50"
            aria-label="Open menu"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="h-5 w-5" />
          </motion.button>
        </div>
      </header>

      {/* Main Content - Fixed height layout */}
      <main className="flex flex-1 overflow-hidden relative min-h-0">
        {/* Left Sidebar - Fixed with internal scrolling and proper responsive width */}
        <motion.aside
          className={`${
            isLeftSidebarCollapsed ? "w-16" : "w-94"
          } bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 m-6 flex-shrink-0`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Sidebar header (fixed) */}
          <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/80 to-red-50/80 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center justify-between">
              {!isLeftSidebarCollapsed && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg shadow-sm">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-bold text-gray-900">Signal Tracker</h2>
                </div>
              )}
              <button
                onClick={() => setIsLeftSidebarCollapsed(v => !v)}
                className="ms-[-10px] p-2 rounded-xl hover:bg-red-50 text-gray-600 transition-colors border border-red-200/50 shadow-sm"
                aria-label={isLeftSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isLeftSidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Sidebar content */}
          {!isLeftSidebarCollapsed ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* AI Search button (fixed) */}
              <div className="p-6 border-b border-gray-200/60 flex-shrink-0">
                <motion.button
                  onClick={() => console.debug("AI Stock Search clicked")}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-300 group shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Search className="w-4 h-4" />
                  </div>
                  <span className="font-semibold">AI Stock Search</span>
                  <div className="ml-auto">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full" />
                      Tracking Stocks
                    </h3>
                    <span className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full font-semibold">
                      {mockEvents.length}
                    </span>
                  </div>

                  {/* Stock cards */}
                  <div className="space-y-3 mb-8">
                    {mockEvents.map((event, index) => {
                      const isSelected = selectedStock === event.id;
                      return (
                        <motion.div
                          key={event.id}
                          onClick={() => setSelectedStock(event.id)}
                          className={`p-4 rounded-2xl border transition-all group cursor-pointer overflow-hidden relative ${
                            isSelected
                              ? "bg-gradient-to-r from-red-50 to-red-100 border-red-300 shadow-lg"
                              : "bg-white/90 border-gray-200/60 hover:border-red-300 hover:shadow-lg"
                          }`}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.06 }}
                        >
                          {isSelected && (
                            <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 opacity-10" />
                          )}

                          <div className="flex justify-between items-start relative z-10">
                            <div>
                              <p className="font-bold text-gray-900 mb-1">{event.name}</p>
                              <p className="text-sm text-gray-600">{event.region}</p>
                              {isSelected && (
                                <div className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                  Currently viewing
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">{event.value}</p>
                              <div className="flex items-center text-sm">
                                {event.trend === "up" ? (
                                  <TrendingUp className="w-3 h-3 mr-1 text-red-600" />
                                ) : event.trend === "down" ? (
                                  <TrendingDown className="w-3 h-3 mr-1 text-green-600" />
                                ) : (
                                  <ArrowRight className="w-3 h-3 mr-1 text-gray-600" />
                                )}
                                <span
                                  className={`font-medium ${
                                    event.trend === "up"
                                      ? "text-red-600"
                                      : event.trend === "down"
                                      ? "text-green-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {event.trend}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="mt-3 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              className={`p-2 rounded-lg transition-all ${
                                isSelected
                                  ? "text-red-600 hover:bg-red-200 bg-red-100"
                                  : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                              }`}
                              title={isSelected ? "Stop Visualization" : "Visualize"}
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedStock(event.id);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                              title="Share"
                              onClick={e => e.stopPropagation()}
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              title="Remove"
                              onClick={e => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Dynamic content based on view mode */}
                  <div className="border-t border-gray-200/60 pt-6">
                    {viewMode === "location" ? renderLocationView() : renderContributingView()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Collapsed state
            <div className="p-3">
              <button
                // onClick={() => setIsAiSearchOpen(true)}
                className="w-full flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 text-white p-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
                title="AI Data Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.aside>

        { }
        <section 
          className={`flex-1 flex flex-col bg-white/50 backdrop-blur-sm relative min-h-0 transition-all duration-300 ${
            isLeftSidebarCollapsed ? 'ml-0' : 'ml-0'
          }`}
        >
          <div className="flex-1 p-6 pr-6 pb-24 min-h-0">
            <motion.div
              className="h-full bg-white/90 rounded-2xl shadow-2xl relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Map Controls */}
              <div className="absolute top-6 right-6 z-10 space-y-2">
                <motion.button
                  className="bg-white/95 backdrop-blur-sm text-sm text-gray-700 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200/50 font-medium flex items-center gap-2"
                  onClick={() => {
                    if (!mapRef.current) return;
                    mapRef.current.flyTo({ center: [0, 20], zoom: 1.3 });
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Globe className="w-4 h-4" />
                  World View
                </motion.button>
              </div>

              {/* Map */}
              <div ref={mapContainer} className="w-full h-full rounded-2xl" />

              {/* Map Tooltip Styles */}
              <style>{`
                @keyframes pulse-blink {
                  0%, 100% { 
                    opacity: 1; 
                    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
                  }
                  50% { 
                    opacity: 0.8;
                    box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
                  }
                }

                .mapboxgl-map {
                  position: relative !important;
                  overflow: hidden !important;
                }
                
                .mapboxgl-marker {
                  position: absolute !important;
                  will-change: transform !important;
                  pointer-events: auto !important;
                }
                
                .marker-tooltip {
                  position: absolute;
                  bottom: 100%;
                  left: 50%;
                  transform: translateX(-50%) translateY(-8px);
                  background: rgba(0, 0, 0, 0.9);
                  color: white;
                  padding: 8px 12px;
                  border-radius: 8px;
                  font-size: 12px;
                  white-space: nowrap;
                  opacity: 0;
                  visibility: hidden;
                  transition: all 0.2s ease;
                  z-index: 1000;
                  pointer-events: none;
                }

                .marker-tooltip.show {
                  opacity: 1;
                  visibility: visible;
                }

                .marker-tooltip::after {
                  content: '';
                  position: absolute;
                  top: 100%;
                  left: 50%;
                  transform: translateX(-50%);
                  border: 4px solid transparent;
                  border-top-color: rgba(0, 0, 0, 0.9);
                }
              `}</style>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Overlay Sidebar */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setIsPanelOpen(false)}
            />
            <RightSidebar isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
          </>
        )}
      </AnimatePresence>

      <Dock />
    </div>
  );
}