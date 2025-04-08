
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

  interface ContinentFeature {
    type: string;
    properties: { CONTINENT: string };
    geometry: any;
  }

  interface StateFeature {
    type: string;
    properties: { name: string; iso_3166_2: string; iso_3166_2_lvl: number; gn_id: string; gn_name: string; fips_10_4: string; mapcolor: number; mapcolor_nr: number; name_len: number; name_local: string; type: string; type_en: string; code_hasc: string; note: string; region: string; region_cod: string; region_big: string; region_big_cod: string; province: string; province_cod: string; district: string; district_cod: string; municipality: string; municipality_cod: string; };
    geometry: any;
  }


  // Component to automatically zoom to the bounds
  const ZoomToBounds = ({
    geojson,
    statesGeojson,
    showStates,
    selectedCountry,
    setResetTrigger
  }: {
    geojson: any;
    statesGeojson: any;
    showStates: boolean;
    selectedCountry: CountryFeature | null;
    setResetTrigger?: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
    const map = useMap();
    const hasZoomedRef = useRef(false);
  
    useEffect(() => {
      if (!selectedCountry && geojson) {
        const layer = L.geoJSON(geojson);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [50, 50] });
          hasZoomedRef.current = true;
          setResetTrigger?.(false); // reset flag once applied
        }
      }
  
      if (selectedCountry && showStates && statesGeojson) {
        const layer = L.geoJSON(statesGeojson, {
          filter: (feature) =>
            feature.properties.iso_3166_2.startsWith(selectedCountry.properties.ISO_A2),
        });
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [50, 50] });
        }
      }
    }, [geojson, statesGeojson, showStates, selectedCountry, map]);
  
    return null;
  };
  
  
  

  // Component to manage zoom-dependent visibility
  const ZoomHandler = ({
    setShowCountries,
    setShowStates,
    selectedCountry
  }: {
    setShowCountries: React.Dispatch<React.SetStateAction<boolean>>;
    setShowStates: React.Dispatch<React.SetStateAction<boolean>>;
    selectedCountry: CountryFeature | null;
  }) => {
    const map = useMap();

    useEffect(() => {
      const handleZoomChange = () => {
        const currentZoom = map.getZoom();
        setShowCountries(currentZoom > 3 && !selectedCountry); // Countries visible when zoomed in and no country selected
        setShowStates(currentZoom > 5 && selectedCountry !== null); // States visible when zoomed in further AND a country is selected
      };

      map.on('zoomend', handleZoomChange);

      // Initial check
      handleZoomChange();

      return () => {
        map.off('zoomend', handleZoomChange);
      };
    }, [map, setShowCountries, setShowStates, selectedCountry]);

    return null;
  };


  // Component to add labels to the map (continents or countries)
  // Modified MapLabels component with fixed continent positions
  const SubregionMapLabels = ({
    data,
    showLabels
  }: {
    data: any,
    showLabels: boolean
  }) => {
    const map = useMap();
    const subregionLabelsRef = useRef<L.Marker[]>([]);

    // Clean up existing labels before adding new ones
    useEffect(() => {
      return () => {
        subregionLabelsRef.current.forEach(label => {
          if (map) label.removeFrom(map);
        });
      };
    }, [map]);

    useEffect(() => {
      if (!data || !map || !showLabels) return;

      // Clear existing labels
      subregionLabelsRef.current.forEach(label => label.removeFrom(map));
      subregionLabelsRef.current = [];

      // Add CSS for labels if it doesn't exist
      if (!document.getElementById('map-label-styles')) {
        const style = document.createElement('style');
        style.id = 'map-label-styles';
        style.innerHTML = `
          .map-label-icon {
            background: transparent;
          }
          .map-label {
            color: #333;
            font-weight: bold;
            font-size: 18px;
            text-shadow: 1px 1px 1px white, -1px -1px 1px white, 1px -1px 1px white, -1px 1px 1px white;
            pointer-events: none;
            white-space: nowrap;
          }
          .subregion-label {
            color: #555555;
            font-weight: bold;
            font-family: 'Roboto', sans-serif;
            font-size: 18px;
            text-transform: uppercase;
          }
        `;
        document.head.appendChild(style);
      }

      const subregionPositions: Record<string, [number, number]> = {
        "Northern Africa": [25, 0],
        "Sub-Saharan Africa": [0, 20],
        "Central Asia": [45, 70],
        "Eastern Asia": [40, 120],
        "South-Eastern Asia": [15, 110],
        "Southern Asia": [25, 80],
        "Western Asia": [30, 45],
        "Eastern Europe": [55, 30],
        "Northern Europe": [65, 15],
        "Southern Europe": [40, 15],
        "Western Europe": [50, -10],
        "Caribbean": [20, -55],
        "Central America": [15, -100],
        "Northern America": [50, -100],
        "South America": [-20, -60],
        "Australia and New Zealand": [-30, 120],
        "Melanesia": [-10, 160],
        "Micronesia": [5, 150],
        "Polynesia": [-20, -160]
      };

      // Add labels for each feature
      const labels: L.Marker[] = [];
      data.features.forEach((feature: any) => {
        try {
          const subregionName = feature.properties.CONTINENT;

          // Skip if no subregion name
          if (!subregionName) return;

          // Get the custom position for this subregion or calculate from bounds as fallback
          let labelPosition;
          if (subregionPositions[subregionName]) {
            labelPosition = L.latLng(subregionPositions[subregionName][0], subregionPositions[subregionName][1]);
          } else {
            // Fallback to calculating from bounds
            const tempLayer = L.geoJSON(feature);
            const bounds = tempLayer.getBounds();
            labelPosition = bounds.getCenter();
          }

          const label = L.marker(labelPosition, {
            icon: L.divIcon({
              className: 'map-label-icon',
              html: `<div class="map-label subregion-label">${subregionName}</div>`,
              iconSize: [120, 40],
              iconAnchor: [60, 20]
            })
          }).addTo(map);

          labels.push(label);
        } catch (error) {
          console.warn(`Error adding label for subregion:`, error);
        }
      });

      subregionLabelsRef.current = labels;
    }, [data, map, showLabels]);

    return null;
  };

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
    const [continents, setContinents] = useState<any | null>(null);
    const [statesGeoJSON, setStatesGeoJSON] = useState<any | null>(null);
    const [showCountries, setShowCountries] = useState(false);
    const [showStates, setShowStates] = useState(false); // State to control state visibility
    const [countryFeatures, setCountryFeatures] = useState<CountryFeature[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null);
    const [selectedCountries, setSelectedCountries] = useState<{ [country: string]: Set<string> }>({});
    const [showSelectedPanel, setShowSelectedPanel] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectionLimitReached, setSelectionLimitReached] = useState(false);
    const [modalStates, setModalStates] = useState<string[]>([]);
    const [currentCountry, setCurrentCountry] = useState<string | null>(null);

    // Fetch country, continent, and state data
    useEffect(() => {
      const fetchData = async () => {
        try {
          // Create mapping of country ISO codes to their English names
          const countryMap = Country.getAllCountries().reduce((map, country) => {
            map[country.isoCode] = country.name;
            return map;
          }, {} as Record<string, string>);

          // Fetch countries GeoJSON
          const countryResponse = await fetch(
            "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"
          );

          if (!countryResponse.ok) throw new Error("Failed to fetch countries");
          const countryData = await countryResponse.json();

          console.log("countryData", countryData);
          


          // Process country data with English names
          const processedCountryData = {
            ...countryData,
            features: countryData.features.map((feature: any) => {
              const isoCode = feature.properties.ISO_A2;
              if (isoCode && countryMap[isoCode]) {
                feature.properties.ADMIN = countryMap[isoCode];
            
                feature.properties.NAME = countryMap[isoCode];
              }
              return feature;
            }),
          };


          // console.log("Processed Country Data:", processedCountryData); // Add this line
          setCountries(processedCountryData);
          setCountryFeatures(processedCountryData.features);

          // Fetch continents GeoJSON (same as before)
          const continentResponse = await fetch(
            "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"
          );

          if (!continentResponse.ok) throw new Error("Failed to fetch continents");
          const continentData = await continentResponse.json();

          // Process continent data - group countries by continent (same as before)
          const processedContinentData: any = {
            type: "FeatureCollection",
            features: []
          };

          // Define continents and their member countries (same as before)
          const subregionMapping: { [key: string]: string[] } = {
            "Northern Africa": ["DZ", "EG", "LY", "MA", "SD", "TN"],
            "Sub-Saharan Africa": ["AO", "BJ", "BW", "BF", "BI", "CM", "CV", "CF", "TD", "KM", "CD", "CG", "CI", "DJ", "GQ", "ER", "ET", "GA", "GM", "GH", "GN", "GW", "KE", "LS", "LR", "MG", "MW", "ML", "MR", "MU", "MZ", "NA", "NE", "NG", "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SZ", "TZ", "TG", "UG", "ZM", "ZW"],
            "Central Asia": ["KZ", "KG", "TJ", "TM", "UZ"],
            "Eastern Asia": ["CN", "JP", "KP", "KR", "MN"],
            "South-Eastern Asia": ["BN", "KH", "ID", "LA", "MY", "MM", "PH", "SG", "TH", "TL", "VN"],
            "Southern Asia": ["AF", "BD", "BT", "IN", "IR", "MV", "NP", "PK", "LK"],
            "Western Asia": ["AM", "AZ", "BH", "CY", "GE", "IQ", "IL", "JO", "KW", "LB", "OM", "PS", "QA", "SA", "SY", "TR", "AE", "YE"],
            "Eastern Europe": ["BY", "BG", "CZ", "HU", "PL", "MD", "RO", "RU", "SK", "UA"],
            "Northern Europe": ["AX", "DK", "EE", "FO", "FI", "GG", "IS", "IE", "IM", "JE", "LV", "LT", "NO", "SJ", "SE", "GB"],
            "Southern Europe": ["AL", "AD", "BA", "HR", "GI", "GR", "VA", "IT", "MT", "ME", "MK", "PT", "SM", "RS", "SI", "ES"],
            "Western Europe": ["AT", "BE", "FR", "DE", "LI", "LU", "MC", "NL", "CH"],
            "Caribbean": ["AG", "BS", "BB", "CU", "DM", "DO", "GD", "HT", "JM", "KN", "LC", "VC", "TT"],
            "Central America": ["BZ", "CR", "SV", "GT", "HN", "MX", "NI", "PA"],
            "Northern America": ["BM", "CA", "GL", "PM", "US"],
            "South America": ["AR", "BO", "BR", "CL", "CO", "EC", "FK", "GF", "GY", "PY", "PE", "SR", "UY", "VE"],
            "Australia and New Zealand": ["AU", "NZ"],
            "Melanesia": ["FJ", "NC", "PG", "SB", "VU"],
            "Micronesia": ["FM", "GU", "KI", "MH", "NR", "MP", "PW"],
            "Polynesia": ["AS", "CK", "PF", "NU", "PN", "WS", "TK", "TO", "TV", "WF"]
          };

          // Group countries by continent (same as before)
          for (const [continent, countryCodes] of Object.entries(subregionMapping)) {
            // Filter features for this continent
            const continentFeatures = continentData.features.filter((feature: any) =>
              countryCodes.includes(feature.properties.ISO_A2)
            );

            if (continentFeatures.length > 0) {
              // Create a custom feature for the continent
              const continentFeature = {
                type: "Feature",
                properties: {
                  CONTINENT: continent
                },
                geometry: {
                  type: "MultiPolygon",
                  coordinates: continentFeatures.flatMap((feature: any) => {
                    if (feature.geometry.type === "Polygon") {
                      return [feature.geometry.coordinates];
                    } else if (feature.geometry.type === "MultiPolygon") {
                      return feature.geometry.coordinates;
                    }
                    return [];
                  })
                }
              };

              processedContinentData.features.push(continentFeature);
            }
          }

          setContinents(processedContinentData);


          // Fetch states GeoJSON
          const statesResponse = await fetch(
            "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson"
          );

          if (!statesResponse.ok) throw new Error("Failed to fetch states");
          const statesData = await statesResponse.json();
          setStatesGeoJSON(statesData);


        } catch (err) {
          setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, []);

    // Get English country name based on ISO code (same as before)
    const getEnglishCountryName = (isoCode: string): string => {
      if (!isoCode || isoCode.length !== 2) {
        return "Unknown";
      }
      const country = Country.getAllCountries().find(c => c.isoCode === isoCode);
      return country ? country.name : isoCode;
    };

    // Open modal and load states (same as before)
    const handleDiveInto = (isoCode: string) => {
      debugger
      const englishName = getEnglishCountryName(isoCode);
      const country = countryFeatures.find((f) => f.properties.ISO_A2 === isoCode) || null;
      setSelectedCountry(country);
      setCurrentCountry(englishName);
      setModalStates(State.getStatesOfCountry(isoCode).map((state) => state.name));
    
      // Delay showing states until after modal opens and map is ready
      setTimeout(() => {
        setShowStates(false);
        setShowCountries(false);
      }, 300);
    
      setShowModal(true);
    };

    // Handle country selection (store all states if needed) (same as before)
    const handleSelectCountry = (isoCode: string, states: string[]) => {

      if (Object.keys(selectedCountries).length >= 5) {
        setSelectionLimitReached(true);
        return;
      }
      const englishName = getEnglishCountryName(isoCode);
      setSelectedCountries((prev) => ({
        ...prev,
        [englishName]: new Set(states),
      }));
    };

    // Select all states for current country (same as before)
    const handleSelectAllStates = () => {
      if (Object.keys(selectedCountries).length >= 5 && !selectedCountries[currentCountry!]) {
        setSelectionLimitReached(true);
        return;
      }
      if (!currentCountry) return;
      setSelectedCountries((prev) => ({
        ...prev,
        [currentCountry]: new Set(modalStates),
      }));
    };

    // Toggle individual state selection (same as before)
    const toggleStateSelection = (state: string) => {
      if (Object.keys(selectedCountries).length >= 5 && !selectedCountries[currentCountry!]) {
        setSelectionLimitReached(true);
        setShowModal(true);
        return;
      }
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

    // Remove a specific state from selections (same as before)
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

    // Remove an entire country and all its states (same as before)
    const handleRemoveCountry = (country: string) => {
      setSelectedCountries((prev) => {
        const { [country]: _, ...rest } = prev;
        return rest;
      });
    };

    // Handle next page button click (same as before)
    const handleNextPage = () => {
      debugger
      const formattedSelections = Object.entries(selectedCountries).reduce(
        (acc, [country, statesSet]) => {
          acc[country] = Array.from(statesSet);
          return acc;
        },
        {} as Record<string, string[]>
      );
      sessionStorage.setItem('selectedRegions', JSON.stringify(formattedSelections));
      navigate('/frameworks');
    };

    // Styling for GeoJSON features (same as before)
    const countryStyle = {
      fillColor: "#4CD7D0",
      weight: 1,
      color: "#2EC4C2",
      fillOpacity: 0.3,
    };

    const continentStyle = {
      fillColor: "#5D8AA8",
      weight: 2,
      color: "#4682B4",
      fillOpacity: 0.4,
    };

    const stateStyle = {
      fillColor: "#A0A0A0",
      weight: 0.8,
      color: "#808080",
      fillOpacity: 0.2,
    };


    if (loading) return (
      <div className="flex justify-center items-center h-screen bg-white"> {/* Changed background to white */}
        <div className="p-6 bg-white rounded-lg shadow-2xl border-2 border-teal-500"> {/* Added shadow-2xl and border */}
          <div className="text-teal-700 font-lato text-xl text-center">Loading map data...</div> {/* Themed text */}
          <div className="w-full h-1 mt-4 bg-gradient-to-r from-teal-400 to-teal-600 animate-pulse rounded-full"></div> {/* Themed loading bar */}
        </div>
      </div>
    );

    if (error) return (
      <div className="flex justify-center items-center h-screen bg-white"> {/* Changed background to white */}
        <div className="p-6 bg-white rounded-lg shadow-2xl border-2 border-red-500"> {/* Added shadow-2xl and border */}
          <div className="text-red-600 font-sairaStencil text-xl text-center">Error: {error}</div> {/* Themed text */}
          <div className="w-full h-1 mt-4 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div> {/*  Fixed gradient and added rounded-full */}
        </div>
      </div>
    );

    return (
      <>
        <Navbar showTabs={false} />
        <div className="grid grid-cols-5 grid-rows-5 gap-2 bg-gray-50">
          <div className="col-span-4 row-span-5">
            <div className="relative h-[90vh]">
              {/* Control Buttons */}
              <div className="absolute top-4 left-4 z-[1000] flex gap-2">
                {selectedCountry && (
                  <button
                    className="ml-5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded shadow-lg font-poppins transition-all duration-300"
                    onClick={() => {
                      setSelectedCountry(null);
                      setShowStates(false);
                      setShowCountries(false);
                    }}
                  >
                    ← World View
                  </button>
                )}
                <button
                  className="bg-gradient-to-r ml-10 from-teal-500 to-pink-500 hover:from-teal-600 hover:to-pink-600 text-white px-4 py-2 rounded shadow-lg font-poppins transition-all duration-300"
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
                center={[25, 10]} // Central focus
                zoom={2.4} // Zoom just enough to hide most gray sides
                minZoom={2.4} // Prevent zooming out
                maxBounds={[[-62, -155], [85, 180]]}
                maxBoundsViscosity={1.0} // Stop dragging outside bounds
                worldCopyJump={false}
                className="h-full w-full rounded-lg shadow-lg overflow-hidden"
              >
                <ZoomToBounds geojson={selectedCountry || null} statesGeojson={statesGeoJSON} showStates={showStates} selectedCountry={selectedCountry} />
                <ZoomHandler setShowCountries={setShowCountries} setShowStates={setShowStates} selectedCountry={selectedCountry} />

                <TileLayer
                  attribution='© <a href="https://stadiamaps.com/">Stadia Maps</a>, © <a href="https://openmaptiles.org/">OpenMapTiles</a> © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                  url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=YOUR_API_KEY" // Replace with your API key
                />

                {/* Render continents when zoomed out */}
                {continents && !showCountries && (
                  <>
                    <GeoJSON
                      data={continents}
                      style={continentStyle}
                      onEachFeature={(feature, layer) => {
                        const continentName = feature.properties.CONTINENT;

                        // Add a Popup for the continent
                        layer.bindPopup(`
                          <div class="popup-content font-poppins" style="border-top: 2px solid #4682B4;">
                            <h3 class="popup-title font-bold text-lg">${continentName}</h3>
                            <div class="popup-text mt-2">
                              <p>Zoom in to see countries</p>
                            </div>
                          </div>
                        `);
                      }}
                    />
                  <SubregionMapLabels data={continents} showLabels={true} />
                  </>
                )}

                {/* Render countries when zoomed in or country selected */}
                {countries && (showCountries || selectedCountry) && !showStates && (
                  <>
                    <GeoJSON
                      data={countries}
                      style={countryStyle}
                      onEachFeature={(feature, layer) => {
                        const isoCode = feature.properties.ISO_A2;
                        const englishName = feature.properties.ADMIN;

                        // Add a Popup for interactivity
                        layer.bindPopup(`
                          <div class="popup-content font-poppins" style="border-top: 2px solid #22d3ee;">
                            <h3 class="popup-title font-bold text-lg">${englishName}</h3>
                            <div class="popup-buttons flex flex-col gap-2 mt-2">
                              <button class="explore-btn bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-2 rounded hover:from-cyan-600 hover:to-blue-600 transition-all">1. Explore ${englishName}</button>
                              <button class="select-country-btn bg-gradient-to-r from-pink-500 to-teal-500 text-white p-2 rounded hover:from-pink-600 hover:to-teal-600 transition-all">2. Select Whole Country</button>
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
                  </>
                )}

                {/* Render states when zoomed in and a country is selected */}
                {statesGeoJSON && showStates && selectedCountry && (
                  <>
                    <GeoJSON
                      data={statesGeoJSON}
                      style={stateStyle}
                      filter={(feature: any) => feature.properties.iso_3166_2.startsWith(selectedCountry.properties.ISO_A2)} // Filter states by selected country ISO
                    />
                  
                  </>
                )}
              </MapContainer>
            </div>
          </div>
          <div className="row-span-5 col-start-5 flex justify-center">
            {selectionLimitReached && (
              <div className="absolute top-4 right-4 z-[2000] bg-red-200 border border-red-500 text-red-700 px-4 py-3 rounded" role="alert">
                <strong className="font-bold">Selection Limit Reached!</strong>
                <span className="block sm:inline">You can only select up to 5 regions.</span>
                <button className="ml-2 text-red-500 font-bold" onClick={() => setSelectionLimitReached(false)}>
                  X
                </button>
              </div>
            )}
            <div className="z-[1000] mt-6 mr-6 bg-white p-4 rounded-lg border border-cyan-400 shadow-xl max-h-[70vh] w-64 overflow-y-auto relative" style={{ fontFamily: 'Roboto, sans-serif' }}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-pink-500 to-cyan-400"></div>
              <h3 className="text-lg font-bold mb-4 text-gray-800 font-poppins" style={{ fontFamily: 'Roboto, sans-serif' }}>Selected Countries & States</h3>
              {Object.entries(selectedCountries).length === 0 ? (
                <p className="text-gray-500 font-poppins">No countries selected</p>
              ) : (
                Object.entries(selectedCountries).map(([country, states]) => (
                  <div key={country} className="mb-4 border-b pb-2 border-gray-200">
                    <div className="flex items-center justify-between">
                      <strong className="block font-poppins">{country}</strong>
                      <button
                        onClick={() => handleRemoveCountry(country)}
                        className="text-pink-500 hover:text-pink-700 text-sm font-medium transition-colors"
                        title="Remove country"
                      >
                        ✕
                      </button>
                    </div>
                    <ul className="ml-4 text-gray-700 mt-1 font-poppins text-sm">
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
                    w-full py-3 rounded-lg font-medium text-lg font-poppins
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