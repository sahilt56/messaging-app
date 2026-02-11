// components/NewChatModal.js
import { useState, useEffect, useMemo } from 'react'; // 👈 'useMemo' ko import karein
import { 
  getAllMyFriends, // 👈 'getAllMyFriends' ka istemaal karein
  findConversationBetweenUsers, 
  createConversation 
} from '@/lib/pocketbase';
import UserAvatar from './UserAvatar';

export default function NewChatModal({ isOpen, onClose, currentUser, onConversationCreated, onNotification }) {
  
  // 1. Naye states
  const [allFriends, setAllFriends] = useState([]);     // Yahaan sabhi dost store honge
  const [searchQuery, setSearchQuery] = useState('');   // Search bar ka text
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // 2. useEffect: Modal khulte hi sabhi doston ko load karein
  useEffect(() => {
    if (isOpen && currentUser) {
      setLoading(true);
      getAllMyFriends(currentUser.id)
        .then(friends => {
          setAllFriends(friends); // Poori list ko state mein save karein
        })
        .catch(err => {
          console.error(err);
          onNotification?.('Failed to load friends list', 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Modal band hone par list aur search ko saaf karein
      setAllFriends([]);
      setSearchQuery('');
      setLoading(true);
    }
  }, [isOpen, currentUser, onNotification]);

  // 3. useMemo: Search query ke aadhaar par list ko filter karein
  // Yeh function har baar render par chalega aur list ko filter karega
  const visibleFriends = useMemo(() => {
    // Agar search bar khaali hai, to poori list dikhayein
    if (searchQuery.length < 1) {
      return allFriends;
    }
    
    // Agar search bar mein kuch hai, to filter karein
    const lowerQuery = searchQuery.toLowerCase();
    return allFriends.filter(friend => 
      friend.name.toLowerCase().includes(lowerQuery) || 
      friend.username.toLowerCase().includes(lowerQuery)
    );
  }, [allFriends, searchQuery]); // Yeh 'allFriends' ya 'searchQuery' badalne par hi update hoga

  
  const handleSelectUser = async (selectedUser) => {
    // ... (Yeh function bilkul waisa hi rahega jaisa pehle tha) ...
    if (creating) return;
    setCreating(true);
    
    try {
      const existingConversation = await findConversationBetweenUsers(currentUser.id, selectedUser.id);

      if (existingConversation) {
        onNotification?.(`You already have a chat with ${selectedUser.name}.`, 'warning');
        onConversationCreated(existingConversation);
        handleClose();
      } else {
        const newConversation = await createConversation([currentUser.id, selectedUser.id]);
        if (newConversation) {
          onConversationCreated(newConversation);
          onNotification?.(`Started new chat with ${selectedUser.name}`, 'success');
          handleClose();
        } else {
          onNotification?.('Failed to create conversation', 'error');
        }
      }
    } catch (error) {
      console.error('Error in handleSelectUser:', error);
      onNotification?.('Failed to create conversation', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setCreating(false);
    setSearchQuery(''); // 👈 Search ko bhi reset karein
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-color flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-foreground">Start New Chat</h2>
          <button
            onClick={handleClose}
            disabled={creating}
            className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 4. Search Input ko waapas jod diya gaya hai */}
        <div className="p-6 border-b border-border-color shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} // 👈 'handleSearch' ki jagah seedhe state update karein
              placeholder="Search your friends..."
              disabled={creating}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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


        {/* 5. Results (Ab 'visibleFriends' par map hoga) */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : allFriends.length === 0 ? ( // 👈 Pehle check karein ki dost hain ya nahin
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <p className="text-gray-600 font-medium">No friends found</p>
              <p className="text-sm text-text-muted mt-1">
                You have no friends yet. Add some friends to start a chat.  
              </p>
            </div>
          ) : visibleFriends.length === 0 ? ( // 👈 Phir check karein ki search result hai ya nahin
             <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <p className="text-gray-600 font-medium">No friends match your search</p>
                <p className="text-sm text-text-muted mt-1">
                  Try a different name or @username.
                </p>
              </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {visibleFriends.map((user) => ( // 👈 'visibleFriends' par map karein
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  disabled={creating}
                  className="w-full p-4 hover:bg-bg-subtle transition flex items-center space-x-3 disabled:opacity-50"
                >
                  <UserAvatar 
                    name={user.name} 
                    user={user}
                    size="md" 
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-sm text-text-muted truncate">@{user.username}</p>
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