import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

// // Import API function (commented out)
// import { fetchStocks } from '../quantiforeapi'; // Assuming you'll have this function

const StockSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<string[]>([
    'AAPL',
    'MSFT',
    'GOOGL',
    'AMZN',
    'TSLA',
    'NVDA',
    'JPM',
    'V',
    'UNH',
    'HD',
    'BAC',
    'DIS',
    'PYPL',
    'CMCSA',
    'ADBE',
    'CRM',
    'NFLX',
    'KO',
    'PFE',
    'MRK'
  ]); // Static stock list

  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);

  // // Commented out API call effect
  // useEffect(() => {
  //   const selectedRegions = sessionStorage.getItem('selectedRegions');
  //   const selectedAnalysisType = sessionStorage.getItem('selectedAnalysisType');
  //   const selectedDomains = sessionStorage.getItem('selectedDomains');
  //
  //   if (selectedRegions && selectedAnalysisType && selectedDomains) {
  //     fetchStocks(selectedRegions, selectedAnalysisType, selectedDomains)
  //       .then(data => {
  //         setStocks(data);
  //       })
  //       .catch(error => {
  //         console.error("Error fetching stocks:", error);
  //       });
  //   }
  // }, []);

  const handleStockSelect = (stock: string) => {
    setSelectedStocks(prev =>
      prev.includes(stock) ? prev.filter(s => s !== stock) : [...prev, stock]
    );
  };

  const handleNext = () => {
    sessionStorage.setItem('selectedStocks', JSON.stringify(selectedStocks));
    navigate('/monitoring'); // Changed to /main
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* <Navbar showTabs={false}/> */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl text-gray-800 font-semibold mb-4">Select Stocks</h2>
            <p className="text-gray-600">Choose stocks for analysis:</p>
          </div>

          {/* Option grid with cyberpunk styling */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {stocks.map((stock) => (
              <button
                key={stock}
                onClick={() => handleStockSelect(stock)}
                className={`
                  h-24 relative overflow-hidden transition-all duration-300
                  border-2 rounded-md 
                  ${selectedStocks.includes(stock)
                    ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-pink-50 shadow-lg transform scale-105'
                    : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-md'}
                `}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`
                    font-medium text-lg relative z-10 tracking-wide
                    ${selectedStocks.includes(stock) ? 'text-blue-700' : 'text-gray-700'}
                  `}>
                    {stock}
                  </span>
                </div>

                {/* Decorative elements */}
                <div className={`
                  absolute bottom-0 left-0 w-full h-1
                  ${selectedStocks.includes(stock) ? 'bg-gradient-to-r from-blue-400 to-pink-400' : 'bg-gray-200'}
                `}></div>

                <div className={`
                  absolute top-0 right-0 w-3 h-3 transform rotate-45
                  ${selectedStocks.includes(stock) ? 'bg-blue-400' : 'bg-gray-200'}
                `}></div>
              </button>
            ))}
          </div>

          {/* Next button */}
          <div className="flex justify-center">
            <button
              onClick={handleNext}
              disabled={selectedStocks.length === 0}
              className={`
                py-3 px-12 rounded-lg font-medium text-lg
                transition-all duration-300 relative
                ${selectedStocks.length > 0
                  ? 'bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              <span className="relative z-10">Continue</span>
              {selectedStocks.length > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-pink-600 opacity-0 hover:opacity-100 rounded-lg transition-opacity duration-300"></div>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StockSelectionPage;