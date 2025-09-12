import React from "react";

interface LoadingScreenProps {
  message?: string;
  fullscreen?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
  fullscreen = true,
}) => {
  return (
    <div
      className={`${
        fullscreen ? "fixed inset-0 z-50" : "absolute inset-0 z-10"
      } flex items-center justify-center bg-opacity-80 backdrop-blur-sm`}
    >
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-800 to-cyan-700 text-transparent bg-clip-text animate-pulse">
          {message}
        </h2>
      </div>
    </div>
  );
};

export default LoadingScreen;
