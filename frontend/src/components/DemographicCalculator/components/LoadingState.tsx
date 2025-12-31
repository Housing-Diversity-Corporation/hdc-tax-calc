import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading housing and demographic data...' }) => {
  return (
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
};

export const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-700 mb-2">No Data Loaded</h3>
      <p className="text-gray-500 mb-4">Enter your location and click "Calculate Impact" to begin</p>
      <div className="text-left max-w-md mx-auto bg-white p-4 rounded border border-gray-200">
        <p className="text-sm text-gray-600 mb-2">Once loaded, you'll be able to:</p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✓ Toggle different policy requirements on/off</li>
          <li>✓ Adjust values to model different scenarios</li>
          <li>✓ See real-time cost impacts</li>
          <li>✓ View demographic exclusion analysis</li>
        </ul>
      </div>
    </div>
  );
};