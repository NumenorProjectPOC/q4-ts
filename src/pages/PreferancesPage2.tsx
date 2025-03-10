import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const PreferencesPage2 = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const navigate = useNavigate();

  const options = [
    'Political',
    'Demographic',
    'Environmental',
    'Legal',
    'Infrastructure',
    'Military',
    'Information',
    'Technology',
    'Economic',
    'Region',
    'Social'
  ];

  const handleOptionSelect = (option:any) => {
    setSelectedOption(option);
    // Store the selection in sessionStorage
    sessionStorage.setItem('selectedAnalysisType', option);
  };

  const handleNext = () => {
    // Navigate to the next page
    navigate('/preferences3'); // Update this path as needed
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with cyberpunk elements */}
     <Navbar/>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl text-gray-800 font-semibold mb-4">Select Analysis Framework</h2>
            <p className="text-gray-600">Choose one option that best fits your analytical needs:</p>
          </div>

          {/* Option grid with cyberpunk styling */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleOptionSelect(option)}
                className={`
                  h-24 relative overflow-hidden transition-all duration-300
                  border-2 rounded-md 
                  ${selectedOption === option 
                    ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-pink-50 shadow-lg transform scale-105' 
                    : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-md'}
                `}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`
                    font-medium text-lg relative z-10 tracking-wide
                    ${selectedOption === option ? 'text-blue-700' : 'text-gray-700'}
                  `}>
                    {option}
                  </span>
                </div>
                
                {/* Decorative elements */}
                <div className={`
                  absolute bottom-0 left-0 w-full h-1
                  ${selectedOption === option ? 'bg-gradient-to-r from-blue-400 to-pink-400' : 'bg-gray-200'}
                `}></div>
                
                <div className={`
                  absolute top-0 right-0 w-3 h-3 transform rotate-45
                  ${selectedOption === option ? 'bg-blue-400' : 'bg-gray-200'}
                `}></div>
              </button>
            ))}
          </div>

          {/* Next button */}
          <div className="flex justify-center">
            <button
              onClick={handleNext}
              disabled={!selectedOption}
              className={`
                py-3 px-12 rounded-lg font-medium text-lg
                transition-all duration-300 relative
                ${selectedOption 
                  ? 'bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              <span className="relative z-10">Continue</span>
              {selectedOption && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-pink-600 opacity-0 hover:opacity-100 rounded-lg transition-opacity duration-300"></div>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Footer with cyberpunk elements */}

    </div>
  );
};

export default PreferencesPage2;