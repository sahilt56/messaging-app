import { getAvatarUrl } from '@/lib/pocketbase';

// --- Helper Functions (Component ke bahar) ---

/**
 * Naam se 'Initials' nikalta hai (Jaise "Sahil Kumar" -> "SK")
 */
const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  
  const names = name.trim().split(' ').filter(Boolean); // "Sahil Kumar" -> ["Sahil", "Kumar"]
  if (names.length === 0) return '?';

  const firstInitial = names[0][0]; // 'S'
  
  // Aakhri naam ka pehla akshar (agar hai)
  const lastInitial = names.length > 1 ? names[names.length - 1][0] : ''; // 'K'
  
  return (firstInitial + lastInitial).toUpperCase(); // 'SK'
};

/**
 * Naam se ek consistent color generate karta hai
 */
const getColor = (name) => {
  if (!name) return 'bg-gray-400';
  
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// --- Aapke Size Classes (Aapke file se) ---
const sizeClasses = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-20 h-20 text-2xl',
};

const onlineDotSizes = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
  xl: 'w-5 h-5',
};

// --- Mukhya Component ---
export default function UserAvatar({ user, name, size = 'md', online = false }) {
  
  // 1. Zaroori data nikaalein
  const avatarUrl = user ? getAvatarUrl(user) : null;
  const displayName = name || user?.name || 'Unknown User'; // 'name' prop ko override ke roop mein istemaal karein
  const initials = getInitials(displayName);
  const color = getColor(displayName);

  // 2. Sahi size classes chunein
  const currentSize = sizeClasses[size] || sizeClasses['md'];
  const currentOnlineDotSize = onlineDotSizes[size] || onlineDotSizes['md'];

  return (
    <div className={`relative inline-block flex-shrink-0 ${currentSize}`}>
      
      {avatarUrl ? (
        // Agar 'avatarUrl' hai, to image dikhayein
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full rounded-full object-cover border-2 border-gray-200"
        />
      ) : (
        // Agar 'avatarUrl' NAHIN hai, to 'Initials' dikhayein
        <div
          className={`w-full h-full ${color} rounded-full flex items-center justify-center text-white font-semibold`}
        >
          {initials}
        </div>
      )}
      
      {/* Online status indicator */}
      {online && (
        <div 
          className={`${currentOnlineDotSize} bg-green-500 border-2 border-white rounded-full absolute bottom-0 right-0 shadow-sm`}
          title="Online"
        ></div>
      )}
    </div>
  );
}