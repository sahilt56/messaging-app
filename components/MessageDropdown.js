// components/MessageDropdown.js
import { motion } from "framer-motion";

export default function MessageDropdown({ messageId, onReply, onForward, onEmojiSelect, isOwn }) {
  const emojiOptions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  const handleEmojiClick = (emoji) => {
    console.log('MessageDropdown emoji click:', emoji);
    onEmojiSelect(emoji, messageId);
  };

  return (
    <>
      {/* Mobile Overlay (semi-transparent background) */}
      <div className="fixed inset-0 bg-black/30 sm:hidden z-10" onClick={(e) => e.stopPropagation()}></div>

      {/* Main Dropdown */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className={`
          absolute bottom-full mb-2
          ${isOwn ? 'right-0 sm:right-0' : 'left-0 sm:left-0'}
          bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col p-2 z-20 min-w-[150px]
          sm:static sm:min-w-[150px]
          sm:translate-x-0

          sm:block hidden
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Primary Actions: Reply, Forward */}
        <div className="flex justify-between border-b border-gray-100 pb-1 mb-1">
          <button
            onClick={onReply}
            title="Reply"
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-700 transition flex items-center space-x-1 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l3 3m-3-3l3-3" />
            </svg>
            <span>Reply</span>
          </button>
          <button
            onClick={onForward}
            title="Forward"
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-700 transition flex items-center space-x-1 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span>Forward</span>
          </button>
        </div>

        {/* Emoji Reactions */}
        <div className="flex justify-between space-x-0.5">
          {emojiOptions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              title={`React with ${emoji}`}
              className="text-2xl p-0.5 hover:bg-gray-100 rounded-md transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Mobile-specific Bottom Popup */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.25 }}
className="fixed left-0 right-0 bottom-[70px] bg-white sm:hidden z-50 rounded-2lg p-4 mx-auto max-w-md"
      >
        <div className="flex justify-around border-b border-gray-200 pb-2 mb-2">
          <button
            onClick={onReply}
            className="flex flex-col items-center text-gray-700"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l3 3m-3-3l3-3" />
            </svg>
            <span className="text-sm">Reply</span>
          </button>
          <button
            onClick={onForward}
            className="flex flex-col items-center text-gray-700"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span className="text-sm">Forward</span>
          </button>
        </div>

        <div className="flex justify-around">
          {emojiOptions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="text-3xl p-2 hover:bg-gray-100 rounded-md transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
}
