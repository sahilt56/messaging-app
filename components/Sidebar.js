// ✅ components/Sidebar.js - FINAL MOBILE FIX WITH GLASS BLUR

import { useState, useEffect } from 'react';
import ConversationItem from './ConversationItem';
import UserAvatar from './UserAvatar';
import NewChatModal from './NewChatModal';
import SettingsModal from './SettingsModal';
import CreateGroupModal from './CreateGroupModal'; 
import { updateLastSeen } from '@/lib/pocketbase'; 

export default function Sidebar({ 
  conversations, 
  selectedConversation, 
  onSelectConversation, 
  currentUser,
  onLogout,
  onNewConversation,
  onNotification,
  onUserUpdate
}) {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');

  const handleConversationCreated = (conversation) => {
    onNewConversation();
    onSelectConversation(conversation);
  };

  const handleGroupCreated = (group) => {
    onNewConversation();
    onSelectConversation(group);
  };

  const handleNewChatClick = () => {
    setIsNewChatOpen(true);
  };

  const handleCreateGroupClick = () => {
    setIsCreateGroupOpen(true);
  };

  const handleConversationDeleted = (conversationId) => {
    if (selectedConversation?.id === conversationId) {
      onSelectConversation(null);
      localStorage.removeItem('lastSelectedConversation');
    }
    onNewConversation();
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    
    if (conv.isGroup) {
      const groupName = conv.groupName?.toLowerCase() || '';
      const lastMessage = conv.lastMessage?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      return groupName.includes(search) || lastMessage.includes(search);
    }
    
    const otherParticipant = conv.expand?.participants?.find(
      p => p.id !== currentUser?.id
    );
    
    const name = otherParticipant?.name?.toLowerCase() || '';
    const lastMessage = conv.lastMessage?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return name.includes(search) || lastMessage.includes(search);
  });

  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (currentUser) {
        updateLastSeen(currentUser.id);
      }
    }, 20000);

    return () => {
      clearInterval(updateInterval);
    };
  }, [currentUser]);

  return (
    <>
      <div className="w-full h-full flex flex-col bg-white/60 backdrop-blur-3xl shadow-2xl relative z-10 md:bg-background md:backdrop-blur-none md:shadow-none dark:bg-gray-900/60">
        
        {/* Header */}
        <div className="p-4 border-b border-white/20 shrink-0 bg-white/25 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none md:border-border-color dark:bg-gray-800/25 dark:border-gray-700/30">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-foreground">Messages</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 hover:bg-bg-subtle rounded-lg transition"
                title="Settings"
              >
                <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Current User Info */}
          <div className="flex items-center space-x-3 p-3 bg-white/15 rounded-lg backdrop-blur-md dark:bg-gray-800/15">
            <UserAvatar 
              name={currentUser?.name} 
              user={currentUser}
              size="sm" 
              online={true} 
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-text-muted truncate">{currentUser?.email}</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-white/20 bg-white/15 backdrop-blur-xl shrink-0 md:bg-background md:backdrop-blur-none md:border-border-color dark:bg-gray-800/15 dark:border-gray-700/30">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-white/30 bg-white/30 text-foreground rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder:text-gray-500 md:border-border-color md:bg-bg-subtle backdrop-blur-md"
            />
            <svg
              className="w-5 h-5 text-text-muted absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-foreground"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto bg-transparent scrollbar-hide md:bg-background">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              {searchTerm ? (
                <>
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 md:bg-bg-subtle">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                  <p className="text-sm text-text-muted">Try searching with different keywords</p>
                </>
              ) : conversations.length === 0 ? (
                <>
                  <div className="w-20 h-20 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 md:bg-bg-subtle">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No conversations yet</h3>
                  <p className="text-sm text-text-muted">Start a new conversation or create a group</p>
                </>
              ) : null}
            </div>
          ) : (
            <div className="divide-y divide-white/10 md:divide-border-color">
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversation?.id === conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  currentUserId={currentUser?.id}
                  onDelete={handleConversationDeleted}
                  onNotification={onNotification}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-white/20 space-y-2 shrink-0 bg-white/25 backdrop-blur-xl md:bg-background md:backdrop-blur-none md:border-border-color dark:bg-gray-800/25 dark:border-gray-700/30">
          <button 
            onClick={handleNewChatClick}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Chat</span>
          </button>

          <button 
            onClick={handleCreateGroupClick}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        currentUser={currentUser}
        onConversationCreated={handleConversationCreated}
        onNotification={onNotification}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        currentUser={currentUser}
        onGroupCreated={handleGroupCreated}
        onNotification={onNotification}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onUserUpdate={onUserUpdate}
        onLogout={onLogout}
        onNotification={onNotification}
      />
    </>
  );
}