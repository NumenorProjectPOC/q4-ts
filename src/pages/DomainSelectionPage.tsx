import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

// // Import API function (commented out)
// import { fetchDomains } from './quantiforeapi'; // Assuming you'll have this function

const DomainSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<string[]>([
    'Asia',
    'India',
    'Population',
    'Regulatory Policies',
    'Geopolitical Stability',
    'Trade Agreements',
    'Governance Systems',
    'Political Ideologies',
    'Foreign Policy',
    'Aging Population',
    'Migration Trends',
    'Urbanization',
    'Ethnic Diversity',
    'Household Structures',
    'Climate Change',
    'Carbon Emissions',
    'Sustainability Policies',
    'Biodiversity',
    'Water Scarcity',
    'Natural Disaster Management',
  ]); // Static domain list

  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  // // Commented out API call effect
  // useEffect(() => {
  //   const selectedRegions = sessionStorage.getItem('selectedRegions');
  //   const selectedAnalysisType = sessionStorage.getItem('selectedAnalysisType');
  //   if (selectedRegions && selectedAnalysisType) {
  //     fetchDomains(selectedRegions, selectedAnalysisType)
  //       .then(data => {
  //         setDomains(data);
  //       })
  //       .catch(error => {
  //         console.error("Error fetching domains:", error);
  //       });
  //   }
  // }, []);

  const handleDomainSelect = (domain: string) => {
    setSelectedDomains(prev =>
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    );
  };

  const handleNext = () => {
    sessionStorage.setItem('selectedDomains', JSON.stringify(selectedDomains));
    navigate('/stocks');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar showTabs={false} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl text-gray-800 font-semibold mb-4">Select Domains</h2>
            <p className="text-gray-600">Choose relevant domains for your analysis:</p>
          </div>

          {/* Option grid with cyberpunk styling */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {domains.map((domain) => (
              <button
                key={domain}
                onClick={() => handleDomainSelect(domain)}
                className={`
                  h-24 relative overflow-hidden transition-all duration-300
                  border-2 rounded-md 
                  ${selectedDomains.includes(domain)
                    ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-pink-50 shadow-lg transform scale-105'
                    : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-md'}
                `}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`
                    font-medium text-lg relative z-10 tracking-wide
                    ${selectedDomains.includes(domain) ? 'text-blue-700' : 'text-gray-700'}
                  `}>
                    {domain}
                  </span>
                </div>

                {/* Decorative elements */}
                <div className={`
                  absolute bottom-0 left-0 w-full h-1
                  ${selectedDomains.includes(domain) ? 'bg-gradient-to-r from-blue-400 to-pink-400' : 'bg-gray-200'}
                `}></div>

                <div className={`
                  absolute top-0 right-0 w-3 h-3 transform rotate-45
                  ${selectedDomains.includes(domain) ? 'bg-blue-400' : 'bg-gray-200'}
                `}></div>
              </button>
            ))}
          </div>

          {/* Next button */}
          <div className="flex justify-center">
            <button
              onClick={handleNext}
              disabled={selectedDomains.length === 0}
              className={`
                py-3 px-12 rounded-lg font-medium text-lg
                transition-all duration-300 relative
                ${selectedDomains.length > 0
                  ? 'bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              <span className="relative z-10">Continue</span>
              {selectedDomains.length > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-pink-600 opacity-0 hover:opacity-100 rounded-lg transition-opacity duration-300"></div>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DomainSelectionPage;