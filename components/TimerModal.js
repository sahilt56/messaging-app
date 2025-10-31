// components/TimerModal.js
import { useState, useEffect } from 'react';
// Assume a function exists to update the timer setting in PocketBase
// import { setConversationTimer } from '@/lib/pocketbase'; 

export default function TimerModal({ isOpen, onClose, conversationId, currentTimer, onNotification }) {
  // Options for timer duration (in seconds, 0 means off)
  const timerOptions = [
    { label: 'Off', value: 0 },
    { label: '1 Hour', value: 3600 },
    { label: '1 Day', value: 86400 },
    { label: '1 Week', value: 604800 },
    { label: '1 Month', value: 2592000 }, // Approx 30 days
  ];

  const [selectedDuration, setSelectedDuration] = useState(currentTimer || 0); // Default to 'Off' or current setting
  const [isSaving, setIsSaving] = useState(false);

  // Update selection if currentTimer prop changes
  useEffect(() => {
    setSelectedDuration(currentTimer || 0);
  }, [currentTimer]);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement API call to save the timer setting for the conversation
    try {
      // const success = await setConversationTimer(conversationId, selectedDuration);
      const success = true; // Placeholder
      if (success) {
        onNotification?.(`Self-destruct timer set to ${timerOptions.find(o => o.value === selectedDuration)?.label || 'Off'}.`, 'success');
        onClose();
      } else {
        onNotification?.('Failed to set timer.', 'error');
      }
    } catch (error) {
      console.error('Error setting timer:', error);
      onNotification?.('Failed to set timer.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5 border-b pb-3">
          <h2 className="text-xl font-bold text-gray-800">Set Self-Destruct Timer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Choose how long messages should remain in this chat before they are automatically deleted for everyone.
        </p>

        <div className="space-y-3 mb-6">
          {timerOptions.map((option) => (
            <label key={option.value} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-100">
              <input
                type="radio"
                name="timerDuration"
                value={option.value}
                checked={selectedDuration === option.value}
                onChange={() => setSelectedDuration(option.value)}
                className="form-radio h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                disabled={isSaving}
              />
              <span className="text-gray-800">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Timer'}
          </button>
        </div>
      </div>
    </div>
  );
}