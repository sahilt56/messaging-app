// components/FriendRequests.js
import { useState, useEffect } from 'react';
import { getPendingFriendRequests, updateFriendRequest } from '@/lib/pocketbase';
import UserAvatar from './UserAvatar';

export default function FriendRequests({ currentUser, onNotification }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Pending requests ko fetch karein
  useEffect(() => {
    if (currentUser) {
      getPendingFriendRequests(currentUser.id)
        .then(setRequests)
        .finally(() => setLoading(false));
    }
  }, [currentUser]);

  // 2. Request ko handle karein (Accept/Decline)
  const handleRequest = async (requestId, newStatus, userName) => {
    // UI se request ko turant hata dein
    setRequests(prev => prev.filter(req => req.id !== requestId));
    
    // API call karein
    const result = await updateFriendRequest(requestId, newStatus);
    
    if (result.success) {
      onNotification(
        `Request from ${userName} ${newStatus === 'accepted' ? 'accepted' : 'declined'}`,
        'success'
      );
    } else {
      onNotification('Failed to update request', 'error');
      // Agar fail hua, to list ko refresh karein (optional)
      getPendingFriendRequests(currentUser.id).then(setRequests);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-gray-900">Friend Requests</h3>
      {requests.length === 0 ? (
        <p className="text-sm text-gray-500">You have no pending friend requests.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {requests.map(req => (
            <li key={req.id} className="py-4">
              <div className="flex items-center space-x-3">
                <UserAvatar user={req.expand?.from_user} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{req.expand?.from_user?.name}</p>
                  <p className="text-sm text-gray-500 truncate">@{req.expand?.from_user?.username}</p>
                </div>
              </div>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => handleRequest(req.id, 'accepted', req.expand?.from_user?.name)}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRequest(req.id, 'declined', req.expand?.from_user?.name)}
                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300"
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}