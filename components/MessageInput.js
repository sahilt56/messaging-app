// ✅ components/MessageInput.js - FINAL MOBILE FIX (Fixed Bottom Input)

import { useState, useRef, useEffect, useMemo } from 'react';
import ReplyContext from './ReplyContext';
import EmojiPicker from './EmojiPicker';
import { Code2 } from 'lucide-react';
import UserAvatar from './UserAvatar';

export default function MessageInput({
  onSendMessage,
  onTyping,
  replyingTo,
  onCancelReply,
  onOpenCodeModal,
  isReadOnly,
  participants = [], 
  currentUser
}) {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  const filteredParticipants = useMemo(() => {
    if (!mentionQuery) return participants;
    return participants.filter(p =>
      p.name.toLowerCase().includes(mentionQuery.toLowerCase()) &&
      p.id !== currentUser?.id
    );
  }, [participants, mentionQuery, currentUser?.id]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const minHeight = 48; 
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
      if (textareaRef.current.scrollHeight < minHeight) {
        textareaRef.current.style.height = minHeight + 'px';
      }
    }
  }, [message, replyingTo]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  useEffect(() => {
    if (!showMentionList) return;
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowMentionList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMentionList]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isReadOnly) {
      console.warn('Cannot send message: Admin-only chat');
      return;
    }
    
    if (message.trim() || file) {
      onSendMessage(message, file);
      setMessage('');
      setFile(null);
      setFilePreview(null);
      setShowEmojiPicker(false);
      setShowMentionList(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      onTyping?.(false);
    }
  };

  const handleKeyDown = (e) => {
    if (isReadOnly && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      return;
    }

    if (showMentionList) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev > 0 ? prev - 1 : filteredParticipants.length - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev < filteredParticipants.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredParticipants.length > 0) {
          e.preventDefault();
          handleMentionClick(filteredParticipants[mentionIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionList(false);
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  const handleChange = (e) => {
    if (isReadOnly) {
      console.warn('This chat is admin-only');
      return;
    }

    const text = e.target.value;
    setMessage(text);

    const cursorPos = e.target.selectionStart;
    const lastAtPos = text.lastIndexOf('@', cursorPos - 1);
    
    if (lastAtPos !== -1) {
      const query = text.substring(lastAtPos + 1, cursorPos);
      const charBeforeAt = lastAtPos > 0 ? text[lastAtPos - 1] : ' ';
      
      if (charBeforeAt === ' ' && !query.includes(' ')) {
        setMentionQuery(query);
        setShowMentionList(true);
        setMentionIndex(0);
      } else {
        setShowMentionList(false);
      }
    } else {
      setShowMentionList(false);
    }

    onTyping?.(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping?.(false);
    }, 2000);
  };

  const handleMentionClick = (user) => {
    const text = message;
    const cursorPos = textareaRef.current.selectionStart;
    const lastAtPos = text.lastIndexOf('@', cursorPos - 1);

    const mentionText = `@[${user.name}](${user.id}) `; 
    const textBefore = text.substring(0, lastAtPos);
    const textAfter = text.substring(cursorPos);

    setMessage(textBefore + mentionText + textAfter);
    setShowMentionList(false);
    setMentionQuery('');
    textareaRef.current.focus();
  };

  const handleFileSelect = (e) => {
    if (isReadOnly) {
      alert('Only admins can send files in this group');
      return;
    }

    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Increased file size limit to 50MB for videos
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (selectedFile.size > maxSize) {
        alert('File size must be less than 50MB');
        return;
      }
      
      setFile(selectedFile);
      
      // Generate preview for images and videos
      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Enhanced file icon function
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (fileType.startsWith('video/')) {
      return (
        <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      );
    }
    if (fileType.startsWith('audio/')) {
      return (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    }
    if (fileType === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    if (fileType.includes('zip') || fileType.includes('rar')) {
      return (
        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const handleEmojiClick = (emojiData, event) => {
    const emoji = emojiData.emoji;
    setMessage((prevMessage) => prevMessage + emoji);
  };

  return (
    <div 
      // 🛑 FIX: Make it fixed at the bottom for mobile
      className="bg-background border-t border-border-color sticky bottom-0 z-20 shadow-lg md:relative"
    >
      <ReplyContext message={replyingTo} onCancel={onCancelReply} />
      
      {isReadOnly ? (
        <div className="px-6 py-4">
          <div className="w-full text-center text-sm text-text-muted p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-medium text-yellow-800">
              Only group admins can send messages in this chat
            </span>
          </div>
        </div>
      ) : (
        <div className="px-4 py-2 relative md:px-6" ref={wrapperRef}> {/* 🛑 FIX: Reduced px-6 to px-4 for mobile spacing */}
          {showMentionList && filteredParticipants.length > 0 && (
            <div className="absolute bottom-full left-6 right-6 mb-2 max-h-60 overflow-y-auto bg-background rounded-lg shadow-xl border border-border-color z-20">
              {filteredParticipants.map((user, index) => (
                <div
                  key={user.id}
                  onClick={() => handleMentionClick(user)}
                  className={`flex items-center space-x-3 p-3 cursor-pointer hover:bg-bg-subtle ${
                    index === mentionIndex ? 'bg-bg-subtle' : ''
                  }`}
                >
                  <UserAvatar user={user} size="sm" />
                  <span className="font-medium text-foreground">{user.name}</span>
                  <span className="text-sm text-text-muted">{user.email}</span>
                </div>
              ))}
            </div>
          )}

          {showEmojiPicker && (
            <div className="absolute bottom-24 right-6 z-10">
              <EmojiPicker onEmojiClick={handleEmojiClick} /> 
            </div>
          )}

          {/* Enhanced File Preview with Video Support */}
          {file && (
            <div className="mb-3 p-3 bg-gray-100 rounded-xl border border-border-color flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {filePreview ? (
                  file.type.startsWith('video/') ? (
                    <video 
                      src={filePreview} 
                      className="w-16 h-16 rounded-lg object-cover border border-gray-300 shrink-0"
                      muted
                    />
                  ) : (
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-lg object-cover border border-gray-300 shrink-0"
                    />
                  )
                ) : (
                  <div className="flex items-center justify-center w-16 h-16 bg-background rounded-lg border border-gray-300 shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-text-muted">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                    {file.type && ` • ${file.type.split('/')[0]?.toUpperCase()}`}
                  </p>
                </div>
              </div>
              <button type="button" onClick={removeFile} className="p-1 hover:bg-gray-200 rounded-full transition shrink-0">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3 items-start">
            {/* Updated File Input with All Types */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,video/*,audio/*,.gif,.pdf,.doc,.docx,.txt,.zip,.rar,.mp3,.mp4,.mov,.avi,.mkv,.webm"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2 hover:bg-bg-subtle rounded-sm transition shrink-0"
              title="Attach file (images, videos, audio, documents)"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            <button 
              onClick={onOpenCodeModal}
              type="button" 
              className="p-3 text-text-muted hover:text-indigo-600"
              title="Send Code Snippet"
            >
              <Code2 className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message ?? ''} 
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows="1"
                className="w-full px-4 py-2 md:py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-foreground placeholder-gray-400 bg-background hide-scrollbar min-h-10 md:min-h-12"                
                style={{ 
    maxHeight: '128px', 
    minHeight: '48px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none'
  }}
              />

              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="absolute right-3 bottom-3 hover:bg-gray-100 rounded-lg p-1 transition"
                title="Add emoji"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            <button
              type="submit"
              disabled={!message.trim() && !file}
              className="p-3 bg-primary text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              title="Send message"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}