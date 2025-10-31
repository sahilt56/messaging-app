// components/GroupInfoModal.js - FULLY FIXED VERSION

import { useState, useEffect } from 'react';
import { 
  getUserById, 
  getGroupIconUrl, 
  isGroupAdmin,
  leaveGroup,
  deleteGroup,
  removeParticipantFromGroup,
  updateGroupInfo,
  transferAdminRights,
  sendMessage
} from '@/lib/pocketbase';
import UserAvatar from './UserAvatar';
import AddParticipantModal from './AddParticipantModal';
export default function GroupInfoModal({ 
  isOpen, 
  onClose, 
  conversation, 
  currentUser,
  onNotification,
  onGroupDeleted,
  onGroupLeft,
  onGroupUpdated 
}) {
  const [participants, setParticipants] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupIconFile, setNewGroupIconFile] = useState(null);
  const [newGroupIconPreview, setNewGroupIconPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const [participantToMakeAdmin, setParticipantToMakeAdmin] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [newAdminOnlyChat, setNewAdminOnlyChat] = useState(false);
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);

  const isAdmin = isGroupAdmin(conversation, currentUser?.id);

  useEffect(() => {
    if (isOpen && conversation?.isGroup) {
      loadGroupDetails();
      resetEditForm();
    }
  }, [isOpen, conversation?.id]);

  const loadGroupDetails = async () => {
    setLoading(true);
    try {
      const participantIds = conversation.participants || [];
      const participantPromises = participantIds.map(id => getUserById(id));
      const users = await Promise.all(participantPromises);
      setParticipants(users.filter(u => u !== null));

      if (conversation.groupAdmin) {
        const admin = await getUserById(conversation.groupAdmin);
        setAdminUser(admin);
      }
    } catch (error) {
      console.error('Error loading group details:', error);
      onNotification?.('Failed to load group details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetEditForm = () => {
    setIsEditing(false);
    setIsSaving(false);
    setNewGroupName(conversation?.groupName || '');
    setNewGroupDescription(conversation?.groupDescription || '');
    setNewGroupIconFile(null);
    setNewGroupIconPreview(null);
    setNewAdminOnlyChat(conversation?.adminOnlyChat || false);
  };

  const handleIconChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewGroupIconFile(file);
      setNewGroupIconPreview(URL.createObjectURL(file));
    }
  };

  // ✅ FIX: Properly handle system message with senderId
  const handleSaveChanges = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    
    try {
      const dataToUpdate = {
        groupName: newGroupName,
        groupDescription: newGroupDescription,
        groupIconFile: newGroupIconFile,
        adminOnlyChat: newAdminOnlyChat 
      };
      
      const updatedConversation = await updateGroupInfo(conversation.id, dataToUpdate);
      
      if (updatedConversation) {
        onNotification?.('Group information updated successfully', 'success'); 

        // ✅ FIX: Pass currentUser.id as senderId for system message
        await sendMessage({
          conversationId: conversation.id,
          senderId: currentUser.id, // ✅ CRITICAL FIX
          content: `${currentUser.name} updated group information.`, 
          isSystemMessage: true
        });
        
        onGroupUpdated?.(updatedConversation);
        resetEditForm();
      } else {
        onNotification?.('Failed to update group', 'error');
      }
    } catch (error) {
      console.error('Error saving group info:', error);
      onNotification?.('Failed to update group', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMakeAdmin = async () => {
    if (!isAdmin || !participantToMakeAdmin) return;

    setIsTransferring(true);
    try {
      const updatedConversation = await transferAdminRights(conversation.id, participantToMakeAdmin.id);

      if (updatedConversation) {
        onNotification?.(`Admin rights transferred to ${participantToMakeAdmin.name}`, 'success');
        onGroupUpdated?.(updatedConversation);
        setShowAdminConfirm(false);
        setParticipantToMakeAdmin(null);
        setAdminUser(participantToMakeAdmin); 
        
        // ✅ FIX: Pass currentUser.id as senderId
        await sendMessage({
          conversationId: conversation.id,
          senderId: currentUser.id, // ✅ CRITICAL FIX
          content: `${currentUser.name} made ${participantToMakeAdmin.name} the new admin.`,
          isSystemMessage: true
        });
        onGroupUpdated?.(updatedConversation);
      } else {
        onNotification?.('Failed to transfer admin rights', 'error');
      }
    } catch (error) {
      console.error('Error transferring admin rights:', error);
      onNotification?.('Failed to transfer admin rights', 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleLeaveGroup = async () => {
  setProcessing(true);
  try {
    // ✅ 1️⃣ पहले system message भेजें (जब user अभी भी member है)
    await sendMessage({
      conversationId: conversation.id,
      senderId: currentUser.id,
      content: `${currentUser.name} left the group.`,
      isSystemMessage: true
    });
    
    // ✅ 2️⃣ फिर group छोड़ें
    const result = await leaveGroup(conversation.id, currentUser.id);
    
    if (result.success) {
      onNotification?.('You left the group successfully', 'success');
      
      // ✅ Modal बंद करें और parent component को notify करें
      onClose();
      onGroupLeft?.(); // यह ChatArea को बताएगा कि conversation list reload करें
    } else {
      onNotification?.(result.error || 'Failed to leave group', 'error');
    }
  } catch (error) {
    console.error('Error leaving group:', error);
    onNotification?.('Failed to leave group', 'error');
  } finally {
    setProcessing(false);
    setShowLeaveConfirm(false);
  }
};

  const handleDeleteGroup = async () => {
    setProcessing(true);
    try {
      const result = await deleteGroup(conversation.id, currentUser.id);
      if (result.success) {
        onNotification?.('Group deleted successfully', 'success');
        onGroupDeleted?.();
        onClose();
      } else {
        onNotification?.(result.error || 'Failed to delete group', 'error');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      onNotification?.('Failed to delete group', 'error');
    } finally {
      setProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!isAdmin) {
      onNotification?.('Only admin can remove participants', 'error');
      return;
    }
    
    try {
      const result = await removeParticipantFromGroup(conversation.id, participantId);
      if (result) {
        onNotification?.('Participant removed successfully', 'success');
        loadGroupDetails();
        onGroupUpdated?.(result);
        
        const removedUser = participants.find(p => p.id === participantId);
        if (removedUser) {
          // ✅ FIX: Pass currentUser.id as senderId
          await sendMessage({
            conversationId: conversation.id,
            senderId: currentUser.id, // ✅ CRITICAL FIX
            content: `${currentUser.name} removed ${removedUser.name}.`,
            isSystemMessage: true
          });
        }
      } else {
        onNotification?.('Failed to remove participant', 'error');
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      onNotification?.('Failed to remove participant', 'error');
    }
  };

  const handleParticipantAdded = (updatedConversation) => {
    loadGroupDetails(); // सदस्य सूची को रीलोड करें
    onGroupUpdated?.(updatedConversation); // ChatArea को सूचित करें
  };

  // ✅ Backdrop click handler
  const handleBackdropClick = (e) => {
    // अगर click directly backdrop पर हुआ है (modal content पर नहीं)
    if (e.target === e.currentTarget) {
      if (isEditing) {
        resetEditForm(); // अगर edit mode में है तो cancel करें
      } else {
        onClose(); // नहीं तो modal बंद करें
      }
    }
  };

  if (!isOpen || !conversation?.isGroup) return null;
  
  const currentIconUrl = newGroupIconPreview || getGroupIconUrl(conversation);

  return (
  <> 
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4"
      onClick={handleBackdropClick}>
      <div className="bg-background rounded-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border-color px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-foreground">
            {isEditing ? 'Edit Group Info' : 'Group Info'}
          </h2>
          <button
            onClick={() => isEditing ? resetEditForm() : onClose()}
            disabled={isSaving}
            className="p-2 hover:bg-bg-subtle rounded-full transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Group Profile */}
            <div className="px-6 py-6 text-center border-b border-border-color ">
              <div className="relative flex justify-center mb-4">
                
                {currentIconUrl ? (
                  <img 
                    src={currentIconUrl} 
                    alt="Group" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 "
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center border-4 border-primary/20">
                    <svg className="w-12 h-12 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                )}
                
                {isEditing && (
                  <label htmlFor="group-icon-upload" className="absolute bottom-0 right-1/2 translate-x-10 bg-background p-2 rounded-full cursor-pointer shadow-md border border-border-color hover:bg-bg-subtle">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                    </svg>
                    <input id="group-icon-upload" type="file" accept="image/*" className="hidden" onChange={handleIconChange} />
                  </label>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Group Name"
                    className="w-full px-4 py-2 border border-border-color bg-bg-subtle text-foreground rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                  />
                  <textarea
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Group Description (Optional)"
                    rows="3"
                    className="w-full px-4 py-2 border border-border-color bg-bg-subtle text-foreground rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                  />
                  
                  {/* Admin Only Chat Toggle */}
                  <div className="flex items-center justify-between text-left p-3 bg-bg-subtle rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Admin Only Chat</p>
                      <p className="text-xs text-text-muted">
                        If enabled, only admins can send messages.
                      </p>
                    </div>
                    <button
                      onClick={() => setNewAdminOnlyChat(!newAdminOnlyChat)}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                        newAdminOnlyChat ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                          newAdminOnlyChat ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={resetEditForm}
                      disabled={isSaving}
                      className="flex-1 bg-bg-subtle text-foreground py-2 rounded-lg font-semibold hover:bg-border-color transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground mb-1 flex items-center justify-center space-x-2">
                    <span>{conversation.groupName || 'Unnamed Group'}</span>
                    {isAdmin && (
                      <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-bg-subtle rounded-full">
                        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </h3>
                  {conversation.groupDescription && (
                    <p className="text-sm text-text-muted mb-2 max-w-xs mx-auto break-words">
                      {conversation.groupDescription}
                    </p>
                  )}
                  <p className="text-sm text-text-muted">
                    {participants.length} member{participants.length !== 1 ? 's' : ''}
                  </p>
                </>
              )}
            </div>

            {/* Members List */}
            {/* Members List */}
            <div className="px-6 py-4">
            {/* 🆕 4. Members हेडर को "Add" बटन के साथ अपडेट करें */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
                Members
              </h4>
              {isAdmin && (
                <button
                  onClick={() => setIsAddParticipantOpen(true)}
                  className="flex items-center space-x-1 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition"
                  title="Add new member"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add</span>
                </button>
              )}
            </div>
              <div className="space-y-3">
                {participants.map((participant) => {
                  const isCurrentUser = participant.id === currentUser?.id;
                  const isParticipantAdmin = participant.id === conversation.groupAdmin;
                  
                  return (
                    <div 
                      key={participant.id} 
                      className="flex items-center justify-between p-3 bg-bg-subtle rounded-lg hover:bg-border-color transition"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0 ">
                        <UserAvatar 
                          name={participant.name} 
                          user={participant}
                          size="sm"
                          
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {participant.name}
                            {isCurrentUser && ' (You)'}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            {participant.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        {isParticipantAdmin && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                            Admin
                          </span>
                        )}
                        
                        {isAdmin && !isCurrentUser && !isParticipantAdmin && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setParticipantToMakeAdmin(participant);
                                setShowAdminConfirm(true);
                              }}
                              className="p-1.5 hover:bg-green-100 rounded-full transition"
                              title="Make Admin"
                            >
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>

                            <button
                              onClick={() => handleRemoveParticipant(participant.id)}
                              className="p-1.5 hover:bg-red-100 rounded-full transition"
                              title="Remove participant"
                            >
                              {/* ✅ FIX: Corrected viewBox attribute */}
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 border-t border-border-color space-y-3">
              {isAdmin ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Group</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowLeaveConfirm(true)}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Leave Group</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* Confirmation Modals */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-2xl">
            <div className="bg-background rounded-xl p-6 m-4 max-w-sm">
              <h3 className="text-lg font-bold text-foreground mb-2">Delete Group?</h3>
              <p className="text-sm text-text-muted mb-4">
                This will permanently delete the group for all members. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteGroup}
                  disabled={processing}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {processing ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={processing}
                  className="flex-1 bg-bg-subtle text-foreground py-2 rounded-lg font-semibold hover:bg-border-color transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
            
          </div>
        )}

        {showLeaveConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-2xl">
            <div className="bg-background rounded-xl p-6 m-4 max-w-sm">
              <h3 className="text-lg font-bold text-foreground mb-2">Leave Group?</h3>
              <p className="text-sm text-text-muted mb-4">
                Are you sure you want to leave this group? You will no longer receive messages from this group.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleLeaveGroup}
                  disabled={processing}
                  className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50"
                >
                  {processing ? 'Leaving...' : 'Leave'}
                </button>
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  disabled={processing}
                  className="flex-1 bg-bg-subtle text-foreground py-2 rounded-lg font-semibold hover:bg-border-color transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showAdminConfirm && participantToMakeAdmin && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-2xl">
            <div className="bg-background rounded-xl p-6 m-4 max-w-sm">
              <h3 className="text-lg font-bold text-foreground mb-2">Transfer Admin Rights?</h3>
              <p className="text-sm text-text-muted mb-4">
                Are you sure you want to make <span className="font-semibold text-foreground">{participantToMakeAdmin.name}</span> the new group admin? You will lose your admin privileges.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleMakeAdmin}
                  disabled={isTransferring}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {isTransferring ? 'Transferring...' : 'Yes, Make Admin'}
                </button>
                <button
                  onClick={() => {
                    setShowAdminConfirm(false);
                    setParticipantToMakeAdmin(null);
                  }}
                  disabled={isTransferring}
                  className="flex-1 bg-bg-subtle text-foreground py-2 rounded-lg font-semibold hover:bg-border-color transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    <AddParticipantModal
        isOpen={isAddParticipantOpen}
        onClose={() => setIsAddParticipantOpen(false)}
        currentUser={currentUser}
        conversation={conversation}
        onNotification={onNotification}
        onParticipantAdded={handleParticipantAdded}
      />
  </>
  );
}