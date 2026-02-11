// ✅ components/ChatArea.js - MOBILE OPTIMIZED

import { useState, useEffect, useRef } from 'react';
import { isGroupAdmin } from "@/lib/pocketbase";
import AddFriendModal from '@/components/AddFriendModal';

import { 
  getMessages, 
  sendMessage, 
  isUserOnline,
  getUserById,
  markConversationMessagesAsRead,
  setTypingStatus,
  subscribeToMessages,
  subscribeToReactions, 
  toggleReaction,
  deleteMessage,
  getGroupIconUrl,
  clearChatHistory,
} from '@/lib/pocketbase';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import UserAvatar from './UserAvatar';
import ForwardModal from './ForwardModal'; 
import ChatHeaderMenu from './ChatHeaderMenu';
import ScheduleMessageModal from './ScheduleMessageModal';
import TimerModal from './TimerModal';
import ChatInfoModal from './ChatInfoModal';
import SearchDateModal from './SearchDateModal';
import ExportChatModal from './ExportChatModal';
import CodeSnippetModal from './CodeSnippetModal';
import GroupInfoModal from './GroupInfoModal';

export default function ChatArea({ 
  conversation, 
  currentUser, 
  onConversationUpdate, 
  onNotification,  
  onSelectConversation, 
  onGoBack
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [forceCloseEmoji, setForceCloseEmoji] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const onlineCheckIntervalRef = useRef(null); 
  const [replyingTo, setReplyingTo] = useState(null); 
  const [isForwarding, setIsForwarding] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showChatInfoModal, setShowChatInfoModal] = useState(false);
  const [showSearchDateModal, setShowSearchDateModal] = useState(false);
  const [showExportChatModal, setShowExportChatModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  
  // Maan lijiye aapke paas currentUser state mein hai
  // const [currentUser, setCurrentUser] = useState(pb.authStore.model);
  const openScheduleModal = () => setShowScheduleModal(true);
  const openTimerModal = () => setShowTimerModal(true);
  const openChatInfoModal = () => setShowChatInfoModal(true);
  const openSearchDateModal = () => setShowSearchDateModal(true);
  const openExportChatModal = () => setShowExportChatModal(true);

  const handleClearChatConfirm = async () => {
    if (!conversation) return;
    setIsClearingChat(true);
    
    try {
      const result = await clearChatHistory(conversation.id);
      if (result.success) {
        setMessages([]);
        onNotification?.('Chat history cleared successfully', 'success');
        onConversationUpdate();
      } else {
        onNotification?.(result.error || 'Failed to clear chat', 'error');
      }
    } catch (error) {
      console.error('Error confirming clear chat:', error);
      onNotification?.('Failed to clear chat', 'error');
    } finally {
      setIsClearingChat(false);
      setShowClearChatConfirm(false);
    }
  };

  const getParticipants = () => {
    if (!conversation?.isGroup) return [];
    if (conversation.expand?.participants) {
      return conversation.expand.participants;
    }
    return [];
  };
 
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  const getOtherParticipant = () => {
    if (conversation?.isGroup) return null;
    if (!conversation?.expand?.participants) return null;
    return conversation.expand.participants.find(p => p.id !== currentUser?.id);
  };

  const getConversationName = () => {
    if (conversation?.isGroup) {
      return conversation.groupName || 'Unnamed Group';
    }
    return otherUser?.name || 'Unknown User';
  };

  const renderHeaderAvatar = () => {
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
        name={otherUser?.name} 
        user={otherUser}
        size="md" 
        online={isOnline} 
      />
    );
  };

  const getStatusText = () => {
    if (conversation?.isGroup) {
      const participants = conversation.participants || conversation.expand?.participants || [];
      const participantCount = Array.isArray(participants) ? participants.length : 0;
      return `${participantCount} member${participantCount !== 1 ? 's' : ''}`;
    }
    
    if (isTyping) return 'typing...';
    if (isOnline) return 'Online';
    if (otherUser?.lastSeen) return `Last seen ${formatTime(otherUser.lastSeen)}`;
    return 'Offline';
  };

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
    if (diffHours < 24) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    
    return date.toLocaleDateString('en-US');
  };
  
  const handleChatAreaClick = () => {
    if (forceCloseEmoji === false) { 
      setForceCloseEmoji(true);
      setTimeout(() => setForceCloseEmoji(false), 50);
    }
  };

  const handleDateSelect = (selectedDate) => {
    const messagesOnDate = messages.filter(msg => {
      const messageDate = new Date(msg.created).toISOString().split('T')[0];
      return messageDate === selectedDate;
    });

    if (messagesOnDate.length === 0) {
      onNotification?.(`No messages found on ${selectedDate}`, 'info');
      return;
    }

    const firstMessageId = messagesOnDate[0].id;
    
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${firstMessageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        messageElement.classList.add('bg-yellow-100');
        setTimeout(() => {
          messageElement.classList.remove('bg-yellow-100');
        }, 2000);
        
        onNotification?.(`Found ${messagesOnDate.length} message(s) on ${selectedDate}`, 'success');
      }
    }, 100);
  };
  
  const handleReactionUpdate = async (action, updatedMessageRecord) => {
    setMessages(prevMessages => {
      const updated = prevMessages.map(msg => {
        if (msg.id === updatedMessageRecord.id) {
          return {
            ...msg,
            expand: {
              ...msg.expand,
              reactions: updatedMessageRecord.expand?.reactions || []
            }
          };
        }
        return msg;
      });
      return updated;
    });
  };

  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      setOtherUser(null);
      setReplyingTo(null);
      return;
    }

    let unsubscribeMessages; 
    let unsubscribeReactions; 

    const loadAndSubscribe = async () => {
      setLoading(true);
      try {
        const msgs = await getMessages(conversation.id);
        setMessages(msgs);
        
        await markConversationMessagesAsRead(conversation.id, currentUser.id);

        if (!conversation.isGroup) {
          const other = getOtherParticipant();
          if (other) {
            const freshUser = await getUserById(other.id);
            setOtherUser(freshUser);
          }
        } else {
          setOtherUser(null);
        }

        unsubscribeMessages = await subscribeToMessages(conversation.id, (action, record) => {
          if (action === 'create') {
            setMessages((prevMessages) => {
              if (prevMessages.find(m => m.id === record.id)) return prevMessages;
              return [...prevMessages, record];
            });
            
            if (record.sender !== currentUser.id) {
              markConversationMessagesAsRead(conversation.id, currentUser.id);
            }
          } else if (action === 'delete') {
            setMessages((prevMessages) => {
              return prevMessages.filter(m => m.id !== record.id);
            });
            onNotification?.('A message was deleted from the conversation.', 'info');
          }
        });
        
        unsubscribeReactions = await subscribeToReactions(conversation.id, handleReactionUpdate);

      } catch (error) {
        console.error('Error loading initial data:', error);
        onNotification?.('Failed to load messages', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadAndSubscribe();
    
    return () => {
      if (unsubscribeMessages) unsubscribeMessages(); 
      if (unsubscribeReactions) unsubscribeReactions(); 
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversation?.id, currentUser]); 

  useEffect(() => {
    if (conversation?.isGroup || !otherUser) {
      if (onlineCheckIntervalRef.current) {
        clearInterval(onlineCheckIntervalRef.current);
      }
      return;
    }

    const checkOnlineStatus = async () => {
      const userIdToCheck = otherUser.id; 
      const freshUser = await getUserById(userIdToCheck);
      
      if (freshUser) {
        setOtherUser(freshUser);
        setIsOnline(isUserOnline(freshUser.lastSeen));
      } else {
        if (onlineCheckIntervalRef.current) {
          clearInterval(onlineCheckIntervalRef.current);
        }
        setIsOnline(false); 
      }
    };
    
    checkOnlineStatus();
    if (onlineCheckIntervalRef.current) clearInterval(onlineCheckIntervalRef.current);
    onlineCheckIntervalRef.current = setInterval(checkOnlineStatus, 30000);
    
    return () => {
      if (onlineCheckIntervalRef.current) clearInterval(onlineCheckIntervalRef.current);
    };
  }, [otherUser?.id, conversation?.isGroup]);

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [messages.length, loading]); 
  
  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const handleForward = (message) => {
    setMessageToForward(message);
    setIsForwarding(true);
  };

  const handleDeleteForMe = (messageId) => {
    setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
    onNotification?.('Message deleted for you.', 'info');
  };

  const handleDeleteForEveryone = async (messageId) => {
    try {
      const success = await deleteMessage(messageId); 
      
      if (success) {
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
        onNotification?.('Message deleted for everyone!', 'success');
        onConversationUpdate();
      } else {
        onNotification?.('Failed to delete message.', 'error');
      }
    } catch (error) {
      console.error('Error deleting message for everyone:', error);
      onNotification?.('Failed to delete message.', 'error');
    }
  };

  const handleEmojiSelect = async (emoji, messageId) => {
    try {
      const result = await toggleReaction(messageId, currentUser.id, emoji);
      
      if (!result) {
        onNotification?.('Failed to send reaction', 'error');
      }
    } catch (error) {
      console.error('Reaction error:', error);
      onNotification?.('Failed to send reaction', 'error');
    }
  };

  const handleForwardConfirmed = async (targetConversationId) => { 
    if (!messageToForward || !targetConversationId) return;

    try {
      await sendMessage({
        conversationId: targetConversationId,
        senderId: currentUser.id,
        content: messageToForward.content,
        isForwarded: true,
        isCodeSnippet: messageToForward.isCodeSnippet,
        codeLanguage: messageToForward.codeLanguage,
        attachmentToCopy: messageToForward.attachment || null,
        originalMessageId: messageToForward.id 
      });

      onNotification?.('Message forwarded successfully!', 'success');
      
      if (targetConversationId === conversation.id) {
        onConversationUpdate();
      }
      
      setIsForwarding(false);
      setMessageToForward(null);

    } catch (error) {
      console.error('Error forwarding message:', error);
      onNotification?.('Failed to forward message', 'error');
    }
  };
  
  const handleSendMessage = async (content, file) => {
    if ((!content.trim() && !file) || !conversation || !currentUser) return;

    try {
      const newMessage = await sendMessage({
        conversationId: conversation.id, 
        senderId: currentUser.id, 
        content: content, 
        file: file,
        replyToId: replyingTo ? replyingTo.id : null
      });
      
      if (newMessage) {
        setReplyingTo(null);
        onConversationUpdate(); 
      } else {
        onNotification?.('Failed to send message', 'error');
      }
    } catch (error) {
      onNotification?.('Failed to send message', 'error');
    }
  };

  const handleSendCodeSnippet = async (code, language) => {
    if (!code.trim() || !conversation || !currentUser) return;

    try {
      const newMessage = await sendMessage({
        conversationId: conversation.id,
        senderId: currentUser.id,
        content: code,
        replyToId: replyingTo ? replyingTo.id : null,
        isCodeSnippet: true,
        codeLanguage: language,
        File: null,
      });

      if (newMessage) {
        setReplyingTo(null);
        onConversationUpdate();
      } else {
        onNotification?.('Failed to send code snippet', 'error');
      }
    } catch (error) {
      console.error('Error sending code snippet:', error);
      onNotification?.('Failed to send code snippet', 'error');
    }
  };

  const handleTyping = (typing) => {
    if (conversation && currentUser) {
      setTypingStatus(conversation.id, currentUser.id, typing);
    }
  };
  const showNotification = (message, type) => {
    // alert(message); // Simple alert
    // toast.success(message); // react-toastify ka udaharan
    console.log(type, message); 
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-subtle p-4">
        <div className="text-center">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
            <svg className="w-8 h-8 md:w-12 md:h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Select a conversation</h2>
          <p className="text-sm md:text-base text-gray-600">Choose a conversation from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  const isReadOnly =
    conversation?.isGroup &&
    conversation?.adminOnlyChat &&
    conversation?.groupAdmin !== currentUser?.id;

  return (
    <>
      <div className="h-dvh flex flex-col bg-chat transition-colors duration-300 overflow-hidden" onClick={handleChatAreaClick}>
        
        {/* MOBILE OPTIMIZED: Chat Header */}
        <div className="px-3 md:px-6 py-3 md:py-4 border-b border-border-color bg-background shadow-sm sticky top-0 z-10">
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Back Button for Mobile */}
            <button
              onClick={onGoBack}
              className="p-1.5 md:hidden hover:bg-gray-100 rounded-full transition flex-shrink-0"
              title="Back to Chats"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            {renderHeaderAvatar()}
            
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-1 md:gap-2 min-w-0">
                <span className="truncate">{getConversationName()}</span>
                {conversation?.isGroup && (
                  <button
                    onClick={() => setShowGroupInfoModal(true)}
                    className="px-1.5 md:px-2 py-0.5 bg-primary/10 text-primary text-[10px] md:text-xs rounded-full hover:bg-primary/20 transition-colors duration-200 font-semibold flex items-center gap-0.5 md:gap-1 flex-shrink-0"
                    title="View group info"
                  >
                    <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">Group</span>
                  </button>
                )}
              </h2>
              <p className="text-xs md:text-sm text-text-muted truncate">
                {getStatusText()}
              </p>
            </div>
            
            <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
              <button className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition" title="Search">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <ChatHeaderMenu 
                conversationId={conversation.id} 
                currentUser={currentUser} 
                onScheduleMessage={openScheduleModal}
                onSetTimer={openTimerModal}
                onChatInfo={openChatInfoModal}
                onSearchDate={openSearchDateModal}
                onExportChat={openExportChatModal}
                onClearChat={() => setShowClearChatConfirm(true)}
              />
            </div>
          </div>
        </div>

        {/* Messages Area - MOBILE OPTIMIZED */}
<div 
  className="flex-1 overflow-y-auto p-3 md:p-6 bg-chat transition-colors duration-300 pb-2 md:pb-6 overflow-x-hidden scrollbar-hide"
  style={{
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch'
  }}
>          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3 md:mb-4"></div>
                <p className="text-sm md:text-base text-gray-600">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-4">
                <p className="text-sm md:text-base text-text-muted">No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  id={`message-${message.id}`}
                  message={message}
                  isOwn={message.sender === currentUser?.id}
                  senderName={message.expand?.sender?.name}
                  currentUserId={currentUser?.id} 
                  onReply={() => handleReply(message)}
                  onForward={() => handleForward(message)}
                  onEmojiSelect={(emoji) => handleEmojiSelect(emoji, message.id)}
                  onDeleteForMe={handleDeleteForMe}
                  onDeleteForEveryone={handleDeleteForEveryone}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <MessageInput 
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          replyingTo={replyingTo} 
          onCancelReply={() => setReplyingTo(null)} 
          forceCloseEmoji={forceCloseEmoji}
          onOpenCodeModal={() => setShowCodeModal(true)}
          isReadOnly={isReadOnly}   
          currentUser={currentUser}
          participants={getParticipants()} 
        />
      </div>

      {/* Modals */}
      <ScheduleMessageModal 
        isOpen={showScheduleModal} 
        onClose={() => setShowScheduleModal(false)} 
        conversationId={conversation?.id}
        currentUser={currentUser}
        onNotification={onNotification}
      />
      <TimerModal isOpen={showTimerModal} onClose={() => setShowTimerModal(false)} conversationId={conversation?.id} />
      <ChatInfoModal isOpen={showChatInfoModal} onClose={() => setShowChatInfoModal(false)} conversation={conversation} />
      <SearchDateModal 
        isOpen={showSearchDateModal} 
        onClose={() => setShowSearchDateModal(false)} 
        conversationId={conversation?.id}
        onDateSelect={handleDateSelect}
      />
      <ExportChatModal isOpen={showExportChatModal} onClose={() => setShowExportChatModal(false)} conversationId={conversation?.id} />
      <CodeSnippetModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSend={handleSendCodeSnippet}
      />
      <ForwardModal
        isOpen={isForwarding}
        onClose={() => setIsForwarding(false)}
        currentUser={currentUser}
        onForward={handleForwardConfirmed}
        message={messageToForward}
        onNotification={onNotification}
      />
      {/* Modal ko yahaan render karein */}
      <AddFriendModal 
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
        currentUser={currentUser}
        onNotification={showNotification}
      />
      <GroupInfoModal
        isOpen={showGroupInfoModal}
        onClose={() => setShowGroupInfoModal(false)}
        conversation={conversation}
        currentUser={currentUser}
        onNotification={onNotification}
        onGroupUpdated={() => {
          onConversationUpdate();
        }}
        onGroupDeleted={() => {
          setShowGroupInfoModal(false);
          onConversationUpdate();
          onSelectConversation?.(null);  
        }}
        onGroupLeft={() => {
          setShowGroupInfoModal(false);
          onConversationUpdate();
          onSelectConversation?.(null); 
        }}
      />

      {/* Clear Chat Confirmation - MOBILE OPTIMIZED */}
      {showClearChatConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-background rounded-xl p-4 md:p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base md:text-lg font-bold text-foreground mb-2">Clear Chat?</h3>
            <p className="text-xs md:text-sm text-text-muted mb-4">
              Are you sure you want to permanently delete all messages in this chat? This action cannot be undone.
            </p>
            <div className="flex space-x-2 md:space-x-3">
              <button
                onClick={handleClearChatConfirm}
                disabled={isClearingChat}
                className="flex-1 bg-red-600 text-white py-2 text-sm md:text-base rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {isClearingChat ? 'Clearing...' : 'Clear Chat'}
              </button>
              <button
                onClick={() => setShowClearChatConfirm(false)}
                disabled={isClearingChat}
                className="flex-1 bg-bg-subtle text-foreground py-2 text-sm md:text-base rounded-lg font-semibold hover:bg-border-color transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}