// components/CodeSnippetModal.js - FIXED VERSION

import { useState } from 'react';

// Bhashao ki list (aap ismein aur add kar sakte hain)
const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'jsx', label: 'React (JSX)' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash/Shell' },
  { value: 'text', label: 'Plain Text' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
];

export default function CodeSnippetModal({ isOpen, onClose, onSend }) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');

  if (!isOpen) return null;

  const handleSend = () => {
    if (code.trim()) {
      onSend(code, language);
      setCode('');
      setLanguage('javascript');
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 relative z-50 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Code Snippet</h2>

        {/* Language Selector */}
        <div className="mb-4">
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Code Input - ✅ FIXED VERSION */}
        <div className="flex-1 flex flex-col min-h-0">
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Code
          </label>
          <textarea
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm resize-none overflow-auto"
            style={{
              minHeight: '300px',
              maxHeight: '500px',
              whiteSpace: 'pre',      // ✅ Preserves spaces and newlines
              overflowWrap: 'normal', // ✅ Doesn't break words
              wordBreak: 'normal',    // ✅ Normal word breaking
            }}
            placeholder="Paste your code here..."
            spellCheck="false"
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Tip: Code will scroll horizontally if lines are too long
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            disabled={!code.trim()}
          >
            Send Snippet
          </button>
        </div>
      </div>
    </div>
  );
}