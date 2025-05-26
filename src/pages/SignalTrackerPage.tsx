import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { Marker } from "mapbox-gl";
import Navbar from "../components/Navbar";
import "mapbox-gl/dist/mapbox-gl.css";
import "../index.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface SignalPoint {
  id: string;
  lat: number;
  lng: number;
  value: number;
  isTopThreshold: boolean;
}

const mockSignalData: SignalPoint[] = [
  { id: "US", lat: 37.7749, lng: -122.4194, value: 95, isTopThreshold: true },
  { id: "JP", lat: 35.6895, lng: 139.6917, value: 97, isTopThreshold: true },
  { id: "AU", lat: -33.8688, lng: 151.2093, value: 90, isTopThreshold: true },
  { id: "BR", lat: -15.7939, lng: -47.8828, value: 81, isTopThreshold: false }, // Brazil
  { id: "DE", lat: 52.52, lng: 13.405, value: 70, isTopThreshold: false },     // Germany
];


const subSignals: Record<string, SignalPoint[]> = {
  US: [
    { id: "us-1", lat: 34.0522, lng: -118.2437, value: 85, isTopThreshold: true },  // LA
    { id: "us-2", lat: 36.7783, lng: -119.4179, value: 78, isTopThreshold: true },  // Central CA
    { id: "us-3", lat: 32.7157, lng: -117.1611, value: 69, isTopThreshold: false }, // San Diego
    { id: "us-4", lat: 40.7128, lng: -74.006, value: 60, isTopThreshold: false },   // NYC
  ],
  JP: [
    { id: "jp-1", lat: 35.6762, lng: 139.6503, value: 91, isTopThreshold: true },   // Tokyo
    { id: "jp-2", lat: 34.6937, lng: 135.5023, value: 88, isTopThreshold: true },   // Osaka
    { id: "jp-3", lat: 35.0116, lng: 135.7681, value: 64, isTopThreshold: false },  // Kyoto
    { id: "jp-4", lat: 43.0642, lng: 141.3469, value: 59, isTopThreshold: false },  // Sapporo
  ],
  AU: [
    { id: "au-1", lat: -33.8688, lng: 151.2093, value: 90, isTopThreshold: true },  // Sydney
    { id: "au-2", lat: -37.8136, lng: 144.9631, value: 82, isTopThreshold: true },  // Melbourne
    { id: "au-3", lat: -27.4698, lng: 153.0251, value: 77, isTopThreshold: false }, // Brisbane
    { id: "au-4", lat: -31.9505, lng: 115.8605, value: 66, isTopThreshold: false }, // Perth
  ],
};


export default function SignalTrackerPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<Record<string, Marker>>({});

  const [tracked, setTracked] = useState<SignalPoint[]>(mockSignalData);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [favoritesExpanded, setFavoritesExpanded] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v10",
      center: [0, 20],
      zoom: 1.3,  
      projection: "mercator",
      maxBounds: [[-180, -85], [180, 85]],
    });

    mapRef.current = map;

    const renderMarkers = (data: SignalPoint[]) => {
      // Clear existing markers
      Object.values(markerRefs.current).forEach(marker => marker.remove());
      markerRefs.current = {};

      // Render markers
      data.forEach((p) => {
        const markerElement = document.createElement("div");
        markerElement.className = "outer-marker";

        if (p.isTopThreshold) {
          const inner = document.createElement("div");
          inner.className = "inner-blink";
          markerElement.appendChild(inner);
        } else {
          markerElement.style.width = "12px";
          markerElement.style.height = "12px";
          markerElement.style.borderRadius = "50%";
          markerElement.style.backgroundColor = "dodgerblue";
        }

        markerElement.addEventListener("click", () => {
          map.flyTo({
            center: [p.lng, p.lat],
            zoom: 5.5,
            speed: 1.2,
            curve: 1,
            essential: true,
          });

          currentCountryRef.current = p.id;
          renderMarkers(subSignals[p.id] || []);
        });

        const marker = new mapboxgl.Marker({
          element: markerElement,
          anchor: "bottom",
          offset: [0, -8],
        })
          .setLngLat([p.lng, p.lat])
          .addTo(map);

        markerRefs.current[p.id] = marker;
      });
    };

    const currentCountryRef = { current: null as string | null };

    map.on("load", () => {
      renderMarkers(mockSignalData);
    
      // ✅ Add FREE US County GeoJSON Layer
      map.addSource("us-counties", {
        type: "geojson",
        data: "https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json"
      });
    
      map.addLayer({
        id: "county-layer",
        type: "line",
        source: "us-counties",
        paint: {
          "line-color": "#00B4D8",
          "line-width": 1,
          "line-opacity": 0.6
        }
      });
    
      // Optional: show only when zoomed in
      map.setLayoutProperty("county-layer", "visibility", "none");
    
      map.on("zoom", () => {
        const zoom = map.getZoom();
        map.setLayoutProperty("county-layer", "visibility", zoom >= 5 ? "visible" : "none");
      });
    });
    

    map.on("zoomend", () => {
      const zoom = map.getZoom();

      if (zoom < 4 && currentCountryRef.current) {
        // Zoomed out to world view
        renderMarkers(mockSignalData);
        currentCountryRef.current = null;
      } else if (zoom >= 4) {
        const country = currentCountryRef.current;
        if (!country) {
          // Automatically detect nearest country based on center point when zooming manually
          const center = map.getCenter();
          const nearestCountry = mockSignalData.reduce((closest, country) => {
            const distCurrent = Math.hypot(center.lng - country.lng, center.lat - country.lat);
            const distClosest = Math.hypot(center.lng - closest.lng, center.lat - closest.lat);
            return distCurrent < distClosest ? country : closest;
          }, mockSignalData[0]);

          currentCountryRef.current = nearestCountry.id;
          renderMarkers(subSignals[nearestCountry.id] || []);
        } else {
          renderMarkers(subSignals[country] || []);
        }
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);


  const stopTracking = (id: string) => {
    setTracked((list) => list.filter((p) => p.id !== id));
    const m = markerRefs.current[id];
    if (m) {
      m.remove();
      delete markerRefs.current[id];
    }
  };

  const toggleCollapse = () => setIsCollapsed((c) => !c);
  const toggleFavorites = () => setFavoritesExpanded((e) => !e);

  return (
    <div className="bg-teal-50 flex flex-col h-screen w-screen">
      <Navbar />

      <div className="flex flex-1 p-4 lg:p-8 ">
        {/* Sidebar Container */}
        <div className={
          `relative transition-all duration-300 ease-in-out
            ${isCollapsed ? "w-16 md:w-20" : "w-64 md:w-80"}  
            bg-gradient-to-br from-white/30 via-teal-200/50 to-white/10
            backdrop-blur-xl border border-gray-200 rounded-lg shadow-lg
            flex-shrink-0 flex flex-col
          `
        }>
          {/* Collapse/Expand Button */}
          <button
            onClick={toggleCollapse}
            className={`absolute top-4 ${isCollapsed ? "right-3" : "right-4"} bg-white hover:bg-gray-100 rounded-full p-1 shadow z-10`}
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

          {/* Sidebar Inner Content */}
          <div className={
            `mt-16 p-4 flex flex-col gap-6 h-full overflow-y-auto transition-opacity duration-300
             ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`
          }>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Search for events</h3>
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 rounded-full bg-white placeholder-teal-300 text-teal-900 shadow-sm focus:outline-none"
              />
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Tracked ({tracked.length})</h3>
                <button onClick={toggleFavorites} className="text-teal-600 hover:underline text-xs">
                  {favoritesExpanded ? "Hide" : "Show"}
                </button>
              </div>
              {favoritesExpanded && (
                <ul className="space-y-2 overflow-y-auto max-h-64 pr-2">
                  {tracked
                    .filter((p) => p.id.includes(search) || p.value.toString().includes(search))
                    .map((p) => (
                      <li
                        key={p.id}
                        className="bg-white p-3 rounded-lg flex justify-between items-center shadow"
                      >
                        <div>
                          <div className="font-medium text-teal-800">{p.id}</div>
                          <div className="text-xs text-gray-600">{p.value} {p.isTopThreshold && <span className="text-orange-500">▲</span>}</div>
                        </div>
                        <button
                          onClick={() => stopTracking(p.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* <button className="mt-auto w-full py-2 bg-teal-500 text-white rounded-full shadow hover:bg-teal-600">
              Discover More
            </button> */}
          </div>
        </div>

        {/* Map Container with Padding & Card */}
        <div className="flex-1 p-6 lg:p-12">
          <div className="w-full h-full bg-white rounded-2xl shadow-2xl relative">
            {/* Floating Map Controls */}
            <div className="absolute top-6 right-6 z-50 space-y-2">
              <button
                className="bg-white backdrop-blur-sm text-sm text-teal-700 px-3 py-1 rounded-full shadow hover:shadow-md transition"
                onClick={() => {
                  if (!mapRef.current) return;
                  mapRef.current.flyTo({ center: [0, 20], zoom: 1.3 });
                }}
              >
                World
              </button>

            </div>

            <div ref={mapContainer} className="w-full h-full rounded-2xl shadow-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}