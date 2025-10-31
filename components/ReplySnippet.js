// components/ReplySnippet.js

// ✅ File type detection (MessageBubble से कॉपी किया गया)
const getFileType = (fileName) => {
  if (!fileName) return 'unknown';
  const ext = fileName.toLowerCase().split('.').pop();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'm4v'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) return 'audio';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'document';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  return 'file';
};

export default function ReplySnippet({ message, isOwn }) {
  if (!message) {
    return null;
  }

  const senderName = message.expand?.sender?.name || 'Unknown User';
  
  // --- 💡 नया लॉजिक: प्रीव्यू कंटेंट तय करें ---
  let previewContent = message.content || '...'; // डिफ़ॉल्ट रूप से कंटेंट का उपयोग करें
  const hasAttachment = message.attachment;
  const fileType = getFileType(message.attachment);
  const attachmentFileName = message.attachment ? message.attachment.split('_').pop() : 'File';

  if (message.isCodeSnippet) {
    // अगर यह कोड स्निपेट है
    previewContent = `💻 Code Snippet ${message.codeLanguage ? `(${message.codeLanguage})` : ''}`; 
  } else if (!message.content && hasAttachment) {
    // अगर कंटेंट नहीं है, लेकिन अटैचमेंट है
    if (fileType === 'image') previewContent = "📷 Image";
    else if (fileType === 'video') previewContent = "🎬 Video";
    else if (fileType === 'audio') previewContent = "🎵 Audio";
    else previewContent = `📄 ${attachmentFileName || "Attachment"}`;
  } else if (!message.content && !hasAttachment) {
    // अगर कंटेंट और अटैचमेंट दोनों नहीं हैं
    previewContent = "Empty message";
  }
  // --- एंड नया लॉजिक ---

  return (
    <div 
      className={`mb-2 p-2 rounded-lg max-w-full border-l-4 ${
        isOwn 
          ? 'bg-primary/20 border-primary/50' // खुद के लिए थोड़ा अलग स्टाइल
          : 'bg-bg-subtle border-indigo-500' // दूसरों के लिए
      }`}
    >
      <p className={`text-xs font-semibold mb-0.5 ${
        isOwn ? 'text-primary/90' : 'text-indigo-700'
      }`}>
        {senderName}
      </p>
      <p className={`text-xs truncate ${
        isOwn ? 'text-primary-foreground/80' : 'text-text-muted'
      }`}>
        {previewContent} {/* ✅ अपडेटेड वेरिएबल का उपयोग करें */}
      </p>
    </div>
  );
}