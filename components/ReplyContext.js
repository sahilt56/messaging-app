// components/ReplyContext.js

// Helper function (MessageBubble.js से)
const isImage = (fileName) => {
  if (!fileName) return false;
  return /\.(jpe?g|png|gif|webp)$/i.test(fileName);
};

export default function ReplyContext({ message, onCancel }) {
  if (!message) return null;

  const senderName = message.expand?.sender?.name || 'Unknown User';

  // --- 💡 NEW LOGIC TO FIX PREVIEW 💡 ---
  let previewContent = message.content;
  const hasAttachment = message.attachment;
  const attachmentFileName = message.attachment ? message.attachment.split('_').pop() : 'File';

  if (message.isSystemMessage) {
    // यह उन "System message" बबल्स को हैंडल करता है जो पहले से बने हुए हैं
    previewContent = message.content;
  } else if (message.content) {
    // अगर टेक्स्ट है, तो उसे दिखाएँ
    previewContent = message.content;
  } else if (message.isCodeSnippet) {
    // अगर यह एक कोड स्निपेट है
    previewContent = "💻 Code Snippet";
  } else if (hasAttachment && isImage(message.attachment)) {
    // अगर यह एक इमेज है
    previewContent = "📷 Image";
  } else if (hasAttachment) {
    // अगर यह एक फ़ाइल है
    previewContent = `📄 ${attachmentFileName || "Attachment"}`;
  } else if (!previewContent) {
    // अगर यह सिर्फ एक खाली मैसेज है
    previewContent = "Empty message";
  }
  // --- END OF NEW LOGIC ---

  return (
    <div className="p-3 bg-indigo-50 border-b border-t border-indigo-200 flex items-center justify-between">
      <div className="min-w-0 flex-1"> {/* Added flex-1 */}
        <p className="text-sm font-semibold text-indigo-800">
          Replying to {senderName}
        </p>
        <p className="text-sm text-gray-700 truncate">
          {previewContent} {/* 💡 Updated variable */}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="p-2 hover:bg-indigo-100 rounded-full ml-2" /* Added ml-2 */
        title="Cancel reply"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}