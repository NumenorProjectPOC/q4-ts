import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { Marker, Popup } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import RightSidebar from "../components/RightSidebar";
import DashboardSwitcher from "../components/ui/DashboardSwitcher";
import { AnimatePresence, motion } from "framer-motion";

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'location' | 'contributing'>('location');
  const [selectedStock, setSelectedStock] = useState<string>('ASIA_GW');
  const arrowLayerId = "animated-arrows";
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // FIXED: Updated useEffect for map initialization
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v10",
      center: [0, 20],
      zoom: 1.3,
      projection: "mercator",
      maxBounds: [[-180, -85], [180, 85]],
      // FIXED: Add these options for better marker handling
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
    }, 300); // Match transition duration
    return () => clearTimeout(timer);
  }, [isCollapsed, isPanelOpen]);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  // FIXED: Updated renderEventsOnMap function
  const renderEventsOnMap = () => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers and layers
    document.querySelectorAll(".mapboxgl-marker").forEach((el) => el.remove());
    // ❗ Remove layers first, then sources to avoid error
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
      // Show location markers for the selected stock
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
        background: linear-gradient(45deg, #10b981, #059669);
        border: 2px solid white;
        animation: pulse-blink 2s infinite ease-in-out;
      `;
        el.appendChild(pulse);


        // Create tooltip
        const tooltip = document.createElement("div");
        tooltip.className = "marker-tooltip";
        tooltip.innerHTML = `<strong>${location.location}</strong><br/>Value: ${location.value}`;
        el.appendChild(tooltip);

        // Enhanced hover effects
        el.addEventListener('mouseenter', () => {
          el.style.filter = 'brightness(1.2)';
          el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 20px rgba(16, 185, 129, 0.6)';
          el.style.zIndex = '1000';
          // Remove the transform scale to prevent positioning issues
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
      // Show contributing events with connections
      drawContributingEvents(currentEvent);
    }
  };

  // FIXED: Updated drawContributingEvents function
  const drawContributingEvents = (mainEvent: SignalEvent) => {
    const map = mapRef.current;
    if (!map) return;

    // Create main event marker with enhanced blinking
    const mainEl = document.createElement("div");
    mainEl.className = "main-event-marker";
    mainEl.style.cssText = `
    position: relative;
    width: 24px;
    height: 24px;
  `;

    const pulse = document.createElement("div");
    pulse.style.cssText = `
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(45deg, #10b981, #059669);
    border: 2px solid white;
    animation: pulse-blink 2s infinite ease-in-out;
  `;
    mainEl.appendChild(pulse);

    // Create tooltip for main event
    const mainTooltip = document.createElement("div");
    mainTooltip.className = "marker-tooltip";
    mainTooltip.innerHTML = `<strong>${mainEvent.name}</strong><br/>Value: ${mainEvent.value}<br/>Main Event`;
    mainEl.appendChild(mainTooltip);

    // Enhanced hover effects for main event
    mainEl.addEventListener('mouseenter', () => {
      mainEl.style.filter = 'brightness(1.2)';
      mainEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 25px rgba(59, 130, 246, 0.8)';
      // Remove transform scale
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

    // Create related event markers and connections
    mainEvent.related.forEach((relatedEvent, index) => {
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
    background: linear-gradient(45deg, #10b981, #059669);
    border: 2px solid white;
    animation: pulse-blink 2s infinite ease-in-out;
  `;
      relatedEl.appendChild(pulse);

      // Create tooltip for related event
      const relatedTooltip = document.createElement("div");
      relatedTooltip.className = "marker-tooltip";
      relatedTooltip.innerHTML = `<strong>${relatedEvent.name}</strong><br/>Value: ${relatedEvent.value}<br/>Trend: ${relatedEvent.trend}`;
      relatedEl.appendChild(relatedTooltip);

      // Enhanced hover effects for related events
      relatedEl.addEventListener('mouseenter', () => {
        relatedEl.style.filter = 'brightness(1.2)';
        relatedEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4), 0 0 18px rgba(245, 158, 11, 0.8)';
        // Remove transform scale
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

    // Draw curved connections
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
            "line-color": "#FFD700",
            "line-width": 3,
            "line-opacity": ["interpolate", ["linear"], ["zoom"], 1, 0.4, 5, 0.9],
            "line-dasharray": [2, 2],
          },
        });
      }

      // Add arrow symbols
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
            "text-color": "#FFD700",
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
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Selected Stock: {selectedStock}</h4>
          <p className="text-sm text-blue-600">Showing latest values across Asia region</p>
        </div>

        <div className="space-y-3">
          <h5 className="font-medium text-gray-700">Regional Values</h5>
          {locationData.map((item, index) => (
            <div key={index} className="bg-gradient-to-r from-green-100 to-emerald-100 p-3 rounded-lg border border-green-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{item.location}</p>
                  <p className="text-sm text-gray-600">Latest Value</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-700">{item.value}</p>
                  <div className="flex items-center text-sm text-green-600">
                    <span className="mr-1">📈</span>
                    <span>Active</span>
                  </div>
                </div>
              </div>
            </div>
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
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-purple-800 mb-2">Selected Stock: {selectedStock}</h4>
          <p className="text-sm text-purple-600">Showing related contributing events</p>
        </div>

        <div className="space-y-3">
          <h5 className="font-medium text-gray-700">Contributing Events</h5>
          {mainEvent.related.map((event, index) => (
            <div key={index} className="bg-gradient-to-r from-orange-100 to-red-100 p-3 rounded-lg border border-orange-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{event.name}</p>
                  <p className="text-sm text-gray-600">{event.location.place}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-700">{event.value}</p>
                  <div className="flex items-center text-sm">
                    <span className="mr-1">
                      {event.trend === 'up' ? '📈' : event.trend === 'down' ? '📉' : '➡️'}
                    </span>
                    <span className={`${event.trend === 'up' ? 'text-red-600' :
                      event.trend === 'down' ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                      {event.trend}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 overflow-x-hidden">
      <DashboardSwitcher />
      <div className={`transition-all duration-300`}>
        <div className="flex flex-col h-screen">
          {/* Navbar */}
          <div className=" shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-5">
              <img src="/qf-logo0.1.svg" alt="Quantifore Logo" className="h-8 w-auto mt-3" />
              {/* Right-aligned controls */}
              <div className="flex items-center space-x-6">
                {/* View Mode Toggle Group */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">View Mode:</span>
                  <div className="flex bg-gray-100 rounded-lg mt-2 p-1">
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
                {!isPanelOpen && <div className="w-12" />}
              </div>
            </div>

          </div>

          <div className="flex flex-1 p-4 lg:p-8 overflow-hidden">
            {/* Sidebar */}
            <div
              className={`transition-all duration-300 ease-in-out relative ${isCollapsed ? "w-16 md:w-20" : "w-80"
                } bg-gradient-to-br from-white/40 via-teal-200/30 to-white/20 backdrop-blur-xl border border-gray-200 rounded-lg shadow-lg flex-shrink-0 flex flex-col`}
            >
              <button
                onClick={toggleCollapse}
                className={`absolute top-4 ${isCollapsed ? "left-1/2 -translate-x-1/2" : "right-4"} bg-white hover:bg-gray-100 rounded-full p-1 shadow z-10`}
                aria-label="Toggle sidebar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-teal-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
                  />
                </svg>
              </button>

              {!isCollapsed && (
                <div className="mt-16 px-4 flex flex-col gap-6 h-full overflow-y-auto">
                  {/* Stock Selection */}
                  <div className="space-y-2">
                    <h3 className="text-md text-gray-800 font-semibold pb-2">Tracking Stocks</h3>
                    {mockEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedStock(event.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${selectedStock === event.id
                          ? 'bg-gradient-to-r from-blue-200 to-cyan-200 shadow-md border-2 border-blue-300'
                          : 'bg-gradient-to-r from-cyan-100 to-teal-100 hover:shadow-lg'
                          } text-gray-800`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{event.name}</p>
                            <p className="text-sm text-gray-600">{event.region}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{event.value}</p>
                            <span className="text-xs">
                              {event.trend === 'up' ? '📈' : event.trend === 'down' ? '📉' : '➡️'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dynamic Content Based on Toggle */}
                  <div className="border-t border-gray-300 pt-4">
                    {viewMode === 'location' ? renderLocationView() : renderContributingView()}
                  </div>
                </div>
              )}
            </div>

            {/* Map Container */}
            <div className="flex-1 p-6 lg:p-12">
              <div className="w-full h-full bg-white rounded-2xl shadow-2xl relative">
                <div className="absolute top-6 right-6 z-10 space-y-2">
                  <button
                    className="bg-white backdrop-blur-sm text-sm text-teal-700 px-3 py-1 rounded-full shadow hover:shadow-md transition"
                    onClick={() => {
                      if (!mapRef.current) return;
                      mapRef.current.flyTo({ center: [0, 20], zoom: 1.3 });
                    }}
                  >
                    World View
                  </button>
                </div>
                <div ref={mapContainer} className="w-full h-full rounded-2xl shadow-lg relative z-0" />

                {/* FIXED: Updated CSS with safe animations and proper positioning */}
                <style>{`
                  /* FIXED: Safe pulse animation that doesn't displace markers */
                  @keyframes pulse-safe {
                    0% { 
                      transform: scale(1); 
                      opacity: 0.6; 
                    }
                    50% { 
                      transform: scale(1.2); 
                      opacity: 0.3; 
                    }
                    100% { 
                      transform: scale(1); 
                      opacity: 0.6; 
                    }
                  }
                  
                  /* Ensure map container has proper positioning */
                  .mapboxgl-map {
                    position: relative !important;
                    overflow: hidden !important;
                  }
                  
                  /* Fix marker positioning */
                  .mapboxgl-marker {
                    position: absolute !important;
                    will-change: transform !important;
                    pointer-events: auto !important;
                  }
                  
                  /* Prevent transforms from affecting marker positioning */
                  .location-marker, .main-event-marker, .related-event-marker {
                    position: relative !important;
                    transform-origin: center center !important;
                  }
                `}</style>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-white border-t border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Active Stock: <span className="font-medium">{selectedStock}</span></span>
                <span className="text-gray-600">Mode: <span className="font-medium capitalize">{viewMode}</span></span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Live Data Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu button*/}
      <motion.button
        className="fixed top-5 right-8 z-[60] p-2 rounded-full bg-white/70 backdrop-blur-md text-gray-700 hover:bg-white/90 transition-all shadow-lg hover:scale-105"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isPanelOpen ? "Close menu" : "Open menu"}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ rotate: isPanelOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            animate={{
              d: isPanelOpen
                ? "M6 18L18 6M6 6l12 12"
                : "M4 6h16M4 12h16M4 18h16"
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.svg>
      </motion.button>

      {/* Backdrop and Sidebar */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setIsPanelOpen(false)}
            />
            <RightSidebar isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}