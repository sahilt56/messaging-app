// components/ChatHeaderMenu.js

import { useState, useEffect, useRef } from 'react';

// 1. 'onClearChat' prop को स्वीकार करें
export default function ChatHeaderMenu({ 
  conversationId, 
  currentUser,
  onScheduleMessage,
  onSetTimer,
  onChatInfo,
  onSearchDate,
  onExportChat,
  onClearChat // 🆕 नया prop
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // ... useEffect for outside click ...
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  // --- useEffect यहाँ खत्म होता है ---

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  }

  // 2. 💡 FIX: सभी मिसिंग हैंडलर्स को वापस जोड़ा गया
  const handleScheduleMessage = () => {
    onScheduleMessage?.();
    setIsOpen(false);
  };
  const handleSetTimer = () => {
    onSetTimer?.();
    setIsOpen(false);
  };
  const handleChatInfo = () => {
    onChatInfo?.();
    setIsOpen(false);
  };
  const handleSearchByDate = () => {
    onSearchDate?.();
    setIsOpen(false);
  };
  const handleExportChat = () => {
    onExportChat?.();
    setIsOpen(false);
  };
  const handleClearChat = () => {
    onClearChat?.();
    setIsOpen(false);
  };


  return (
    <div className="relative" ref={menuRef}>
      {/* Three-dot Button */}
      <button
        onClick={toggleMenu}
        className="p-2 hover:bg-gray-100 rounded-lg transition"
        title="More options"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {/* Dropdown Menu - 3. 💡 FIX: सही हैंडलर्स को कॉल किया जा रहा है */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-background rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 py-4">
          
          <button onClick={handleScheduleMessage} className="w-full px-4 py-3 text-left text-sm text-text-muted border border-border-color hover:bg-gray-100 transition flex items-center space-x-3"> 📅 <span>Schedule Message</span> </button>
          <button onClick={handleSetTimer} className="w-full px-4 py-3 text-left text-sm text-text-muted border border-border-color hover:bg-gray-100 transition flex items-center space-x-3"> ⏳ <span>Set Self-Destruct Timer</span> </button>
          <button onClick={handleChatInfo} className="w-full px-4 py-3 text-left text-sm text-text-muted border border-border-color hover:bg-gray-100 transition flex items-center space-x-3"> 📊 <span>Chat Info</span> </button>
          <button onClick={handleSearchByDate} className="w-full px-4 py-3 text-left text-sm text-text-muted border border-border-color hover:bg-gray-100 transition flex items-center space-x-3"> 🗓️ <span>Search by Date</span> </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button onClick={handleExportChat} className="w-full px-4 py-3 text-left text-sm text-text-muted hover:bg-gray-100 transition flex items-center space-x-3"> 💾 <span>Export Chat</span> </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button 
            onClick={handleClearChat}
            className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition flex items-center space-x-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Clear Chat</span>
          </button>
        </div>
      )}
    </div>
  );
}