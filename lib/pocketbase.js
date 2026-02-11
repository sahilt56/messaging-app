// lib/pocketbase.js - WITH GROUP CHAT SUPPORT

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
if (!PB_URL) {
    throw new Error("NEXT_PUBLIC_POCKETBASE_URL is not set in environment variables.");
}
const pb = new PocketBase(PB_URL);
pb.authStore.onChange((token, model) => {
    if (!model) { 
        pb.realtime.disconnect(); 
    }
}, true); 

pb.autoCancellation(false);
export default pb;
// lib/pocketbase.js

export const loginWithOAuth = async (providerName) => {
  try {
    // 1. OAuth ke zariye login karein
    const authData = await pb.collection('users').authWithOAuth2({ 
      provider: providerName, // Generally 'google'
    });
    
    // 2. Turant user record ki emailVisibility check aur update karein (Aapka logic)
    if (authData.record.emailVisibility === false) {
      console.log('Updating emailVisibility after OAuth...');
      
      const updatedUser = await pb.collection('users').update(authData.record.id, {
        emailVisibility: true
      });
      
      // 3. Auth Store ko updated record se save karein
      pb.authStore.save(pb.authStore.token, updatedUser);
      // authData object mein bhi record ko update karein
      authData.record = updatedUser;
    }
    
    // 4. 👈 ZAROORI BADLAAV: Poora 'authData' object return karein
    // Ismein authData.meta.isNew shaamil hai
    return { success: true, authData: authData };

  } catch (error) {
    console.error('OAuth login error:', error);
    return { success: false, error: error.message };
  }
};
// ==================== AUTH FUNCTIONS ====================
export const login = async (email, password) => {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    return { success: true, user: authData.record };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// lib/pocketbase.js

export const signup = async (email, password, name, username) => {
  try {
    console.log('Attempting signup with:', { email, name, username });
    
    const data = { 
      email, 
      password, 
      passwordConfirm: password, 
      name,
      username, // 👈 1. 'username' ab yahaan defined hai
      emailVisibility: true, // 👈 2. Aapka 'emailVisibility'
    };
    
    const user = await pb.collection('users').create(data);
    
    // Auto login after signup
    const loginResult = await login(email, password);
    if (loginResult.success) {
      return { success: true, user };
    } else {
      return { success: false, error: 'User created but login failed' };
    }
  } catch (error) {
    console.error('Signup error:', error.response); // error.response behtar hai
    
    let errorMessage = 'Signup failed. Please try again.';
    
    // 👈 3. Behtar error handling (Pocketbase se)
    if (error.response?.data?.data?.username) {
      errorMessage = 'This username is already taken.';
    } else if (error.response?.data?.data?.email) {
      errorMessage = 'This email is already registered.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// ✅ NEW: Password Reset Function
export const resetPassword = async (email) => {
  try {
    await pb.collection('users').requestPasswordReset(email);
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    let errorMessage = 'Failed to send reset email';
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

export const logout = () => {
  pb.authStore.clear();
pb.realtime.disconnect();};
pb.authStore.onChange((token, model) => {
    // जब Auth Store बदलता है, तो सभी Realtime कनेक्शन को काट दें 
    // ताकि वे नए token/client-id के साथ फिर से जुड़ सकें।
    if (!model) { // अगर कोई यूजर लॉग इन नहीं है
        pb.realtime.disconnect(); 
    }
}, true);

export const getCurrentUser = () => pb.authStore.model;
export const isAuthenticated = () => pb.authStore.isValid;

// ==================== USER PROFILE FUNCTIONS ====================
export const updateUserProfile = async (userId, data) => {
  try {
    const updated = await pb.collection('users').update(userId, data);
    pb.authStore.save(pb.authStore.token, updated);
    return updated;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};

export const uploadAvatar = async (userId, file) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    const updated = await pb.collection('users').update(userId, formData);
    pb.authStore.save(pb.authStore.token, updated);
    return updated;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
};

export const getAvatarUrl = (user) => {
  if (!user || !user.avatar) return null;
  return pb.files.getURL(user, user.avatar, { thumb: '100x100' });
};

export const getUserById = async (userId) => {
  try {
    return await pb.collection('users').getOne(userId);
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

// ==================== CONVERSATION FUNCTIONS ====================

export const getConversations = async (userId) => {
  try {
    const conversations = await pb.collection('conversations').getFullList({
      filter: `participants.id ?~ "${userId}"`,
      sort: '-lastMessageTime',
      expand: 'participants,groupAdmin',
    });
    return conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

// 🆕 CREATE GROUP CHAT
export const createGroupChat = async (groupName, participantIds, adminId, groupIconFile = null) => {
  try {
    const formData = new FormData();
    formData.append('isGroup', true);
    formData.append('groupName', groupName);
    formData.append('groupAdmin', adminId);
    
    // Add all participants
    participantIds.forEach(id => {
      formData.append('participants', id);
    });
    
    if (groupIconFile) {
      formData.append('groupIcon', groupIconFile);
    }
    
    formData.append('lastMessage', 'Group created');
    formData.append('lastMessageTime', new Date().toISOString());
    
    const conversation = await pb.collection('conversations').create(formData);
    
    const expandedConversation = await pb.collection('conversations').getOne(conversation.id, {
      expand: 'participants,groupAdmin',
    });
    
    return expandedConversation;
  } catch (error) {
    console.error('Error creating group chat:', error);
    return null;
  }
};

// 🆕 UPDATE GROUP INFO
export const updateGroupInfo = async (conversationId, data) => {
  try {
    const payload = new FormData();

    // FormData.append() का उपयोग करके सभी डेटा को जोड़ें
    // यह टेक्स्ट, बूलियन और फाइलों को हैंडल कर सकता है
    if (data.groupName !== undefined) {
      payload.append('groupName', data.groupName);
    }
    if (data.groupDescription !== undefined) {
      payload.append('groupDescription', data.groupDescription);
    }
    if (data.adminOnlyChat !== undefined) {
      // बूलियन को 'true' या 'false' स्ट्रिंग के रूप में भेजें
      payload.append('adminOnlyChat', data.adminOnlyChat ? 'true' : 'false');
    }
    if (data.groupIconFile) {
      payload.append('groupIcon', data.groupIconFile);
    }

    const updated = await pb.collection('conversations').update(conversationId, payload);
    
    // फुल एक्सपैंडेड रिकॉर्ड वापस भेजें
    const expanded = await pb.collection('conversations').getOne(updated.id, {
      expand: 'participants,groupAdmin',
    });
    return expanded;
  } catch (error) {
    console.error('Error updating group info:', error);
    return null;
  }
};

// 🆕 ADD PARTICIPANT TO GROUP
export const addParticipantToGroup = async (conversationId, newParticipantId) => {
  try {
    const conversation = await pb.collection('conversations').getOne(conversationId);
    const currentParticipants = conversation.participants || [];
    
    if (currentParticipants.includes(newParticipantId)) {
      console.log('User already in group');
      return conversation;
    }
    
    const updatedParticipants = [...currentParticipants, newParticipantId];
    
    const formData = new FormData();
    updatedParticipants.forEach(id => {
      formData.append('participants', id);
    });
    
    const updated = await pb.collection('conversations').update(conversationId, formData);
    
    return updated;
  } catch (error) {
    console.error('Error adding participant:', error);
    return null;
  }
};

// 🆕 REMOVE PARTICIPANT FROM GROUP
export const removeParticipantFromGroup = async (conversationId, participantIdToRemove) => {
  try {
    const conversation = await pb.collection('conversations').getOne(conversationId);
    const currentParticipants = conversation.participants || [];
    
    const updatedParticipants = currentParticipants.filter(id => id !== participantIdToRemove);
    
    const formData = new FormData();
    updatedParticipants.forEach(id => {
      formData.append('participants', id);
    });
    
    const updated = await pb.collection('conversations').update(conversationId, formData);
    
    return updated;
  } catch (error) {
    console.error('Error removing participant:', error);
    return null;
  }
};

// ... (आपकी फ़ाइल के बाकी सभी फंक्शंस के बाद) ...

// ... (आपकी फ़ाइल के बाकी सभी फंक्शंस के बाद) ...

// ... (आपकी फ़ाइल के बाकी सभी फंक्शंस के बाद) ...

export const clearChatHistory = async (conversationId) => {
  try {
    // 1. सभी मैसेज IDs प्राप्त करें, पुराने से नए (chronological) क्रम में
    const messages = await pb.collection('messages').getFullList({
      filter: `conversation = "${conversationId}"`,
      sort: 'created', // पुराने मैसेज पहले आएँगे
      fields: 'id', // केवल IDs की ज़रूरत है
    });

    if (messages.length === 0) {
      return { success: true, message: 'No messages to delete.' };
    }

    // 2. ऐरे (array) को रिवर्स करें ताकि हम नए से पुराने (reverse-chronological) क्रम में डिलीट करें
    // (यह 'replyTo' constraint errors से बचने में मदद करता है)
    const messagesToDelete = messages.reverse();
    
    // 3. 💡 फिक्स: लूप करें और डिलीट करें, लेकिन 404 एरर को नजरअंदाज करें
    for (const msg of messagesToDelete) {
      try {
        // मैसेज को डिलीट करने की कोशिश करें
        await pb.collection('messages').delete(msg.id);
      } catch (error) {
        // 4. 💡 फिक्स: कैच ब्लॉक
        // जाँचें कि क्या एरर 404 (Not Found) है
        if (error.status === 404) {
          // अगर 404 है, तो इसका मतलब है कि मैसेज पहले ही
          // कैस्केड डिलीट द्वारा हटाया जा चुका है। यह ठीक है।
          // हम इस एरर को सुरक्षित रूप से नजरअंदाज कर सकते हैं और जारी रख सकते हैं।
          console.warn(`Message ${msg.id} was already deleted (likely by cascade), ignoring 404.`);
        } else {
          // अगर यह कोई और एरर है (जैसे 500 या 403),
          // तो उसे थ्रो (throw) करें ताकि यूज़र को पता चले कि कुछ गलत हुआ है।
          throw error;
        }
      }
    }

    // 5. कन्वर्सेशन के 'last message' को अपडेट करें
    await pb.collection('conversations').update(conversationId, {
      lastMessage: 'Chat history cleared',
      lastMessageTime: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return { success: false, error: error.message };
  }
};

// 🆕 LEAVE GROUP
// 🆕 LEAVE GROUP
// 🆕 LEAVE GROUP - FIXED VERSION (NO AUTO REFRESH)
export const leaveGroup = async (conversationId, userId) => {
  try {
    const conversation = await pb.collection('conversations').getOne(conversationId);
    const currentParticipants = conversation.participants || [];

    // 1️⃣ Admin Check: एडमिन को ग्रुप छोड़ने की अनुमति नहीं है
    if (conversation.groupAdmin === userId) {
      console.error('Admin cannot leave group. Transfer admin rights first or delete the group.');
      return { success: false, error: 'Admin must transfer rights or delete the group.' };
    }

    const updatedParticipants = currentParticipants.filter(id => id !== userId);

    // 2️⃣ Group Deletion Logic
    if (updatedParticipants.length === 0) {
      console.log(`Group ${conversationId} is now empty. Deleting record.`);
      await pb.collection('conversations').delete(conversationId);
      return { success: true, message: 'Group deleted successfully as it became empty.' };
    } else {
      // 3️⃣ Normal Update
      const formData = new FormData();
      updatedParticipants.forEach(id => {
        formData.append('participants', id);
      });

      const updated = await pb.collection('conversations').update(conversationId, formData);
      return { success: true, conversation: updated };
    }

  } catch (error) {
    console.error('Error leaving group:', error);
    const errorMessage = error.response?.message || error.message;
    return { success: false, error: errorMessage };
  }
};


export const transferAdminRights = async (conversationId, newAdminId) => {
  try {
    // 1️⃣ Update group admin in PocketBase
    const updated = await pb.collection('conversations').update(conversationId, {
      groupAdmin: newAdminId,
    });

    // 2️⃣ Fetch expanded record (with participants + groupAdmin)
    const expanded = await pb.collection('conversations').getOne(updated.id, {
      expand: 'participants,groupAdmin',
    });

    // ✅ 3️⃣ Auto Refresh UI after update
    setTimeout(() => {
      window.location.reload();
    }, 500);

    return expanded;

  } catch (error) {
    console.error('Error transferring admin rights:', error);
    return null;
  }
};


// 🆕 CHECK IF USER IS GROUP ADMIN
export const isGroupAdmin = (conversation, userId) => {
  if (!conversation?.isGroup) return false;
  return conversation.groupAdmin === userId;
};

// 🆕 DELETE GROUP (Admin only)
export const deleteGroup = async (conversationId, userId) => {
  try {
    const conversation = await pb.collection('conversations').getOne(conversationId);
    
    // Check if user is admin
    if (!conversation.isGroup) {
      return { success: false, error: 'Not a group conversation' };
    }
    
    if (conversation.groupAdmin !== userId) {
      return { success: false, error: 'Only admin can delete the group' };
    }
    
    await pb.collection('conversations').delete(conversationId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting group:', error);
    return { success: false, error: error.message };
  }
};

// 🆕 GET GROUP ICON URL
export const getGroupIconUrl = (conversation) => {
  if (!conversation || !conversation.groupIcon) return null;
  return pb.files.getURL(conversation, conversation.groupIcon, { thumb: '100x100' });
};

export const createConversation = async (participantIds) => {
  try {
    const formData = new FormData();
    
    // Add participants using FormData
    participantIds.forEach(id => {
      formData.append('participants', id);
    });
    
    formData.append('isGroup', false);
    formData.append('lastMessage', '');
    formData.append('lastMessageTime', new Date().toISOString());
    
    const conversation = await pb.collection('conversations').create(formData);
    
    const expandedConversation = await pb.collection('conversations').getOne(conversation.id, {
      expand: 'participants',
    });
    
    return expandedConversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
};

export const findConversationBetweenUsers = async (userId1, userId2) => {
  try {
    const conversations = await pb.collection('conversations').getFullList({
      filter: `participants.id ?~ "${userId1}" && isGroup = false`,
      expand: 'participants',
    });
    
    const existingConversation = conversations.find(conv => {
      const participantIds = conv.participants || [];
      if (participantIds.length !== 2) return false;
      return participantIds.includes(userId1) && participantIds.includes(userId2);
    });
    
    return existingConversation || null;
  } catch (error) {
    console.error('Error finding conversation:', error);
    return null;
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    await pb.collection('conversations').delete(conversationId);
    return true;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
};

// ==================== MESSAGE FUNCTIONS ====================

export const getFileUrl = (record, filename) => {
  if (!record || !filename) return null;
  return pb.files.getURL(record, filename);
};

export const getMessages = async (conversationId) => {
  try {
    const messages = await pb.collection('messages').getFullList({
      filter: `conversation = "${conversationId}"`,
      sort: 'created',
      expand: 'sender,replyTo,replyTo.sender',
      cache: 'no-cache'
    });
    
    for (const message of messages) {
      const reactions = await pb.collection('reactions').getFullList({
        filter: `message = "${message.id}"`,
        expand: 'user'
      });
      
      const attachmentUrl = message.attachment ? getFileUrl(message, message.attachment) : null;
      
      message.expand = {
        ...message.expand,
        reactions: reactions,
        attachmentUrl: attachmentUrl
      };
    }
    
    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

// send message
export async function sendMessage({
  conversationId,
  senderId,
  content,
  isSystemMessage = false,
  file = null,
  attachmentToCopy = null,
  originalMessageId = null,
  replyToId = null,
  isForwarded = false,
  isCodeSnippet = false,
  codeLanguage = null,
}) {
  try {
    // Admin-only check
    const conversation = await pb.collection('conversations').getOne(conversationId);
    if (
      conversation?.isGroup &&
      conversation?.adminOnlyChat &&
      conversation?.groupAdmin !== senderId &&
      !isSystemMessage
    ) {
      throw new Error("Only admins can send messages in this group.");
    }

    let messageRecord;
    let lastMessageContent = content;

    // File handling branch
    if (file || attachmentToCopy) {
      const formData = new FormData();
      
      formData.append('conversation', conversationId);
      if (senderId) formData.append('sender', senderId);
      formData.append('content', content || '');
      if (replyToId) formData.append('replyTo', replyToId);
      if (codeLanguage) formData.append('codeLanguage', codeLanguage);
      
      formData.append('isSystemMessage', isSystemMessage ? 'true' : 'false');
      formData.append('isForwarded', isForwarded ? 'true' : 'false');
      formData.append('isCodeSnippet', isCodeSnippet ? 'true' : 'false');
      
      if (file) {
        // New file upload
        formData.append('attachment', file);
        if (!content) lastMessageContent = file.name || 'Attachment';
      } else if (attachmentToCopy && originalMessageId) {
        // Forward existing file
        const originalMessage = await pb.collection('messages').getOne(originalMessageId);
        const fileUrl = pb.files.getURL(originalMessage, attachmentToCopy);
        
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const filename = attachmentToCopy.split('_').slice(1).join('_') || attachmentToCopy.split('_').pop();
        const fileToUpload = new File([blob], filename, { 
          type: blob.type || 'application/octet-stream' 
        });
        
        formData.append('attachment', fileToUpload);
        if (!content) lastMessageContent = filename || 'Attachment';
      }
      
      messageRecord = await pb.collection('messages').create(formData);

    } else {
      // Text-only message
      const data = {
        conversation: conversationId,
        sender: senderId,
        content: content || '',
        isSystemMessage: isSystemMessage,
        isForwarded: isForwarded,
        isCodeSnippet: isCodeSnippet,
        codeLanguage: codeLanguage || 'text',
        replyTo: replyToId,
      };

      if (isCodeSnippet && !content) lastMessageContent = 'Code Snippet';
      if (isSystemMessage) {
         data.content = content || 'System message';
         lastMessageContent = data.content;
      }
      
      messageRecord = await pb.collection('messages').create(data);
    }

    // Update conversation
    await pb.collection('conversations').update(conversationId, {
      lastMessage: lastMessageContent,
      lastMessageTime: new Date().toISOString(),
    });

    return messageRecord;

  } catch (error) {
    console.error('Error sending message:', error.message);
    throw error;
  }
}




export const deleteMessage = async (messageId) => {
  try {
    await pb.collection('messages').delete(messageId);
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
};

export const markMessageAsRead = async (messageId) => {
  try {
    await pb.collection('messages').update(messageId, { read: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};

export const markConversationMessagesAsRead = async (conversationId, currentUserId) => {
  try {
    const unreadMessages = await pb.collection('messages').getFullList({
      filter: `conversation = "${conversationId}" && sender != "${currentUserId}" && read = false`,
    });
    
    for (const message of unreadMessages) {
      await markMessageAsRead(message.id);
    }
  } catch (error) {
    console.error('Error marking conversation messages as read:', error);
  }
};

export const getUnreadCount = async (conversationId, currentUserId) => {
  try {
    const result = await pb.collection('messages').getList(1, 1, {
      filter: `conversation = "${conversationId}" && sender != "${currentUserId}" && read = false`,
    });
    return result.totalItems;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// ==================== REALTIME SUBSCRIPTIONS ====================

export const subscribeToMessages = (conversationId, callback) => {
  return pb.collection('messages').subscribe('*', async (e) => {
    if (e.record.conversation === conversationId) {
      if (e.action === 'create' || e.action === 'update') {
        try {
          const fullRecord = await pb.collection('messages').getOne(e.record.id, {
            expand: 'sender,replyTo,replyTo.sender,reactions.user',
          });

          const attachmentUrl = fullRecord.attachment ? getFileUrl(fullRecord, fullRecord.attachment) : null;
          fullRecord.expand = fullRecord.expand || {};
          fullRecord.expand.attachmentUrl = attachmentUrl;
          
          callback(e.action, fullRecord);
        } catch (error) {
          console.error("Error fetching full record:", error);
          callback(e.action, e.record);
        }
      } else if (e.action === 'delete') {
        callback(e.action, e.record);
      }
    }
  }, {
    expand: 'sender,replyTo,replyTo.sender,reactions.user',
  });
};

export const subscribeToConversations = (userId, callback) => {
  return pb.collection('conversations').subscribe('*', (e) => {
    if (e.record.participants && e.record.participants.includes(userId)) {
      callback(e.action, e.record);
    }
  });
};

export const unsubscribeFromConversations = () => {
  pb.collection('conversations').unsubscribe('*');
};

export const unsubscribeFromMessages = () => {
  pb.collection('messages').unsubscribe('*');
};

export const unsubscribeFromTypingStatus = () => {
  pb.collection('typing_status').unsubscribe('*');
};

// ==================== REACTION FUNCTIONS ====================

export const toggleReaction = async (messageId, userId, emoji) => {
  try {
    const userReactions = await pb.collection('reactions').getFullList({
      filter: `message = "${messageId}" && user = "${userId}"`,
    });

    const sameEmojiReaction = userReactions.find(r => r.emoji === emoji);

    if (sameEmojiReaction) {
      await pb.collection('reactions').delete(sameEmojiReaction.id);
      return { action: 'deleted', reactionId: sameEmojiReaction.id };
    }

    if (userReactions.length > 0) {
      for (const oldReaction of userReactions) {
        await pb.collection('reactions').delete(oldReaction.id);
      }
    }

    const newReaction = await pb.collection('reactions').create({
      message: messageId,
      user: userId,
      emoji: emoji,
    });
    
    return { action: 'created', reaction: newReaction };
  } catch (error) {
    console.error('Error toggling reaction:', error);
    return null;
  }
};

export const subscribeToReactions = (conversationId, callback) => {
  return pb.collection('reactions').subscribe('*', async (e) => {
    if (!e.record.message) return;
    
    try {
      const messageRecord = await pb.collection('messages').getOne(e.record.message, {
        expand: 'sender,replyTo,replyTo.sender'
      });

      const reactions = await pb.collection('reactions').getFullList({
        filter: `message = "${messageRecord.id}"`,
        expand: 'user'
      });

      messageRecord.expand = messageRecord.expand || {};
      messageRecord.expand.reactions = reactions;

      if (messageRecord.conversation === conversationId) {
        callback(e.action, messageRecord);
      }
    } catch(error) {
      console.error('Error in reaction subscription:', error);
    }
  });
};

// ==================== TYPING STATUS ====================

export const setTypingStatus = async (conversationId, userId, isTyping) => {
  try {
    const existingStatus = await pb.collection('typing_status').getFullList({
      filter: `conversation = "${conversationId}" && user = "${userId}"`,
    });
    
    if (existingStatus.length > 0) {
      await pb.collection('typing_status').update(existingStatus[0].id, {
        isTyping,
        timestamp: new Date().toISOString(),
      });
    } else {
      await pb.collection('typing_status').create({
        conversation: conversationId,
        user: userId,
        isTyping,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error setting typing status:', error);
  }
};

export const subscribeToTypingStatus = (conversationId, callback) => {
  pb.collection('typing_status').subscribe('*', (e) => {
    if (e.record.conversation === conversationId) {
      callback(e.action, e.record);
    }
  });
};

// ==================== OTHER FUNCTIONS ====================

// lib/pocketbase.js

// 👈 1. Naam badla gaya
export const searchUsers = async (query) => {
  try {
    if (!query || query.length < 2) return [];

    // 👈 2. Query ko sanitize karein
    const sanitizedQuery = query.replace(/[\\\[\]\(\)\{\}\^\$\+\-\*\.\?]/g, ''); 

    if (!pb.authStore.isValid) {
      console.error('User not authenticated');
      return [];
    }

    // 👈 3. Filter ko update karein taaki 'username' bhi search ho
    let filter = `
      email ~ "${sanitizedQuery}" || 
      name ~ "${sanitizedQuery}" || 
      username ~ "${sanitizedQuery}"
    `;
    
    const users = await pb.collection('users').getList(1, 10, {
      filter: filter,
      fields: 'id, name, username, avatar', // 👈 यह लाइन avatar ko fetch karegi
    });
    
    return users.items;
  } catch (error) {
    console.error('Error searching users:', error.message);
    console.error('PocketBase Search Error Details:', error.response?.data); 
    return [];
  }
};

// lib/pocketbase.js

// ==================== FRIEND REQUEST FUNCTIONS (Naya) ====================

/**
 * Check karein ki do users ke beech kya friend status hai
 * Returns: 'friends', 'pending_from_me', 'pending_from_them', 'not_friends'
 */
export const checkFriendRequestStatus = async (fromUserId, toUserId) => {
  if (!fromUserId || !toUserId) return 'not_friends';

  const filter = `
    (from_user = "${fromUserId}" && to_user = "${toUserId}") || 
    (from_user = "${toUserId}" && to_user = "${fromUserId}")
  `;
  
  try {
    const records = await pb.collection('friend_requests').getFullList({ filter });

    if (records.length === 0) {
      return 'not_friends';
    }

    const request = records[0];
    if (request.status === 'accepted') {
      return 'friends';
    }

    if (request.status === 'pending') {
      if (request.from_user === fromUserId) {
        return 'pending_from_me'; // Maine request bheji hai
      } else {
        return 'pending_from_them'; // Mujhe request aayi hai
      }
    }
    
    return 'not_friends'; // Agar 'declined' hai ya kuch aur

  } catch (error) {
    console.error('Error checking friend status:', error);
    return 'not_friends';
  }
};


/**
 * Ek naya friend request bhejta hai
 */
export const sendFriendRequest = async (fromUserId, toUserId) => {
  try {
    // Check karein ki pehle se koi request/friendship hai ya nahin
    const status = await checkFriendRequestStatus(fromUserId, toUserId);
    if (status !== 'not_friends') {
      console.log('Request already exists or they are already friends.');
      return { success: false, error: 'Request already exists or you are already friends.' };
    }

    const data = {
      from_user: fromUserId,
      to_user: toUserId,
      status: 'pending', // Default value, lekin clear hona achha hai
    };

    const record = await pb.collection('friend_requests').create(data);
    return { success: true, record };

  } catch (error) {
    console.error('Error sending friend request:', error);
    return { success: false, error: error.message };
  }
};

export const updateLastSeen = async (userId) => {
  // ▼ ADD THIS LOG ▼
  console.log(`Attempting updateLastSeen for user ID: ${userId}. Logged-in user is: ${pb.authStore.model?.id}`);

  // Add the guard clause just in case
  if (!userId) {
    console.warn('updateLastSeen was called with no userId.');
    return;
  }

  try {
    await pb.collection('users').update(userId, {
      lastSeen: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Failed to update lastSeen for user ${userId}:`, error);
  }
};

export const isUserOnline = (lastSeen) => {
  if (!lastSeen) return false;
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMinutes = (now - lastSeenDate) / 1000;
  return diffMinutes < 30;
};

export const scheduleMessage = async (conversationId, senderId, content, scheduleTimeISO) => {
  try {
    const data = {
      conversation: conversationId,
      sender: senderId,
      content: content,
      scheduled_at: scheduleTimeISO,
      status: 'pending',
    };
    await pb.collection('scheduled_messages').create(data);
    return true;
  } catch (error) {
    console.error('Error saving scheduled message:', error);
    return false;
  }
};

export const getPendingFriendRequests = async (userId) => {
  if (!userId) return [];
  
  try {
    const records = await pb.collection('friend_requests').getFullList({
      filter: `to_user = "${userId}" && status = "pending"`,
      expand: 'from_user', // 👈 Taki hum bhejnewale ki details (naam/avatar) bhi le sakein
    });
    return records;
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return [];
  }
};

/**
 * Ek friend request ko update (accept ya decline) karta hai
 */
export const updateFriendRequest = async (requestId, newStatus) => {
  try {
    const data = { status: newStatus };
    const record = await pb.collection('friend_requests').update(requestId, data);
    return { success: true, record };
  } catch (error) {
    console.error('Error updating friend request:', error);
    return { success: false, error: error.message };
  }
};
export const getMyFriends = async (userId, query) => {
  if (!userId || query.length < 2) return [];

  try {
    const filter = `(from_user = "${userId}" || to_user = "${userId}") && status = "accepted"`;
    
    const requests = await pb.collection('friend_requests').getFullList({
      filter: filter,
      expand: 'from_user,to_user',
    });

    let friends = [];
    for (const req of requests) {
      const friendRecord = req.expand.from_user.id === userId 
        ? req.expand.to_user 
        : req.expand.from_user;
        
      if (friendRecord) {
        friends.push(friendRecord);
      }
    }

    // 💡 *** FIX YAHAN SHURU HOTA HAI *** 💡
    // 'friends' array mein duplicate user ho sakte hain. Unhein filter karein.
    
    // 1. Ek Map banayein. Map mein duplicate keys nahin ho sakti.
    const uniqueFriends = new Map();
    
    // 2. Sabhi doston ko Map mein daalein (key = friend.id, value = friend object)
    friends.forEach(friend => {
      uniqueFriends.set(friend.id, friend);
    });
    
    // 3. Map se unique values ko waapas ek array mein nikaalein
    const friendsList = Array.from(uniqueFriends.values());
    // 💡 *** FIX YAHAN KHATM HOTA HAI *** 💡

    // Ab 'friendsList' (jo unique hai) par filter karein, 'friends' par nahin
    const lowerQuery = query.toLowerCase();
    const results = friendsList.filter(friend => 
      friend.name.toLowerCase().includes(lowerQuery) || 
      friend.username.toLowerCase().includes(lowerQuery)
    );

    return results;

  } catch (error) {
    console.error('Error fetching friends:', error);
    return [];
  }
};
export const getAllMyFriends = async (userId) => {
  if (!userId) return [];

  try {
    // 1. Aisi friend requests khojein jo 'accepted' hain aur 'userId' shaamil hai
    const filter = `(from_user = "${userId}" || to_user = "${userId}") && status = "accepted"`;
    
    const requests = await pb.collection('friend_requests').getFullList({
      filter: filter,
      expand: 'from_user,to_user', // 2. Dono users ki details lein
    });

    // 3. Un details ko 'friends' ki ek list mein badlein
    let friends = [];
    for (const req of requests) {
      const friendRecord = req.expand.from_user.id === userId 
        ? req.expand.to_user 
        : req.expand.from_user;
        
      if (friendRecord) {
        friends.push(friendRecord);
      }
    }

    // 4. 💡 Duplicates ko filter karein (hamesha surakshit rehta hai)
    const uniqueFriends = new Map();
    friends.forEach(friend => {
      uniqueFriends.set(friend.id, friend);
    });
    
    // 5. Map se unique values ko waapas ek array mein nikaalein
    const friendsList = Array.from(uniqueFriends.values());

    return friendsList;

  } catch (error) {
    console.error('Error fetching all friends:', error);
    return [];
  }
};
// * Users ko sirf unke UNIQUE @username se khojta hai
//  */
export const searchUsersByUsername = async (query) => {
  try {
    if (!query || query.length < 2) return [];

    // Agar user '@' type karta hai, to use hata dein
    const sanitizedUsername = query.startsWith('@') ? query.substring(1) : query;
    
    if (!sanitizedUsername) return []; // Agar sirf '@' tha

    if (!pb.authStore.isValid) {
      console.error('User not authenticated');
      return [];
    }

    // 👈 Sirf 'username' field mein khojein
    const filter = `username ~ "${sanitizedUsername}"`; 
    
    const users = await pb.collection('users').getList(1, 10, {
      filter: filter,
    });
    
    return users.items;
  } catch (error)
 {
    console.error('Error searching users by username:', error.message);
    return [];
  }
};
// lib/pocketbase.js

/**
 * Jaanch karta hai ki username uplabdh hai ya nahin
 * Returns: true (agar uplabdh hai), false (agar pehle se maujood hai)
 */
export const isUsernameAvailable = async (username) => {
  try {
    // Koshish karein ki uss username se koi record mile
    await pb.collection('users').getFirstListItem(`username = "${username}"`);
    // Agar record mil gaya (error nahin aaya), to matlab username le liya gaya hai
    return false;
  } catch (error) {
    // Agar error '404' (Not Found) hai, to matlab username uplabdh hai
    if (error.status === 404) {
      return true;
    }
    // Koi aur error
    console.error('Error checking username:', error);
    return false; // Suraksha ke liye false return karein
  }
};
/**
 * Ek user ke liye pending friend requests ki ginti laata hai
 */
export const getPendingRequestsCount = async (userId) => {
  if (!userId) return 0;
  
  try {
    // getList(1, 1) sirf totalItems laane ka ek tez tareeka hai
    const result = await pb.collection('friend_requests').getList(1, 1, {
      filter: `to_user = "${userId}" && status = "pending"`,
    });
    return result.totalItems;
  } catch (error) {
    console.error('Error fetching pending requests count:', error);
    return 0;
  }
};
 // lib/pocketbase.js

/**
 * 'friend_requests' collection mein hone waale badlaavon ko sunta hai
 * @param {string} userId - Current user ki ID
 * @param {function} callback - Jab koi badlaav ho to yeh function call hoga
 * @returns {Promise<function>} - Unsubscribe karne ke liye ek function ka Promise
 */
// 👈 1. Ise 'async' banayein
export const subscribeToFriendRequests = async (userId, callback) => {
  if (!userId) {
    return () => {};
  }

  // 👈 2. Yahaan 'await' jodein
  const unsubscribe = await pb.collection('friend_requests').subscribe('*', (e) => {
    
    if (e.record.to_user === userId || e.record.from_user === userId) {
      callback();
    }
  });

  // 👈 3. Ab yeh asli 'unsubscribe' function return karega
  return unsubscribe;
};