// components/SearchDateModal.js
import { useState } from 'react';

export default function SearchDateModal({ isOpen, onClose, conversationId, onDateSelect }) {
  // Get today's date in YYYY-MM-DD format for the max attribute
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  
  const handleGoToDate = () => {
    console.log(`Search for messages on ${selectedDate} in conversation ${conversationId}`);
    
    // Check if onDateSelect is provided
    if (onDateSelect && typeof onDateSelect === 'function') {
      onDateSelect(selectedDate); // Pass the selected date back to ChatArea
    } else {
      console.warn('onDateSelect function not provided to SearchDateModal');
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-xs p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-lg font-semibold text-gray-800">Search by Date</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <label htmlFor="searchDate" className="block text-sm font-medium text-gray-700 mb-2">
          Select a date:
        </label>
        <input
          id="searchDate"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          max={today} // Cannot select future dates
        />

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleGoToDate}
            disabled={!selectedDate}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}