import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
// import { submitFrameworks } from '../quantiforeapi'; // Assuming you'll have this function

const FrameworkSelectionPage = () => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [apiResponse, setApiResponse] = useState<any>(null); // State to hold API response
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

  const MAX_SELECTIONS = 5; // Limit to 5 selections

  const handleOptionSelect = (option: string) => {
    if (selectedOptions.includes(option)) {
      // Deselect the option
      setSelectedOptions(prev => prev.filter(item => item !== option));
    } else {
      // Select the option, but limit to MAX_SELECTIONS
      if (selectedOptions.length < MAX_SELECTIONS) {
        setSelectedOptions(prev => [...prev, option]);
      } else {
        // Optionally, display a message to the user that they can't select more than MAX_SELECTIONS
        alert(`You can select a maximum of ${MAX_SELECTIONS} frameworks.`);
      }
    }
  };

  const handleNext = async () => {
    // Perform API call to submit selected frameworks
    // try {
    //   const response = await submitFrameworks(selectedOptions); // Replace with your API call
    //   setApiResponse(response); // Store the API response in state
    //   console.log("API response", response);
    // } catch (error) {
    //   console.error("Error submitting frameworks:", error);
    //   // Handle the error (e.g., display an error message)
    // }

    // Store the selection in sessionStorage
    sessionStorage.setItem('selectedAnalysisType', JSON.stringify(selectedOptions));

    // Navigate to the next page
    navigate('/domains'); // Update this path as needed
  };

  useEffect(() => {
    console.log("Selected Options:", selectedOptions);
  }, [selectedOptions]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with cyberpunk elements */}
      {/* <Navbar showTabs={false}/> */}

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl text-gray-800 font-semibold mb-4">Select Analysis Frameworks</h2>
            <p className="text-gray-600">Choose up to {MAX_SELECTIONS} options that best fit your analytical needs:</p>
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
                  ${selectedOptions.includes(option)
                    ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-pink-50 shadow-lg transform scale-105'
                    : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-md'}
                `}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`
                    font-medium text-lg relative z-10 tracking-wide
                    ${selectedOptions.includes(option) ? 'text-blue-700' : 'text-gray-700'}
                  `}>
                    {option}
                  </span>
                </div>

                {/* Decorative elements */}
                <div className={`
                  absolute bottom-0 left-0 w-full h-1
                  ${selectedOptions.includes(option) ? 'bg-gradient-to-r from-blue-400 to-pink-400' : 'bg-gray-200'}
                `}></div>

                <div className={`
                  absolute top-0 right-0 w-3 h-3 transform rotate-45
                  ${selectedOptions.includes(option) ? 'bg-blue-400' : 'bg-gray-200'}
                `}></div>
              </button>
            ))}
          </div>

          {/* API Response Display (Conditional) */}
          {apiResponse && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <h3 className="font-semibold">API Response:</h3>
              <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
            </div>
          )}

          {/* Next button */}
          <div className="flex justify-center">
            <button
              onClick={handleNext}
              disabled={selectedOptions.length === 0}
              className={`
                py-3 px-12 rounded-lg font-medium text-lg
                transition-all duration-300 relative
                ${selectedOptions.length > 0
                  ? 'bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              <span className="relative z-10">Continue</span>
              {selectedOptions.length > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-pink-600 opacity-0 hover:opacity-100 rounded-lg transition-opacity duration-300"></div>
              )}
            </button>
          </div>
        </div>
      </main>


    </div>
  );
};

export default FrameworkSelectionPage;