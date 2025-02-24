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
    if (onSignOut) {
      onSignOut();
    }
    navigate("/");
  };

  return (
    <nav className="navbar bg-slate-800 text-slate-300 shadow-md p-4 flex justify-between items-center" style={{ minHeight: "75px" }}>
      {showLogo && <div className="navbar-brand text-2xl font-bold quantifore-heading">QUANTIFORE</div>}

      {showTabs ? (
        <div className="navbar-tabs flex gap-8">
          <Link to="/main" className="tab cursor-pointer hover:text-white">Graph</Link>
          <Link to="/playground" className="tab cursor-pointer hover:text-white">Playground</Link>
          <Link to="/contact" className="tab cursor-pointer hover:text-white">Contact</Link>
          <button onClick={handleSignOut} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Sign Out
          </button>
        </div>
      ) : (
        onSignOut && (
          <button onClick={handleSignOut} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Sign Out
          </button>
        )
      )}
    </nav>
  );
};

export default Navbar;
