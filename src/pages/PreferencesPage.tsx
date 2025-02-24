
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const PreferencesPage = () => {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate("/main");
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <Navbar showLogo={true} showTabs={false} onSignOut={() => {}} />
      <div className="flex-grow flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold">Select Your Interests</h2>
        <input
          type="text"
          placeholder="Your Interests"
          className="mt-4 p-2 w-80 rounded-lg text-black"
        />
        <button
          className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg"
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PreferencesPage;