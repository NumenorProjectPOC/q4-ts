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
    <nav className="bg-navbar text-text-primary shadow-md p-4 flex justify-between items-center" style={{ minHeight: "75px" }}>
      {showLogo && <div className="navbar-brand text-4xl font-bold tracking-widest" style={{ fontFamily: 'Saira Stencil One, sans-serif' }}>QUANTIFORE</div>}

      {showTabs ? (
        <div className="navbar-tabs flex gap-8 items-center">
          <Link to="/main" className="tab cursor-pointer hover:text-sage-green">Graph</Link>
          <Link to="/playground" className="tab cursor-pointer hover:text-sage-green">Playground</Link>
          <Link to="/contact" className="tab cursor-pointer hover:text-sage-green">Contact</Link>
          <button onClick={handleSignOut} className="bg-button-primary hover:bg-dark-button text-white font-bold py-2 px-4 rounded">
            Sign Out
          </button>
        </div>
      ) : (
        onSignOut && (
          <button onClick={handleSignOut} className="bg-button-primary hover:bg-dark-button text-white font-bold py-2 px-4 rounded">
            Sign Out
          </button>
        )
      )}
    </nav>
  );
};

export default Navbar;