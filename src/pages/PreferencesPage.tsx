import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import { State, Country } from "country-state-city";
import Navbar from "../components/Navbar";
import { useNavigate } from 'react-router-dom';

// Interfaces
interface CountryFeature {
  type: string;
  properties: { NAME: string; ISO_A2: string };
  geometry: any;
}

// Component to automatically zoom to the bounds
const ZoomToBounds = ({ geojson }: { geojson: any }) => {
  const map = useMap();
  useEffect(() => {
    if (geojson) {
      const layer = L.geoJSON(geojson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [geojson, map]);
  return null;
};

// Component to add country labels to the map
const CountryLabels = ({ countries }: { countries: any }) => {
  const map = useMap();
  const labelsRef = useRef<L.Marker[]>([]);

  // Clean up existing labels before adding new ones
  useEffect(() => {
    return () => {
      labelsRef.current.forEach(label => {
        if (map) label.removeFrom(map);
      });
    };
  }, [map]);

  useEffect(() => {
    if (!countries || !map) return;

    // Clear existing labels
    labelsRef.current.forEach(label => label.removeFrom(map));
    labelsRef.current = [];

    // Add CSS for country labels if it doesn't exist
    if (!document.getElementById('country-label-styles')) {
      const style = document.createElement('style');
      style.id = 'country-label-styles';
      style.innerHTML = `
        .country-label-icon {
          background: transparent;
        }
        .country-label {
          color: #333;
          font-weight: bold;
          font-size: 12px;
          text-align: center;
          text-shadow: 1px 1px 1px white, -1px -1px 1px white, 1px -1px 1px white, -1px 1px 1px white;
          pointer-events: none;
          white-space: nowrap;
        }
      `;
      document.head.appendChild(style);
    }

    // Function to get English country name
    const getEnglishCountryName = (isoCode: string): string => {
      if (!isoCode || isoCode.length !== 2) return "Unknown";
      const country = Country.getAllCountries().find(c => c.isoCode === isoCode);
      return country ? country.name : isoCode;
    };

    // Add labels for each country
    const labels: L.Marker[] = [];
    countries.features.forEach((feature: any) => {
      try {
        const isoCode = feature.properties.ISO_A2;
        const englishName = getEnglishCountryName(isoCode);
        
        // Create a temporary layer to get the center
        const tempLayer = L.geoJSON(feature);
        const bounds = tempLayer.getBounds();
        
        // Only add labels for countries with sufficient area
        if (bounds.isValid() && 
            bounds.getNorth() - bounds.getSouth() > 3 &&
            bounds.getEast() - bounds.getWest() > 3) {
          
          const center = bounds.getCenter();
          const countryLabel = L.marker(center, {
            icon: L.divIcon({
              className: 'country-label-icon',
              html: `<div class="country-label">${englishName}</div>`,
              iconSize: [100, 40],
              iconAnchor: [50, 20]
            })
          }).addTo(map);
          
          labels.push(countryLabel);
        }
      } catch (error) {
        console.warn("Error adding label for country:", error);
      }
    });
    
    labelsRef.current = labels;
  }, [countries, map]);

  return null;
};

// Modal Component for Selecting States
const StatesModal = ({
  isOpen,
  onClose,
  states,
  selectedStates,
  toggleStateSelection,
  onSelectAll,
  currentCountry,
}: {
  isOpen: boolean;
  onClose: () => void;
  states: string[];
  selectedStates: Set<string>;
  toggleStateSelection: (state: string) => void;
  onSelectAll: () => void;
  currentCountry: string | null;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-[1000]">
      <div className="bg-white p-6 rounded-lg border border-cyan-400 shadow-xl max-w-md w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-pink-500 to-cyan-400"></div>
        <h2 className="text-xl font-bold mb-4 text-gray-900">Select States</h2>
        <div className="flex justify-between mb-4">
          <button
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-md"
            onClick={() => {
              onSelectAll();
              console.log(`Selected whole country: ${currentCountry}`);
            }}
          >
            Select Whole Country
          </button>
        </div>
        <ul className="max-h-60 overflow-y-auto border border-gray-200 p-2 rounded bg-gray-50">
          {states.length ? (
            states.map((state) => (
              <li key={state} className="p-2 border-b border-gray-200 flex items-center hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  className="mr-2 accent-cyan-500"
                  checked={selectedStates.has(state)}
                  onChange={() => toggleStateSelection(state)}
                />
                {state}
              </li>
            ))
          ) : (
            <p className="text-gray-500">No states found</p>
          )}
        </ul>
        <div className="flex justify-between mt-4">
          <button
            className="px-4 py-2 bg-gradient-to-r from-green-400 to-cyan-500 text-white rounded hover:from-green-500 hover:to-cyan-600 transition-all duration-300 shadow-md"
            onClick={() => {
              console.log(`Selected states for ${currentCountry}:`, Array.from(selectedStates));
              onClose();
            }}
          >
            Save Selections
          </button>
          <button
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded hover:from-pink-600 hover:to-red-600 transition-all duration-300 shadow-md"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Map Component
const WorldMap = () => {
  const navigate = useNavigate();

  const [countries, setCountries] = useState<any | null>(null);
  const [countryFeatures, setCountryFeatures] = useState<CountryFeature[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null);
  const [selectedCountries, setSelectedCountries] = useState<{ [country: string]: Set<string> }>({});
  const [showSelectedPanel, setShowSelectedPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalStates, setModalStates] = useState<string[]>([]);
  const [currentCountry, setCurrentCountry] = useState<string | null>(null);

  // Fetch country data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Create mapping of country ISO codes to their English names
        const countryMap = Country.getAllCountries().reduce((map, country) => {
          map[country.isoCode] = country.name;
          return map;
        }, {} as Record<string, string>);
        
        // Fetch and process GeoJSON with English names
        const response = await fetch(
          "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"
        );
        
        if (!response.ok) throw new Error("Failed to fetch countries");
        const data = await response.json();
        
        // Replace country names with English names from country-state-city
        const processedData = {
          ...data,
          features: data.features.map((feature: any) => {
            const isoCode = feature.properties.ISO_A2;
            // Use English name from country-state-city if available
            if (isoCode && countryMap[isoCode]) {
              feature.properties.ADMIN = countryMap[isoCode]; // Replace with English name
              feature.properties.NAME = countryMap[isoCode]; // Replace with English name
            }
            return feature;
          })
        };
        
        setCountries(processedData);
        setCountryFeatures(processedData.features);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get English country name based on ISO code
  const getEnglishCountryName = (isoCode: string): string => {
    if (!isoCode || isoCode.length !== 2) {
      return "Unknown";
    }
    const country = Country.getAllCountries().find(c => c.isoCode === isoCode);
    return country ? country.name : isoCode;
  };

  // Open modal and load states
  const handleDiveInto = (isoCode: string) => {
    const englishName = getEnglishCountryName(isoCode);
    setSelectedCountry(
      countryFeatures.find((f) => f.properties.ISO_A2 === isoCode) || null
    );
    setModalStates(State.getStatesOfCountry(isoCode).map((state) => state.name));
    setCurrentCountry(englishName);
    setShowModal(true);
  };

  // Handle country selection (store all states if needed)
  const handleSelectCountry = (isoCode: string, states: string[]) => {
    const englishName = getEnglishCountryName(isoCode);
    setSelectedCountries((prev) => ({
      ...prev,
      [englishName]: new Set(states),
    }));
  };

  // Select all states for current country
  const handleSelectAllStates = () => {
    if (!currentCountry) return;
    setSelectedCountries((prev) => ({
      ...prev,
      [currentCountry]: new Set(modalStates),
    }));
  };

  // Toggle individual state selection
  const toggleStateSelection = (state: string) => {
    if (!currentCountry) return;
    setSelectedCountries((prev) => {
      const updatedStates = new Set(prev[currentCountry] || []);
      if (updatedStates.has(state)) {
        updatedStates.delete(state);
      } else {
        updatedStates.add(state);
      }
      return { ...prev, [currentCountry]: updatedStates };
    });
  };

  // Remove a specific state from selections
  const handleRemoveState = (country: string, state: string) => {
    setSelectedCountries((prev) => {
      const updatedStates = new Set(prev[country]);
      updatedStates.delete(state);
      if (updatedStates.size === 0) {
        const { [country]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [country]: updatedStates };
    });
  };

  // Remove an entire country and all its states
  const handleRemoveCountry = (country: string) => {
    setSelectedCountries((prev) => {
      const { [country]: _, ...rest } = prev;
      return rest;
    });
  };

  // Handle next page button click
  const handleNextPage = () => {
    const formattedSelections = Object.entries(selectedCountries).reduce(
      (acc, [country, statesSet]) => {
        acc[country] = Array.from(statesSet);
        return acc;
      },
      {} as Record<string, string[]>
    );
    sessionStorage.setItem('selectedRegions', JSON.stringify(formattedSelections));
    navigate('/preferancePage2');
  };

  // Styling for GeoJSON features
  const countryStyle = {
    fillColor: "#4CD7D0",
    weight: 1,
    color: "#2EC4C2",
    fillOpacity: 0.3,
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-900">
      <div className="p-6 bg-white rounded-lg border border-cyan-400 shadow-xl">
        <div className="text-gray-800 font-mono">Loading map data...</div>
        <div className="w-full h-1 mt-2 bg-gradient-to-r from-cyan-400 via-pink-500 to-cyan-400 animate-pulse"></div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center h-screen bg-gray-900">
      <div className="p-6 bg-white rounded-lg border border-red-400 shadow-xl">
        <div className="text-red-500 font-mono">Error: {error}</div>
        <div className="w-full h-1 mt-2 bg-gradient-to-r from-red-400 via-pink-500 to-red-400"></div>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="grid grid-cols-5 grid-rows-5 gap-2 bg-gray-50">
        <div className="col-span-4 row-span-5">
          <div className="relative h-[90vh]">
            {/* Control Buttons */}
            <div className="absolute top-4 left-4 z-[1000] flex gap-2">
              {selectedCountry && (
                <button
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded shadow-lg font-mono transition-all duration-300"
                  onClick={() => setSelectedCountry(null)}
                >
                  ← World View
                </button>
              )}
              <button
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded shadow-lg font-mono transition-all duration-300"
                onClick={() => setShowSelectedPanel(!showSelectedPanel)}
              >
                Selected ({Object.keys(selectedCountries).length})
              </button>
            </div>

            {/* States Modal */}
            <StatesModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              states={modalStates}
              selectedStates={selectedCountries[currentCountry!] || new Set()}
              toggleStateSelection={toggleStateSelection}
              onSelectAll={handleSelectAllStates}
              currentCountry={currentCountry}
            />

            {/* Map Container */}
            <MapContainer 
              center={[20, 0]} 
              zoom={2} 
              className="h-full w-full rounded-lg shadow-lg overflow-hidden"
              maxBounds={[[-90, -180], [90, 180]]}
              minZoom={2}
              worldCopyJump={false}
            >
              <ZoomToBounds geojson={selectedCountry || null} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                noWrap={true}
                bounds={[[-90, -180], [90, 180]]}
              />
              
              {/* Add country labels as a separate React component */}
              {countries && <CountryLabels countries={countries} />}
              
              {/* Render GeoJSON with English names in popup */}
              {countries && (
                <GeoJSON
                  data={countries}
                  style={countryStyle}
                  onEachFeature={(feature, layer) => {
                    const isoCode = feature.properties.ISO_A2;
                    const englishName = getEnglishCountryName(isoCode);

                    // Add a Popup for interactivity
                    layer.bindPopup(`
                      <div class="popup-content font-mono" style="border-top: 2px solid #22d3ee;">
                        <h3 class="popup-title font-bold text-lg">${englishName}</h3>
                        <div class="popup-buttons flex flex-col gap-2 mt-2">
                          <button class="explore-btn bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-2 rounded hover:from-cyan-600 hover:to-blue-600 transition-all">1. Explore ${englishName}</button>
                          <button class="select-country-btn bg-gradient-to-r from-pink-500 to-purple-500 text-white p-2 rounded hover:from-pink-600 hover:to-purple-600 transition-all">2. Select Whole Country</button>
                        </div>
                      </div>
                    `);

                    // Add event listeners for interactivity
                    layer.on("popupopen", () => {
                      document.querySelector(".explore-btn")?.addEventListener("click", () => {
                        handleDiveInto(isoCode);
                      });
                      document.querySelector(".select-country-btn")?.addEventListener("click", () => {
                        const countryStates = State.getStatesOfCountry(isoCode).map(
                          (state) => state.name
                        );
                        handleSelectCountry(isoCode, countryStates);
                        layer.closePopup();
                      });
                    });
                  }}
                />
              )}
            </MapContainer>
          </div>
        </div>
        <div className="row-span-5 col-start-5">
          <div className="z-[1000] mt-6 mr-6 bg-white p-4 rounded-lg border border-cyan-400 shadow-xl max-h-[70vh] w-64 overflow-y-auto relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-pink-500 to-cyan-400"></div>
            <h3 className="text-lg font-bold mb-4 text-gray-800 font-mono">Selected Countries & States</h3>
            {Object.entries(selectedCountries).length === 0 ? (
              <p className="text-gray-500 font-mono">No countries selected</p>
            ) : (
              Object.entries(selectedCountries).map(([country, states]) => (
                <div key={country} className="mb-4 border-b pb-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <strong className="block font-mono">{country}</strong>
                    <button 
                      onClick={() => handleRemoveCountry(country)}
                      className="text-pink-500 hover:text-pink-700 text-sm font-medium transition-colors"
                      title="Remove country"
                    >
                      ✕
                    </button>
                  </div>
                  <ul className="ml-4 text-gray-700 mt-1 font-mono text-sm">
                    {[...states].map((state) => (
                      <li key={state} className="flex items-center justify-between py-1">
                        <span>- {state}</span>
                        <button 
                          onClick={() => handleRemoveState(country, state)}
                          className="text-pink-500 hover:text-pink-700 text-xs transition-colors"
                          title="Remove state"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
            <div className="mt-6">
              <button
                onClick={handleNextPage}
                disabled={Object.keys(selectedCountries).length === 0}
                className={`
                  w-full py-3 rounded-lg font-medium text-lg font-mono
                  transition-all duration-300 relative overflow-hidden
                  ${Object.keys(selectedCountries).length > 0 
                    ? 'bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                `}
              >
                <span className="relative z-10">Next Page</span>
                {Object.keys(selectedCountries).length > 0 && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-pink-600 opacity-0 hover:opacity-100 rounded-lg transition-opacity duration-300"></div>
                    <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-30 transition-opacity duration-300 blur-md bg-gradient-to-r from-cyan-400 to-pink-400"></div>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorldMap;