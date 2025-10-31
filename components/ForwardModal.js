// components/ForwardModal.js - WITH FILE/VIDEO FORWARD SUPPORT
import { useState, useEffect } from 'react';
import { getConversations, getGroupIconUrl } from '@/lib/pocketbase';
import UserAvatar from './UserAvatar';

export default function ForwardModal({ isOpen, onClose, currentUser, onForward, message, onNotification }) {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Load conversations when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      loadConversations();
    }
  }, [isOpen, currentUser]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const convos = await getConversations(currentUser.id);
      setConversations(convos);
    } catch (error) {
      console.error('Error loading conversations:', error);
      onNotification?.('Failed to load conversations', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get other participant from conversation
  const getOtherParticipant = (conversation) => {
    if (conversation?.isGroup) return null;
    if (!conversation.expand?.participants) return null;
    return conversation.expand.participants.find(p => p.id !== currentUser.id);
  };

  // Get conversation display name
  const getConversationName = (conversation) => {
    if (conversation?.isGroup) {
      return conversation.groupName || 'Unnamed Group';
    }
    const otherUser = getOtherParticipant(conversation);
    return otherUser?.name || 'Unknown User';
  };

  // Render conversation avatar (supports groups)
  const renderConversationAvatar = (conversation) => {
    if (conversation?.isGroup) {
      const groupIconUrl = getGroupIconUrl(conversation);
      if (groupIconUrl) {
        return (
          <img 
            src={groupIconUrl} 
            alt="Group" 
            className="w-10 h-10 rounded-full object-cover"
          />
        );
      }
      return (
        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      );
    }
    
    const otherUser = getOtherParticipant(conversation);
    return (
      <UserAvatar 
        name={otherUser?.name} 
        user={otherUser}
        size="sm"
      />
    );
  };

  // ✅ NEW: Get file type for icon display
  const getFileType = (filename) => {
    if (!filename) return 'file';
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx', 'txt'].includes(ext)) return 'document';
    return 'file';
  };

  const handleConfirm = () => {
    if (!selectedChatId) {
      onNotification?.('Please select a chat to forward to.', 'warning');
      return;
    }
    onForward(selectedChatId);
    handleClose();
  };

  const handleClose = () => {
    setSelectedChatId(null);
    onClose();
  };

  if (!isOpen || !message) return null;

  // ✅ Check if message has attachment
  const hasAttachment = message.attachment || message.expand?.attachmentUrl;
  const attachmentUrl = message.expand?.attachmentUrl || message.attachment;
  const fileType = getFileType(message.attachment);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Forward Message</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-gray-700 mb-2 font-semibold">Message Preview:</p>
          
          {/* ✅ Message Preview with Attachment Support */}
          <div className="p-3 bg-gray-100 rounded-lg mb-4 text-sm text-gray-800 max-w-full">
            {hasAttachment ? (
              <div className="space-y-2">
                {/* Show attachment preview */}
                {fileType === 'image' && attachmentUrl && (
                  <img 
                    src={attachmentUrl} 
                    alt="Attachment" 
                    className="w-full max-h-40 object-cover rounded-lg"
                  />
                )}
                
                {fileType === 'video' && attachmentUrl && (
                  <video 
                    src={attachmentUrl} 
                    className="w-full max-h-40 rounded-lg"
                    controls={false}
                  />
                )}
                
                {/* File info */}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  {fileType === 'image' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  )}
                  {fileType === 'video' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  )}
                  {fileType === 'file' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="font-medium">
                    {message.attachment?.split('_').pop() || 'Attachment'}
                  </span>
                </div>
                
                {/* Show content if exists */}
                {message.content && (
                  <p className="italic mt-2">{message.content}</p>
                )}
              </div>
            ) : (
              <p className="italic">{message.content || 'No content'}</p>
            )}
          </div>
          
          <p className="text-sm font-medium text-gray-700 mb-3">
            Select a conversation:
          </p>
          
          {/* Conversations List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No conversations available</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {conversations.map((conv) => {
                const isSelected = selectedChatId === conv.id;
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedChatId(conv.id)}
                    className={`w-full p-3 rounded-lg border-2 transition flex items-center space-x-3 ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {renderConversationAvatar(conv)}
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {getConversationName(conv)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {isSelected && (
                      <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 shrink-0">
          <button
            onClick={handleConfirm}
            disabled={!selectedChatId}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Forward
          </button>
        </div>
      </div>
    </div>
  );
}