import React from "react";
import { Link, useNavigate } from "react-router-dom";

interface NavbarProps {
  showLogo?: boolean;
  showTabs?: boolean;
  onSignOut?: (() => void) | null;
}

const Navbar: React.FC<NavbarProps> = ({ showLogo = true, showTabs = true, onSignOut = null }) => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    sessionStorage.clear();
    if (onSignOut) {
      onSignOut();
    }
    navigate("/");
  };

  return (
    <nav className="bg-navbar font-poppins text-text-primary shadow-md p-4 flex justify-between items-center" style={{ minHeight: "75px", zIndex: 9999 }}>
      {showLogo && !showTabs && (
        <div className="navbar-tabs w-full flex justify-between items-center">
          <div className="navbar-brand text-4xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-teal-900 to-teal-500"
            style={{ fontFamily: 'Saira Stencil One, sans-serif' }}>
            QUANTIFORE
          </div>
          <button
            onClick={handleSignOut}
            className="text-white bg-teal-800 hover:bg-teal-600 text-white123456
             py-2 px-4 rounded-md shadow-lg focus:outline-none focus:shadow-outline transition-colors duration-300"
          >
            Sign Out
          </button>
        </div>
      )}

      {showTabs && (
        <>
          <div className="navbar-brand text-4xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-teal-900 to-teal-500" style={{ fontFamily: 'Saira Stencil One, sans-serif' }}>QUANTIFORE</div>
          <div className="navbar-tabs flex gap-8 items-center">
            <Link to="/monitoring" className="tab cursor-pointer hover:text-sage-green">Monitoring</Link>
            <Link to="/visualization" className="tab cursor-pointer hover:text-sage-green">Visualization</Link>
            <Link to="/alert" className="tab cursor-pointer hover:text-sage-green">Alerts</Link>
            <button
              onClick={handleSignOut}
              className="text-white bg-teal-800 hover:bg-teal-600 text-white123456
             py-2 px-4 rounded-md shadow-lg focus:outline-none focus:shadow-outline transition-colors duration-300"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
