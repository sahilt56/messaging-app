// components/MessageBubble.js - MOBILE OPTIMIZED

import { useState, useEffect } from 'react';
import ReplySnippet from './ReplySnippet';
import ReactionList from './ReactionList'; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import MessageDropdown from './MessageDropdown'; // ✅ NEW IMPORT


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

const isImage = (fileName) => getFileType(fileName) === 'image';
const isVideo = (fileName) => getFileType(fileName) === 'video';
const isAudio = (fileName) => getFileType(fileName) === 'audio';

const getFileIcon = (fileName) => {
  const type = getFileType(fileName);
  const iconClass = "w-5 h-5 md:w-6 md:h-6";
  
  if (type === 'image') {
    return (
      <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  
  if (type === 'video') {
    return (
      <svg className={`${iconClass} text-purple-600`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
    );
  }
  
  if (type === 'audio') {
    return (
      <svg className={`${iconClass} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    );
  }
  
  if (type === 'pdf') {
    return (
      <svg className={`${iconClass} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  
  if (type === 'archive') {
    return (
      <svg className={`${iconClass} text-orange-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      </svg>
    );
  }
  
  return (
    <svg className={`${iconClass} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
};

export default function MessageBubble({ 
  message, 
  isOwn, 
  senderName, 
  currentUserId,
  onReply, 
  onForward, 
  onEmojiSelect,
  onDeleteForMe,
  onDeleteForEveryone
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderMessageContent = (content) => {
    if (!content) return '';
    const regex = /(@\[([^\]]+)\]\(([^)]+)\))|(https?:\/\/[^\s]+)/g;
    const parts = content.split(regex);
    
    return parts.filter(Boolean).map((part, index) => {
      if (part.startsWith('@[') && part.endsWith(')')) {
        const match = /@\[([^\]]+)\]\(([^)]+)\)/.exec(part);
        if (match) {
          const name = match[1];
          const id = match[2];
          const isCurrentUserMention = id === currentUserId;
          
          return (
            <span 
              key={index} 
              className={`font-semibold rounded px-1 text-xs md:text-sm ${
                isCurrentUserMention 
                ? 'bg-yellow-200 text-yellow-900' 
                : 'bg-primary/10 text-primary'
              }`}
            >
              @{name}
            </span>
          );
        }
      }
      
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-xs md:text-sm break-all"
          >
            {part}
          </a>
        );
      }

      return <span key={index} className="text-xs md:text-sm">{part}</span>;
    });
  };

  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  if (message.isSystemMessage) {
    return (
      <div className="flex justify-center my-1.5 md:my-2">
        <div className="px-2 md:px-3 py-1 bg-gray-200 text-gray-700 text-[10px] md:text-xs rounded-full shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  const handleDropdownClick = (e) => {
    e.stopPropagation();
    setShowDropdown((prev) => !prev);
  };

  const hasAttachment = message.attachment && message.expand?.attachmentUrl;
  const isOnlyAttachment = hasAttachment && (!message.content || message.content.trim() === '');
  const attachmentFileName = message.attachment ? message.attachment.split('_').pop() : 'File';
  const fileType = getFileType(message.attachment);
    // ✅ Helper functions for dropdown actions
  const handleCopy = () => {
    try {
      const copyText = message.content || message.expand?.attachmentUrl || 'Empty Message';
      navigator.clipboard.writeText(copyText);
    } catch (err) {
      console.error('Copy failed:', err);
    }
    setShowDropdown(false);
  };

  const handleDeleteForMe = () => {
    if (confirm('Delete this message for yourself?')) {
      onDeleteForMe(message.id);
      setShowDropdown(false);
    }
  };

  const handleDeleteForEveryone = () => {
    if (confirm('Delete this message for EVERYONE in the chat? This action cannot be undone.')) {
      onDeleteForEveryone(message.id);
      setShowDropdown(false);
    }
  };


  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 md:mb-4 relative group`}>
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${
        message.isCodeSnippet 
          ? 'w-[95%] md:w-[90%] max-w-[600px] min-w-0'
          : 'max-w-[85%] md:max-w-xs lg:max-w-md min-w-0'
      }`}>
        
        {!isOwn && senderName && (
          <span className="text-[10px] md:text-xs text-text-muted mb-0.5 md:mb-1 px-2 md:px-3">{senderName}</span>
        )}
        
        <div className={`relative ${message.expand?.reactions?.length > 0 ? 'pb-5 md:pb-6' : ''}`}>
          <div
            className={`rounded-2xl ${
              message.isCodeSnippet ? 'p-0 overflow-hidden' : 'px-2 py-1.5 md:px-4 md:py-2 overflow-hidden'
            } ${
              isOwn 
                ? (message.isCodeSnippet 
                  ? 'rounded-br-none'
                  : 'bg-primary text-primary-foreground rounded-br-none'
                )
                : (message.isCodeSnippet
                  ? 'rounded-bl-none'
                  : 'bg-background text-foreground border border-border-color rounded-bl-none'
                )
            }`}
          >
            {message.isForwarded && (
              <span className={`text-[10px] md:text-xs italic mb-0.5 md:mb-1 block ${isOwn ? 'text-primary-foreground/70' : 'text-text-muted'}`}>
                Forwarded Message
              </span>
            )}

            {message.expand?.replyTo && (
              <ReplySnippet message={message.expand.replyTo} isOwn={isOwn} />
            )}

            {message.isCodeSnippet ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={message.codeLanguage || 'text'}
                customStyle={{
                  margin: 0,
                  padding: '0.75rem',
                  fontSize: '0.75rem',
                  backgroundColor: isOwn ? '#1E293B' : '#1F2937', 
                  borderRadius: '1rem', 
                  overflowX: 'auto',
                  overflowY: 'auto',
                  maxHeight: '12rem',
                  maxWidth: 'calc(100vw - 60px)',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#4B5563 #1E1E1E',
                  wrapLines: true,
                }}
                codeTagProps={{
                  style: {
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }
                }}
                PreTag="div" 
                wrapLines={true}
                wrapLongLines={true}
              >
                {String(message.content).trimEnd()}
              </SyntaxHighlighter>
            ) : (
              <>
                {hasAttachment && (
                  <div className={`flex flex-col mb-1 ${(fileType === 'image' || fileType === 'video') ? 'p-0 rounded-xl overflow-hidden' : ''}`}>
                    
                    {fileType === 'image' && (
                      <a 
                        href={message.expand.attachmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block max-h-48 md:max-h-64 overflow-hidden rounded-lg"
                      >
                        <img 
                          src={message.expand.attachmentUrl} 
                          alt="Attachment" 
                          className="w-full h-auto object-cover hover:opacity-90 transition" 
                        />
                      </a>
                    )}
                    
                    {fileType === 'video' && (
                      <video 
                        src={message.expand.attachmentUrl} 
                        controls
                        className="w-full max-h-48 md:max-h-64 rounded-lg"
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                    
                    {fileType === 'audio' && (
                      <audio 
                        src={message.expand.attachmentUrl} 
                        controls
                        className="w-full mt-1 md:mt-2"
                        preload="metadata"
                      >
                        Your browser does not support the audio tag.
                      </audio>
                    )}
                    
                    <a 
                      href={message.expand.attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex items-center space-x-2 md:space-x-3 p-1.5 md:p-2 rounded-lg transition mt-0.5 md:mt-1 ${
                        isOwn 
                          ? ((fileType === 'image' || fileType === 'video') ? 'bg-primary' : 'bg-primary hover:bg-primary/90') 
                          : ((fileType === 'image' || fileType === 'video') ? 'bg-bg-subtle' : 'bg-bg-subtle hover:bg-border-color') 
                      } ${(fileType === 'image' || fileType === 'video') ? 'mx-[-4px] mb-[-4px]' : ''} ${isOnlyAttachment ? '' : 'border-t border-dashed'}`}
                      onClick={(e) => e.stopPropagation()} 
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full ${isOwn ? 'bg-primary/80' : 'bg-background shadow'}`}>
                          {getFileIcon(message.attachment)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs md:text-sm font-medium truncate ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}> 
                          {attachmentFileName} 
                        </p>
                        <p className={`text-[10px] md:text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-text-muted'}`}> 
                          {fileType === 'image' && 'Image File'}
                          {fileType === 'video' && 'Video File'}
                          {fileType === 'audio' && 'Audio File'}
                          {fileType === 'pdf' && 'PDF Document'}
                          {fileType === 'document' && 'Document'}
                          {fileType === 'archive' && 'Archive'}
                          {fileType === 'file' && 'File'}
                        </p>
                      </div>
                      <svg className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${isOwn ? 'text-primary-foreground' : 'text-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                )}
                
                {message.content?.trim() && (
                  <p className={`text-xs md:text-sm whitespace-pre-wrap break-words ${hasAttachment ? 'mt-1 md:mt-2' : ''}`}>
                    {renderMessageContent(message.content)}
                  </p>
                )}
                
                {(!message.content?.trim() && !hasAttachment && !message.isCodeSnippet) && (
                  <p className="text-xs md:text-sm italic text-text-muted">Empty Message</p>
                )}
              </>
            )}
          </div>

          {/* 3-dot Menu Button - MOBILE OPTIMIZED */}
          {/* 3-dot Menu Button - MOBILE OPTIMIZED */}
          <div className={`absolute top-0 ${isOwn ? 'left-[-28px] md:left-[-32px]' : 'right-[-28px] md:right-[-32px]'}`}>
            <button
              onClick={handleDropdownClick}
              className={`p-1 md:p-1 rounded-full bg-background border border-border-color hover:bg-bg-subtle transition shadow-sm ${
                showDropdown ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>

            {showDropdown && (
              <MessageDropdown
                messageId={message.id}
                onReply={() => { onReply(); setShowDropdown(false); }}
                onForward={() => { onForward(); setShowDropdown(false); }}
                onEmojiSelect={(emoji, id) => { onEmojiSelect(emoji, id); setShowDropdown(false); }}
                onCopy={handleCopy}
                onDeleteForMe={handleDeleteForMe}
                onDeleteForEveryone={handleDeleteForEveryone}
                isOwn={isOwn}
              />
            )}
          </div>

          {message.expand?.reactions && message.expand.reactions.length > 0 && (
            <div className={`absolute bottom-0 ${isOwn ? 'right-0' : 'left-0'}`}>
              <ReactionList 
                reactions={message.expand.reactions} 
                currentUserId={currentUserId}
                onEmojiSelect={onEmojiSelect}
              />
            </div>
          )}
        </div>

        <span className="text-[10px] md:text-xs text-text-muted mt-0.5 md:mt-1 px-2 md:px-3">
          {formatTime(message.created)}
        </span>
      </div>
    </div>
  );
}