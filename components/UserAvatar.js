import { getAvatarUrl } from '@/lib/pocketbase';

export default function UserAvatar({ name, user, avatar, size = 'md', online = false }) {
  // Get avatar URL from user object or avatar string
  const avatarUrl = user ? getAvatarUrl(user) : avatar;

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate color based on name
  const getColor = (name) => {
    if (!name) return 'bg-gray-400';
    
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

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

  return (
    <div className="relative inline-block">
      {avatarUrl ? (
        // Show uploaded avatar image
        <img
          src={avatarUrl}
          alt={name || 'User'}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200`}
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      {/* Fallback to initials - shown if no avatar or image load fails */}
      <div
        className={`${sizeClasses[size]} ${getColor(name)} rounded-full flex items-center justify-center text-white font-semibold ${avatarUrl ? 'hidden' : ''}`}
        style={avatarUrl ? { display: 'none' } : {}}
      >
        {getInitials(name)}
      </div>
      
      {/* Online status indicator */}
      {online && (
        <div 
          className={`${onlineDotSizes[size]} bg-green-500 border-2 border-white rounded-full absolute bottom-0 right-0 shadow-sm`}
          title="Online"
        ></div>
      )}
    </div>
  );
}