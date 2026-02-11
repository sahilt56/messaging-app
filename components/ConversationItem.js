// components/ConversationItem.js - MOBILE OPTIMIZED

import { useState, useEffect, useMemo } from 'react';
import UserAvatar from './UserAvatar';
import { 
  isUserOnline, 
  getUnreadCount, 
  deleteConversation, 
  getGroupIconUrl,
  leaveGroup,
  deleteGroup,
  isGroupAdmin
} from '@/lib/pocketbase';

export default function ConversationItem({ 
  conversation, 
  isSelected, 
  onClick, 
  currentUserId,
  onDelete,
  onNotification
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = useMemo(() => {
    if (!conversation?.isGroup) return false;
    return isGroupAdmin(conversation, currentUserId);
  }, [conversation, currentUserId]);

  const conversationName = useMemo(() => {
    if (conversation?.isGroup) {
      return conversation.groupName || 'Unnamed Group';
    }
    
    const otherParticipant = conversation?.expand?.participants?.find(
      p => p.id !== currentUserId
    );
    return otherParticipant?.name || 'Unknown User';
  }, [conversation, currentUserId]);

  const otherParticipant = useMemo(() => {
    if (conversation?.isGroup) return null;
    
    if (!conversation?.expand?.participants) {
      return null;
    }
    
    const participants = conversation.expand.participants;
    return participants.find(p => p.id !== currentUserId);
  }, [conversation?.expand?.participants, currentUserId, conversation?.isGroup]);

  const isOnline = useMemo(() => {
    if (conversation?.isGroup) return false;
    if (!otherParticipant?.lastSeen) return false;
    return isUserOnline(otherParticipant.lastSeen);
  }, [otherParticipant, conversation?.isGroup]);

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (conversation?.id && currentUserId) {
        const count = await getUnreadCount(conversation.id, currentUserId);
        setUnreadCount(count);
      }
    };
    
    if (isSelected) {
      setUnreadCount(0);
    } else {
      loadUnreadCount();
    }
    
  }, [conversation?.id, currentUserId, conversation?.lastMessageTime, isSelected]);

  useEffect(() => {
    if (conversation?.isGroup || !otherParticipant?.lastSeen) return;
    
    const interval = setInterval(() => {
      window.dispatchEvent(new Event('onlineStatusCheck'));
    }, 30000);
    
    return () => clearInterval(interval);
  }, [otherParticipant, conversation?.isGroup]);

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
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleDeleteChat = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    
    try {
      const success = await deleteConversation(conversation.id);
      if (success) {
        onNotification?.('Chat deleted successfully', 'success');
        onDelete?.(conversation.id);
      } else {
        onNotification?.('Failed to delete chat', 'error');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      onNotification?.('Failed to delete chat', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleLeaveGroup = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    
    try {
      const result = await leaveGroup(conversation.id, currentUserId);
      if (result.success) {
        onNotification?.('You left the group successfully', 'success');
        onDelete?.(conversation.id);
      } else {
        onNotification?.(result.error || 'Failed to leave group', 'error');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      onNotification?.('Failed to leave group', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteGroup = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    
    try {
      const result = await deleteGroup(conversation.id, currentUserId);
      if (result.success) {
        onNotification?.('Group deleted successfully', 'success');
        onDelete?.(conversation.id);
      } else {
        onNotification?.(result.error || 'Failed to delete group', 'error');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      onNotification?.('Failed to delete group', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const renderAvatar = () => {
    if (conversation?.isGroup) {
      const groupIconUrl = getGroupIconUrl(conversation);
      if (groupIconUrl) {
        return (
          <img 
            src={groupIconUrl} 
            alt="Group" 
            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0"
          />
        );
      }
      return (
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      );
    }
    
    return (
      <UserAvatar 
        name={otherParticipant?.name || conversationName} 
        user={otherParticipant}
        size="md" 
        online={isOnline} 
      />
    );
  };

  const getParticipantCount = () => {
    if (!conversation?.isGroup) return null;
    const participants = conversation.participants || conversation.expand?.participants || [];
    const count = Array.isArray(participants) ? participants.length : 0;
    return count;
  };

  return (
    <div
      onClick={onClick}
      className={`p-3 md:p-4 cursor-pointer transition hover:bg-bg-subtle relative group ${
        isSelected ? 'bg-bg-subtle border-l-4 border-indigo-600' : ''
      }z-0`}
    >
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Avatar */}
        {renderAvatar()}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5 md:mb-1">
            <div className="flex items-center space-x-1 md:space-x-2 flex-1 min-w-0">
              <h3 className={`text-sm md:text-base font-semibold truncate ${
                !isSelected && unreadCount > 0 ? 'text-foreground' : 'text-text-muted'
              }`}>
                {conversationName}
              </h3>
            </div>
            <span className="text-[10px] md:text-xs text-text-muted ml-1 md:ml-2 shrink-0">
              {formatTime(conversation?.lastMessageTime)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <p className={`text-xs md:text-sm truncate ${
              !isSelected && unreadCount > 0 ? 'text-foreground font-medium' : 'text-text-muted'
            }`}>
              {conversation?.lastMessage?.trim() || 'No messages yet'}
            </p>
            
            {/* Unread indicator */}
            {!isSelected && unreadCount > 0 && (
              <span className="ml-1 md:ml-2 shrink-0 bg-indigo-600 text-white text-[10px] md:text-xs font-bold rounded-full min-w-4 md:min-w-5 h-4 md:h-5 flex items-center justify-center px-1 md:px-1.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Delete Button - MOBILE OPTIMIZED */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(true);
          }}
          className="md:opacity-0 group-hover:md:opacity-100 md:p-2 p-1.5 hover:bg-red-100 rounded-lg transition-all duration-200 shrink-0"
          title={conversation?.isGroup ? (isAdmin ? "Delete group" : "Leave group") : "Delete chat"}
        >
          <svg className="w-4 h-4 md:w-5 md:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Delete Confirmation Popup - MOBILE OPTIMIZED */}
      {showDeleteConfirm && (
        <div 
          className="absolute inset-0 bg-background border-2 border-red-500 rounded-lg flex flex-col items-center justify-between p-2 md:p-3 z-40 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {conversation?.isGroup ? (
            <>
              <p className="text-xs md:text-sm font-semibold text-foreground mb-2 md:mb-3 text-center">
                {isAdmin ? 'Delete this group?' : 'Leave this group?'}
              </p>
              <p className="text-[10px] md:text-xs text-text-muted mb-2 md:mb-3 text-center px-1 md:px-2">
                {isAdmin 
                  ? 'This will permanently delete the group for all members.' 
                  : 'You will no longer receive messages from this group.'}
              </p>
              <div className="flex space-x-1.5 md:space-x-2 w-full">
                <button
                  onClick={isAdmin ? handleDeleteGroup : handleLeaveGroup}
                  disabled={deleting}
                  className={`flex-1 ${isAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'} text-white text-xs md:text-sm py-1.5 md:py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {deleting ? (isAdmin ? 'Deleting...' : 'Leaving...') : (isAdmin ? 'Delete' : 'Leave')}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                  }}
                  disabled={deleting}
                  className="flex-1 bg-gray-200 text-foreground text-xs md:text-sm py-1.5 md:py-2 rounded-lg font-semibold hover:bg-border-color transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs md:text-sm font-semibold text-foreground mb-2 md:mb-3 text-center">
                Delete this chat?
              </p>
              <div className="flex space-x-1.5 md:space-x-2 w-full">
                <button
                  onClick={handleDeleteChat}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white text-xs md:text-sm py-1.5 md:py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                  }}
                  disabled={deleting}
                  className="flex-1 bg-gray-200 text-foreground text-xs md:text-sm py-1.5 md:py-2 rounded-lg font-semibold hover:bg-border-color transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}