// components/ExportChatModal.js
import { useState } from 'react';
// We might need getMessages to fetch all messages for export
// import { getMessages } from '@/lib/pocketbase'; 

export default function ExportChatModal({ isOpen, onClose, conversationId, onNotification }) {
  const [format, setFormat] = useState('txt'); // Default format
  const [isExporting, setIsExporting] = useState(false);

  // Placeholder function for actual export logic
  const handleExport = async () => {
    setIsExporting(true);
    onNotification?.(`Exporting chat in ${format.toUpperCase()} format...`, 'info');
    
    // TODO: Implement actual export logic
    // 1. Fetch ALL messages for the conversationId using getMessages (might need pagination handling)
    // 2. Format messages based on the selected 'format' (TXT, JSON, etc.)
    // 3. Create a Blob and trigger download
    
    try {
        console.log(`Exporting conversation ${conversationId} as ${format}`);
        // Simulate export process
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        
        // Placeholder: Simulate file download
        const dummyContent = `Chat History for ${conversationId}\nFormat: ${format}\n\nMessage 1...\nMessage 2...`;
        const blob = new Blob([dummyContent], { type: `text/${format === 'txt' ? 'plain' : 'json'}` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_export_${conversationId}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        onNotification?.('Chat exported successfully!', 'success');
        onClose();

    } catch (error) {
        console.error("Export failed:", error);
        onNotification?.('Failed to export chat.', 'error');
    } finally {
        setIsExporting(false);
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
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-lg font-semibold text-gray-800">Export Chat History</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Select the format for exporting the chat messages.
        </p>

        <div className="mb-5">
          <label htmlFor="formatSelect" className="block text-sm font-medium text-gray-700 mb-1">
            Export Format:
          </label>
          <select
            id="formatSelect"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isExporting}
          >
            <option value="txt">Plain Text (.txt)</option>
            <option value="json">JSON (.json)</option>
            {/* Add more formats later if needed, e.g., CSV */}
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}