// components/CreateGroupModal.js

import { useState, useRef } from 'react';
// 👈 1. 'searchUsersByEmail' ya 'searchUsers' ki jagah naya function import karein
import { createGroupChat, searchUsersByUsername } from '@/lib/pocketbase';
import UserAvatar from './UserAvatar';

export default function CreateGroupModal({ isOpen, onClose, currentUser, onGroupCreated, onNotification }) {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [groupIcon, setGroupIcon] = useState(null);
  const [groupIconPreview, setGroupIconPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // 👈 2. Naye function ko call karein
      const users = await searchUsersByUsername(query);
      const filteredUsers = users.filter(
        user => user.id !== currentUser.id && !selectedUsers.find(u => u.id === user.id)
      );
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleIconChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      onNotification?.('File too large (max 2MB)', 'error');
      return;
    }

    setGroupIcon(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setGroupIconPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      onNotification?.('Please enter a group name', 'error');
      return;
    }

    if (selectedUsers.length < 1) {
      onNotification?.('Please add at least 1 participant', 'error');
      return;
    }

    setCreating(true);
    try {
      const participantIds = [currentUser.id, ...selectedUsers.map(u => u.id)];
      
      const newGroup = await createGroupChat(
        groupName.trim(),
        participantIds,
        currentUser.id,
        groupIcon
      );

      if (newGroup) {
        onNotification?.('Group created successfully!', 'success');
        onGroupCreated?.(newGroup);
        handleClose();
      } else {
        onNotification?.('Failed to create group', 'error');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      onNotification?.('Failed to create group', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedUsers([]);
    setSearchQuery('');
    setSearchResults([]);
    setGroupIcon(null);
    setGroupIconPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-color flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Create Group Chat</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-bg-subtle rounded-lg transition"
          >
            <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ... (Group Icon aur Group Name ka code waisa hi rahega) ... */}
          
          {/* Group Icon */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Group Icon (Optional)</h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                {groupIconPreview ? (
                  <img
                    src={groupIconPreview}
                    alt="Group icon"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleIconChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                >
                  Choose Icon
                </button>
                <p className="text-sm text-text-muted mt-2">JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </div>
          </div>

          {/* Group Name */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Group Name</h3>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full px-4 py-3 border border-border-color bg-bg-subtle text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              maxLength={50}
            />
          </div>

          {/* ... (Selected Users ka code waisa hi rahega) ... */}
          {selectedUsers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Selected Participants ({selectedUsers.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-2 bg-primary/10 text-primary px-3 py-2 rounded-full"
                  >
                    <UserAvatar name={user.name} user={user} size="sm" />
                    <span className="text-sm font-medium">{user.name}</span>
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="hover:bg-primary/20 rounded-full p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Search Users */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Add Participants</h3>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                // 👈 3. Placeholder text badlein
                placeholder="Search users by @username..."
                className="w-full px-4 py-3 pl-10 border border-border-color bg-bg-subtle text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <svg
                className="w-5 h-5 text-text-muted absolute left-3 top-1/2 transform -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Search Results */}
            {searching && (
              <div className="mt-4 text-center text-text-muted">Searching...</div>
            )}
            
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="flex items-center space-x-3 p-3 hover:bg-bg-subtle rounded-lg cursor-pointer transition"
                  >
                    <UserAvatar name={user.name} user={user} size="md" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{user.name}</p>
                      {/* 👈 4. Email ki jagah @username dikhayein */}
                      <p className="text-sm text-text-muted">@{user.username}</p>
                    </div>
                    <button className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="mt-4 text-center text-text-muted">No users found</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-color flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-6 py-2 border border-border-color text-foreground rounded-lg hover:bg-bg-subtle transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={creating || !groupName.trim() || selectedUsers.length < 1}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}