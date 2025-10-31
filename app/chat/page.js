// ✅ components/page.js - FINAL MOBILE LAYOUT FIX
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getCurrentUser, 
  isAuthenticated, 
  getConversations, 
  logout, 
  updateLastSeen,
  subscribeToConversations,
  unsubscribeFromConversations
} from '@/lib/pocketbase';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import Notification from '@/components/Notification';

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // 🆕 NEW: isChatOpen state for mobile view
  const isChatOpen = !!selectedConversation; 

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    const user = getCurrentUser();
    setCurrentUser(user);
    loadConversations(user.id);
    
    // Update last seen immediately
    updateLastSeen(user.id);
    const savedThemeHex = localStorage.getItem('chatThemeHex');
    if (savedThemeHex) {
      document.documentElement.style.setProperty('--primary', savedThemeHex);
    }
    const savedChatBg = localStorage.getItem('chatBg');
if (savedChatBg) {
  document.documentElement.style.setProperty('--chat-bg', savedChatBg);
}

    // Update last seen every minute
    const lastSeenInterval = setInterval(() => {
      updateLastSeen(user.id);
    }, 60000);
    
    // Subscribe to conversation updates
    subscribeToConversations(user.id, (action, record) => {
      if (action === 'update' || action === 'create' || action === 'delete') {
        loadConversations(user.id);
      }
    });
    
    return () => {
      clearInterval(lastSeenInterval);
      unsubscribeFromConversations();
    };
  }, [router]);

  const loadConversations = async (userId) => {
    try {
      const convos = await getConversations(userId);
      setConversations(convos);
      
      // Restore last selected conversation from localStorage
      const lastSelectedId = localStorage.getItem('lastSelectedConversation');
      
      // Check if the currently selected conversation still exists in the new list
      const currentSelectionStillExists = selectedConversation 
        ? convos.find(c => c.id === selectedConversation.id)
        : null;

      if (currentSelectionStillExists) {
         // If the current selection is still in the list (e.g., it was just updated), keep it.
         setSelectedConversation(currentSelectionStillExists);
      } else if (lastSelectedId && convos.length > 0) {
        // If the current selection doesn't exist (e.g., it was deleted)
        // or if we are loading for the first time, check localStorage.
        const lastConvo = convos.find(c => c.id === lastSelectedId);
        if (lastConvo) {
          setSelectedConversation(lastConvo);
        } else {
          // If the localStorage ID is stale, clear it and clear the selection
          localStorage.removeItem('lastSelectedConversation');
          setSelectedConversation(null);
        }
      } else if (selectedConversation && convos.length === 0) {
          // If all conversations were deleted
          setSelectedConversation(null);
      }

    } catch (error) {
      console.error('Error loading conversations:', error);
      showNotification('Failed to load conversations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('lastSelectedConversation');
    logout();
    router.push('/');
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    // Save to localStorage
    if (conversation) {
      localStorage.setItem('lastSelectedConversation', conversation.id);
    } else {
      localStorage.removeItem('lastSelectedConversation');
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  // 🆕 NEW: Back button handler for mobile
  const handleGoBackToList = () => {
    setSelectedConversation(null);
    localStorage.removeItem('lastSelectedConversation');
  };


  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-subtle">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 🛑 FIX: Main container jise h-screen flex karna hai */}
      <div className="h-screen flex bg-bg-subtle relative overflow-hidden">

        <div className={`absolute inset-0 pointer-events-none md:hidden ${isChatOpen ? 'hidden' : 'block'}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20" />
    <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
  </div>        
        {/* 1. Sidebar Container (Mobile: Chat Closed = Full Screen) */}
        <div className={`w-full md:w-[350px] flex-shrink-0 border-r border-border-color ${isChatOpen ? 'hidden md:flex' : 'flex'} relative z-10`}>

          <Sidebar
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            currentUser={currentUser}
            onLogout={handleLogout}
            onNewConversation={() => loadConversations(currentUser.id)}
            onNotification={showNotification}
            onUserUpdate={handleUserUpdate}
          />
        </div>

        {/* 2. Chat Area Container (Mobile: Chat Open = Full Screen) */}
        <div className={`
            flex-1 flex flex-col 
            ${isChatOpen ? 'w-full flex' : 'hidden md:flex'}
          `}
        >
          <ChatArea
            conversation={selectedConversation}
            currentUser={currentUser}
            onConversationUpdate={() => loadConversations(currentUser.id)}
            onNotification={showNotification}
            onSelectConversation={handleSelectConversation}
            
            // 🆕 NEW: Back button prop
            onGoBack={handleGoBackToList} 
          />
        </div>
      </div>
      
      {/* Notification */}
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
}