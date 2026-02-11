'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import pb from '@/lib/pocketbase';
function isValidUsername(username) {
  const regex = /^[a-z0-9_]{3,15}$/;
  return regex.test(username);
}

export default function CompleteProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 💡 फिक्स 1: लेज़ी इनिशियलाइज़ेशन
  const [user, setUser] = useState(() => {
    return pb.authStore.isValid ? pb.authStore.model : null;
  });
  
  // username की state को यूज़र के नाम (अगर हो तो) से शुरू करें
  const [username, setUsername] = useState(user?.name.replace(/\s+/g, '_').toLowerCase() || '');

  // 💡 फिक्स 1 (जारी): useEffect अब सिर्फ़ रीडायरेक्ट करता है
  useEffect(() => {
    if (!user) {
      router.push('/'); // Agar logged in nahin, to login page par bhej dein
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (username.length < 3) {
      setError('Username must be at least 3 characters long.');
      setLoading(false);
      return;
    }
    const cleanUsername = username.toLowerCase();   

    if (!isValidUsername(cleanUsername)) {
      setError('Username must be 3-15 characters long and can only contain lowercase letters, numbers, and underscores (_).');
      setLoading(false);
      return;
    }
    // 👈 === NAYA STEP: Username ki uplabdhata jaanchein ===
    const available = await isUsernameAvailable(cleanUsername);
    if (!available) {
      setError('This username is already taken. Please try another.');
      setLoading(false);
      return;
    }
    
    try {
      // Logged in user ka username update karein
      await pb.collection('users').update(user.id, {
        username: cleanUsername,
      });
      
      // Safalta! Ab chat page par bhej dein
      router.push('/chat');

    } catch (err) { // 💡 फिक्स 2: 'err' का इस्तेमाल करें
      if (err.response?.data?.data?.username) {
        setError('This username is already taken. Please try another.');
      } else {
        setError('An error occurred. Please try again.');
        console.error(err); // असली एरर को कंसोल में लॉग करें
      }
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Loading... या एक लोडर कंपोनेंट दिखाएँ
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Set Your Username</h2>
        <p className="text-center text-gray-600 mb-6">
          Welcome, {user.name}! Choose a unique username to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg"
              placeholder="your_unique_username"
              required
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold mt-6 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save and Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}