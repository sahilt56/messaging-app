// components/AddFriendModal.js
import { useState, useRef, useEffect } from 'react';
// 👈 1. 'searchUsers' ko 'searchUsersByUsername' se badlein
import { 
  searchUsersByUsername, 
  checkFriendRequestStatus, 
  sendFriendRequest 
} from '@/lib/pocketbase';
import UserAvatar from './UserAvatar';

// 1. Naya component: SearchResultRow
function SearchResultRow({ user, currentUser, onNotification }) {
  const [status, setStatus] = useState('loading'); // loading, not_friends, pending_from_me, pending_from_them, friends
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFriendRequestStatus(currentUser.id, user.id).then(setStatus);
  }, [currentUser.id, user.id]);

  const handleSendRequest = async () => {
    setLoading(true);
    const result = await sendFriendRequest(currentUser.id, user.id);
    if (result.success) {
      setStatus('pending_from_me');
      onNotification(`Friend request sent to @${user.username}`, 'success');
    } else {
      onNotification(result.error || 'Failed to send request', 'error');
    }
    setLoading(false);
  };

  const renderButton = () => {
    if (loading || status === 'loading') {
      return (
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      );
    }

    switch (status) {
      case 'friends':
        return <span className="text-sm font-medium text-green-600">Friends</span>;
      case 'pending_from_me':
        return <span className="text-sm font-medium text-gray-500">Request Sent</span>;
      case 'pending_from_them':
        return (
          <button 
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg"
            // TODO: Yahaan 'Accept' request ka logic jodna hai
          >
            Accept
          </button>
        );
      default: // 'not_friends'
        return (
          <button 
            onClick={handleSendRequest}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          >
            Add
          </button>
        );
    }
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50">
      <div className="flex items-center space-x-3 min-w-0">
        <UserAvatar user={user} size="md" />
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{user.name}</p>
          {/* 👈 2. Email ki jagah @username dikhayein */}
          <p className="text-sm text-gray-500 truncate">@{user.username}</p>
        </div>
      </div>
      <div className="shrink-0">
        {renderButton()}
      </div>
    </div>
  );
}


// 2. Mukhya Modal Component
export default function AddFriendModal({ isOpen, onClose, currentUser, onNotification }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceTimeoutRef = useRef(null);

  const executeSearch = async (query) => {
    const spinnerTimeout = setTimeout(() => setSearching(true), 250);
    
    try {
      // 👈 3. 'searchUsers' ko 'searchUsersByUsername' se badlein
      const users = await searchUsersByUsername(query);
      const filteredUsers = users.filter(u => u.id !== currentUser.id);
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Search error:', error);
      onNotification('Failed to search users', 'error');
    } finally {
      clearTimeout(spinnerTimeout);
      setSearching(false);
    }
  };

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

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearching(false);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add Friends</h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              // 👈 4. Placeholder text badlein
              placeholder="Search by @username..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
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
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {searching ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12 px-6">
              <p className="text-gray-600 font-medium">
                {searchQuery.length >= 2 ? 'No users found' : 'Search for friends'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery.length >= 2 ? 'Try a different username' : 'Type at least 2 characters to search'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {searchResults.map((user) => (
                <SearchResultRow 
                  key={user.id} 
                  user={user} 
                  currentUser={currentUser} 
                  onNotification={onNotification} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}