// components/ScheduleMessageModal.js
import { useState, useEffect } from 'react';
import { scheduleMessage, getCurrentUser } from '@/lib/pocketbase';

export default function ScheduleMessageModal({ isOpen, onClose, conversationId, currentUser, onNotification }) {
  const [message, setMessage] = useState('');
  const [scheduleTime, setScheduleTime] = useState(''); 
  const [isScheduling, setIsScheduling] = useState(false);
  const [user, setUser] = useState(currentUser);

  // Fetch current user if not provided
  useEffect(() => {
    if (!currentUser) {
      const fetchedUser = getCurrentUser();
      setUser(fetchedUser);
    } else {
      setUser(currentUser);
    }
  }, [currentUser]);

  // Get current time for min attribute (in local timezone)
  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSchedule = async () => {
    // Validate user exists
    if (!user || !user.id) {
      onNotification?.('User not authenticated. Please log in again.', 'error');
      return;
    }

    if (!message.trim() || !scheduleTime) {
      onNotification?.('Please fill all fields', 'error');
      return;
    }

    if (!conversationId) {
      onNotification?.('Invalid conversation', 'error');
      return;
    }

    setIsScheduling(true);
    
    try {
      // CRITICAL FIX: Convert local time to UTC
      // User enters "2025-10-27T17:01" in their local timezone (IST)
      // We need to convert this to UTC for database storage
      
      const localDate = new Date(scheduleTime); // This treats the input as local time
      const utcISOString = localDate.toISOString(); // Converts to UTC
      
      console.log('Scheduling message with timezone conversion:');
      console.log('  User selected (Local):', scheduleTime);
      console.log('  Local Date object:', localDate.toString());
      console.log('  Saved as UTC:', utcISOString);
      console.log('  Conversation:', conversationId);
      console.log('  Sender:', user.id);

      const success = await scheduleMessage(
        conversationId, 
        user.id, 
        message.trim(), 
        utcISOString  // Now sending proper UTC time
      );
      
      if (success) {
        onNotification?.('Message scheduled successfully! ✅', 'success');
        setMessage('');
        setScheduleTime('');
        onClose(); 
      } else {
        onNotification?.('Failed to schedule message. Please try again.', 'error');
      }
    } catch (error) {
      console.error("Error scheduling message:", error);
      onNotification?.('Failed to schedule message. Please try again.', 'error');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setScheduleTime('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Schedule a Message</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        
        {!user ? (
          <div className="text-center py-4 text-red-600">
            User not authenticated. Please log in again.
          </div>
        ) : (
          <>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message to schedule..."
              className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="4"
              disabled={isScheduling}
            />
            
            <label htmlFor="scheduleTime" className="block text-sm font-medium text-gray-700 mb-1">
              Select date and time (Your local time):
            </label>
            <input
              id="scheduleTime"
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min={getMinDateTime()}
              disabled={isScheduling}
            />
            <p className="text-xs text-gray-500 mb-6">
              💡 Message will be sent at the selected time in your timezone
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                disabled={isScheduling}
                className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                disabled={!message.trim() || !scheduleTime || isScheduling}
                className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScheduling ? 'Scheduling...' : 'Schedule Message'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}