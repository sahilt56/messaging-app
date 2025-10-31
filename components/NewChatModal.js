import { useState, useRef } from 'react';
import { searchUsersByEmail, findConversationBetweenUsers, createConversation } from '@/lib/pocketbase';
import UserAvatar from './UserAvatar';

export default function NewChatModal({ isOpen, onClose, currentUser, onConversationCreated, onNotification }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);
  const debounceTimeoutRef = useRef(null);

  // *** UPDATED executeSearch फ़ंक्शन ***
  const executeSearch = async (query) => {
    // स्पिनर को तुरंत 'true' पर सेट न करें।
    // इसे केवल तभी दिखाएँ जब सर्च 250ms से अधिक समय ले।
    const spinnerTimeout = setTimeout(() => {
      setSearching(true);
    }, 250); // 250ms की देरी

    try {
      const users = await searchUsersByEmail(query);
      // फ़िल्टर आउट करें
      const filteredUsers = users.filter(u => u.id !== currentUser.id);
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Search error:', error);
      if (onNotification) {
        onNotification('Failed to search users', 'error');
      }
    } finally {
      // टाइमआउट को क्लियर करें (ताकि अगर सर्च तेज़ थी तो स्पिनर न दिखे)
      clearTimeout(spinnerTimeout);
      // काम पूरा होने पर हमेशा सर्चिंग को 'false' पर सेट करें
      setSearching(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query); // इनपुट को तुरंत अपडेट करें
    
    // मौजूदा टाइमर को साफ़ करें
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false); // स्पिनर को बंद करना सुनिश्चित करें
      return;
    }

    // एक नया टाइमर सेट करें
    // 300ms के बाद ही API कॉल करें
    debounceTimeoutRef.current = setTimeout(() => {
      executeSearch(query);
    }, 300); // 300ms का इंतज़ार
  };


  const handleSelectUser = async (selectedUser) => {
    if (creating || creatingRef.current) {
      console.log('Already creating conversation, ignoring click');
      return;
    }
    
    setCreating(true);
    creatingRef.current = true;
    
    try {
      console.log('Checking for existing conversation...');
      
      const existingConversation = await findConversationBetweenUsers(
        currentUser.id,
        selectedUser.id
      );

      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation.id);
        
        if (onNotification) {
          onNotification(`You already have a chat with ${selectedUser.name}. Opening existing chat.`, 'warning');
        }
        
        onConversationCreated(existingConversation);
        handleClose();
      } else {
        console.log('Creating new conversation...');
        
        const newConversation = await createConversation([currentUser.id, selectedUser.id]);
        
        if (newConversation) {
          console.log('New conversation created:', newConversation.id);
          
          onConversationCreated(newConversation);
          if (onNotification) {
            onNotification(`Started new chat with ${selectedUser.name}`, 'success');
          }
          handleClose();
        } else {
          console.error('Failed to create conversation');
          if (onNotification) {
            onNotification('Failed to create conversation', 'error');
          }
        }
      }
    } catch (error) {
      console.error('Error in handleSelectUser:', error);
      if (onNotification) {
        onNotification('Failed to create conversation', 'error');
      }
    } finally {
      setCreating(false);
      creatingRef.current = false;
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setCreating(false);
    creatingRef.current = false;
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-color flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-foreground">New Chat</h2>
          <button
            onClick={handleClose}
            disabled={creating}
            className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-border-color shrink-0">
          <div className="relative">
            <input
              type="email"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by email..."
              disabled={creating}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && !creating && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  if (debounceTimeoutRef.current) {
                    clearTimeout(debounceTimeoutRef.current);
                  }
                }}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {searching ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              {searchQuery.length >= 2 ? (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">No users found</p>
                  <p className="text-sm text-text-muted mt-1">Try searching with a different email</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Search for users</p>
                  <p className="text-sm text-text-muted mt-1">Type at least 2 characters to search by email</p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  disabled={creating}
                  className="w-full p-4 hover:bg-bg-subtle transition flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserAvatar 
                    name={user.name} 
                    user={user}
                    size="md" 
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-sm text-text-muted truncate">{user.email}</p>
                  </div>
                  {creating && (
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}