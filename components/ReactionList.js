// components/ReactionList.js - WhatsApp Style Themed Pill

const groupReactions = (reactions) => {
  const grouped = {};
  if (!reactions || !Array.isArray(reactions)) return [];

  reactions.forEach(r => {
    const emoji = r.emoji;
    if (!emoji) return;

    if (!grouped[emoji]) {
      grouped[emoji] = { count: 0, users: [], userIds: [] };
    }

    grouped[emoji].count += 1;
    const userName = r.expand?.user?.name || 'Unknown';
    const userId = r.user;
    grouped[emoji].users.push(userName);
    grouped[emoji].userIds.push(userId);
  });

  return Object.entries(grouped).map(([emoji, data]) => ({
    emoji,
    count: data.count,
    names: data.users.join(', '),
    userIds: data.userIds
  }));
};

export default function ReactionList({ reactions, currentUserId, onEmojiSelect }) {
  const grouped = groupReactions(reactions);
  if (grouped.length === 0) return null;

  const hasCurrentUserReacted = grouped.some(group =>
    group.userIds.includes(currentUserId)
  );

  const totalCount = grouped.reduce((sum, group) => sum + group.count, 0);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
      }}
      title={grouped.map(g => `${g.emoji} ${g.names}`).join('\n')}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full shadow-sm transition cursor-pointer z-[10000]
        ${hasCurrentUserReacted
          ? 'bg-primary/20 border border-primary text-primary'
          : 'bg-bg-subtle border border-border-color text-foreground hover:bg-border-color/40'
        }`}
    >
      {/* First 3 emojis only */}
      {grouped.slice(0, 3).map((group, index) => (
        <span key={index} className="text-base leading-none">
          {group.emoji}
        </span>
      ))}

      {/* Count */}
      <span className="text-xs font-semibold leading-none">
        {totalCount}
      </span>
    </button>
  );
}
