import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Settings, LogOut } from "lucide-react";
import ConfirmationPopup from "./ui/ConfirmationPopup";
import { useLocation } from "react-router-dom";

const Navbar: React.FC<{ showLogo?: boolean; showTabs?: boolean }> = ({
  showLogo = true,
  showTabs = true,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const username = sessionStorage.getItem("username") || "Guest";

  const handleSignOutClick = () => {
    setDropdownOpen(false);
    setConfirmSignOut(true);
  };

  const confirmSignOutHandler = () => {
    sessionStorage.clear();
    navigate("/");
  };

  const handleOutsideClick = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [dropdownOpen]);

  return (
    <>
      <nav
        className={`font-poppins text-text-primary px-4 py-3 flex justify-between items-center ${
          showTabs ? "bg-slate/80 backdrop-blur-md shadow-lg" : "bg-slate shadow-none"
        } transition-all duration-300`}        
        style={{ minHeight: "75px", zIndex: 9999 }}
      >
        <div
          className="text-4xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-teal-900 to-teal-500"
          style={{ fontFamily: 'Saira Stencil One, sans-serif' }}
        >
          QUANTIFORE
        </div>

        {showTabs && (
          <div className="flex gap-8 items-center text-md">
            <Link
              to="/monitoring"
              className={`relative pb-1 transition-all ${location.pathname === "/monitoring"
                ? "border-b-2 border-teal-600 text-teal-800"
                : "hover:text-sage-green"
                }`}
            >
              Monitoring
            </Link>

            <Link
              to="/visualization"
              className={`relative pb-1 transition-all ${location.pathname === "/visualization"
                ? "border-b-2 border-teal-600 text-teal-800"
                : "hover:text-sage-green"
                }`}
            >
              Visualization
            </Link>
            <Link
              to="/alert"
              className={`relative pb-1 transition-all ${location.pathname === "/alert"
                ? "border-b-2 border-teal-600 text-teal-800"
                : "hover:text-sage-green"
                }`}
            >
              Alerts
            </Link>
            <Link to="/signal" className={`relative pb-1 transition-all ${location.pathname === "/signal"
              ? "border-b-2 border-teal-600 text-teal-800"
              : "hover:text-sage-green"
              }`}
            >
              Signal
            </Link>

            { }
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="rounded-full p-2 bg-teal-600 hover:bg-teal-700 text-white transition shadow-md focus:scale-105 hover:scale-105"
              >
                <User size={24} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl z-50 animate-fade-in border border-gray-100">
                  <div className="px-4 pt-4 pb-2 border-b border-gray-100 text-md">
                    <p className="text-gray-500">Hello, <span className="text-teal-700 font-semibold">{username}</span>!</p>
                  </div>

                  <div className="px-4 pt-2 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Account
                  </div>

                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-teal-100"
                  >
                     <Settings size={16} className="text-gray-500" />
                    Settings
                  </Link>

                  <div className="border-t border-dotted border-gray-300 my-1 mx-2" />

                  <button
                    onClick={handleSignOutClick}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                  >
                    <LogOut size={16} className="text-red-500 " />
                    Sign Out
                  </button>
                </div>
              )}


            </div>
          </div>
        )}

        {!showTabs && (
          <button
            onClick={handleSignOutClick}
            className="text-orange-800 font-sans font-extrabold text-2xl hover:text-red-500 py-2 px-4 rounded-md focus:outline-none transition-all duration-300"
          >
            Sign Out
          </button>
        )}
      </nav>

      {confirmSignOut && (
        <ConfirmationPopup
          title="Confirm Sign Out"
          message="Are you sure you want to sign out?"
          onCancel={() => setConfirmSignOut(false)}
          onConfirm={confirmSignOutHandler}
        />
      )}

      {!showTabs && <div className="w-full border-b border-gray-300" />}
    </>
  );
};

export default Navbar;
