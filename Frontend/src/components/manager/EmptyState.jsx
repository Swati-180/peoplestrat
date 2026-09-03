import React from 'react';
import { FileQuestion, AlertCircle } from 'lucide-react';

export const EmptyState = ({ title = "No data available", description = "There is currently no data to display for this section.", icon = "info" }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-gray-50/50 border-dashed">
      {icon === "info" ? (
        <FileQuestion className="w-10 h-10 text-gray-400 mb-4" />
      ) : (
        <AlertCircle className="w-10 h-10 text-gray-400 mb-4" />
      )}
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>
    </div>
  );
};
