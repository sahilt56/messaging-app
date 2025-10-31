// components/ChatInfoModal.js
import UserAvatar from './UserAvatar'; // Assuming you have this component

export default function ChatInfoModal({ isOpen, onClose, conversation, currentUser }) {

  // Helper function to get the other participant
  const getOtherParticipant = () => {
    if (!conversation?.expand?.participants) return null;
    return conversation.expand.participants.find(p => p.id !== currentUser?.id);
  };

  const otherUser = getOtherParticipant();

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  if (!isOpen || !conversation) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Close on backdrop click
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center mb-5 border-b pb-3">
          <h2 className="text-xl font-bold text-gray-800">Chat Information</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <UserAvatar user={otherUser} size="lg" name={otherUser?.name || 'U'} />
            <div>
              <p className="font-semibold text-gray-900">{otherUser?.name || 'Unknown User'}</p>
              <p className="text-sm text-gray-500">{otherUser?.email || 'No email'}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Conversation ID:</p>
            <p className="text-gray-800 text-xs break-all">{conversation.id}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Created On:</p>
            <p className="text-gray-800">{formatDate(conversation.created)}</p>
          </div>

          {/* Optional: Add message count here if you implement fetching it */}
          {/* <div>
            <p className="text-sm font-medium text-gray-500">Total Messages:</p>
            <p className="text-gray-800">[Message Count]</p>
          </div> */}

        </div>
        <div className="mt-6 flex justify-end">
             <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
}