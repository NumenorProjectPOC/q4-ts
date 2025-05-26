import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { SkipForward } from "lucide-react";
import Navbar from "../Navbar";
import ConfirmationPopup from "./ConfirmationPopup";

const stepRoutes = ["/regions", "/frameworks", "/domains", "/stocks"];

const StepProgress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentStep = stepRoutes.indexOf(location.pathname);

  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <Navbar showTabs={false} />
      <div className="relative mt-3">
        <div className="flex justify-center gap-4 items-center animate-fade-in-up">
          {stepRoutes.map((path, idx) => (
            <motion.div
              key={path}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`transition-all duration-300 rounded-full ${
                idx === currentStep
                  ? "w-5 h-5 bg-orange-600 scale-125 shadow-lg"
                  : "w-3 h-3 bg-gray-300"
              }`}
            ></motion.div>
          ))}
        </div>

        <motion.button
          onClick={() => setShowConfirm(true)}
          whileTap={{ scale: 0.95 }}
          className="absolute right-6 top-0 flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full bg-teal-800 text-white shadow hover:brightness-110 hover:scale-105 transition"
        >
         Skip<SkipForward size={16} />
        </motion.button>
      </div>

      {showConfirm && (
        <ConfirmationPopup
          title="Skip Step Preferences?"
          message="This will skip all the preference selection steps and take you directly to the main page. Do you want to proceed?"
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            navigate("/monitoring");
            setShowConfirm(false);
          }}
        />
      )}
    </>
  );
};

export default StepProgress;



// i