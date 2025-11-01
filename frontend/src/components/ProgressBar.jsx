import React from "react";

const ProgressBar = ({ current, total, label }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{label}</span>
        <span>{current}/{total} ({percentage}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percentage === 100 
              ? 'bg-green-500' 
              : percentage >= 50 
              ? 'bg-blue-500' 
              : 'bg-yellow-500'
          }`}
          style={{ width: `${percentage}%` }}
        >
          <div className="h-full w-full bg-gradient-to-r from-transparent to-white opacity-25"></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;