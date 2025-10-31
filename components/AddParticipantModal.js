// components/AddParticipantModal.js
import { useState, useRef, useMemo } from 'react';
import { 
  searchUsersByEmail, 
  addParticipantToGroup, 
  sendMessage 
} from '@/lib/pocketbase';
import UserAvatar from './UserAvatar';

export default function AddParticipantModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  conversation, // We need the current conversation
  onNotification,
  onParticipantAdded // Callback to refresh the group info
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false); // Renamed from 'creating'
  const addingRef = useRef(false);
  const debounceTimeoutRef = useRef(null);

  // --- NEW: Get current participant IDs to filter them from search ---
  const currentParticipantIds = useMemo(() => {
    if (!conversation?.participants) return [currentUser.id];
    // Also include the current user in the filter
    return [...conversation.participants, currentUser.id];
  }, [conversation, currentUser.id]);

  // --- UPDATED executeSearch ---
  const executeSearch = async (query) => {
    const spinnerTimeout = setTimeout(() => {
      setSearching(true);
    }, 250);

    try {
      const users = await searchUsersByEmail(query);
      // --- UPDATED Filtering ---
      // Filter out users already in the group
      const filteredUsers = users.filter(u => !currentParticipantIds.includes(u.id));
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Search error:', error);
      onNotification?.('Failed to search users', 'error');
    } finally {
      clearTimeout(spinnerTimeout);
      setSearching(false);
    }
  };

  // --- handleSearch (No changes from NewChatModal.js) ---
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    debounceTimeoutRef.current = setTimeout(() => {
      executeSearch(query);
    }, 300);
  };

  // --- *** MAIN CHANGE: handleAddParticipant *** ---
  const handleAddParticipant = async (selectedUser) => {
    if (adding || addingRef.current) {
      return;
    }
    
    setAdding(true);
    addingRef.current = true;
    
    try {
      console.log(`Adding ${selectedUser.name} to ${conversation.id}...`);
      
      const updatedConversation = await addParticipantToGroup(conversation.id, selectedUser.id);
      
      if (updatedConversation) {
        console.log('Participant added:', selectedUser.id);

        // Send a system message
        await sendMessage({
          conversationId: conversation.id,
          senderId: currentUser.id, // Use current user as sender
          content: `${currentUser.name} added ${selectedUser.name} to the group.`,
          isSystemMessage: true
        });

        onParticipantAdded(updatedConversation); // Notify parent to refresh
        onNotification?.(`Added ${selectedUser.name} to the group`, 'success');
        handleClose();
      } else {
        console.error('Failed to add participant');
        onNotification?.('Failed to add participant', 'error');
      }
    } catch (error) {
      console.error('Error in handleAddParticipant:', error);
      onNotification?.('Failed to add participant', 'error');
    } finally {
      setAdding(false);
      addingRef.current = false;
    }
  };

  // --- handleClose (Updated to reset 'adding' state) ---
  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearching(false);
    setAdding(false);
    addingRef.current = false;
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" // z-60 (higher than GroupInfoModal)
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header - UPDATED */}
        <div className="p-6 border-b border-border-color flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-foreground">Add Participant</h2>
          <button
            onClick={handleClose}
            disabled={adding}
            className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input - UPDATED */}
        <div className="p-6 border-b border-border-color shrink-0">
          <div className="relative">
            <input
              type="email"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by email..."
              disabled={adding}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
              autoFocus
            />
            {/* ... (Search and Clear icons are the same) ... */}
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Results - UPDATED */}
        <div className="flex-1 overflow-y-auto">
          {searching ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              {/* ... (Empty state UI is the same, text is updated) ... */}
              <p className="text-gray-600 font-medium">No users found</p>
              <p className="text-sm text-text-muted mt-1">
                {searchQuery.length >= 2 
                  ? "Try a different email, or all users are already in the group."
                  : "Type at least 2 characters to search by email"
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAddParticipant(user)}
                  disabled={adding}
                  className="w-full p-4 hover:bg-bg-subtle transition flex items-center space-x-3 disabled:opacity-50"
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
                  {adding && (
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