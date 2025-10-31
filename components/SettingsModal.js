// components/SettingsModal.js (FINAL FIXED VERSION)

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { updateUserProfile, uploadAvatar } from '@/lib/pocketbase';
import UserAvatar from './UserAvatar';

export default function SettingsModal({ isOpen, onClose, currentUser, onUserUpdate, onLogout, onNotification }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(currentUser?.name || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [chatTheme, setChatTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chatThemeValue') || 'indigo';
    }
    return 'indigo';
  });

  const themes = [
    { name: 'Indigo', value: 'indigo', color: 'bg-indigo-600', hex: '#4f46e5' },
    { name: 'Blue', value: 'blue', color: 'bg-blue-600', hex: '#2563eb' },
    { name: 'Purple', value: 'purple', color: 'bg-purple-600', hex: '#9333ea' },
    { name: 'Pink', value: 'pink', color: 'bg-pink-600', hex: '#db2777' },
    { name: 'Green', value: 'green', color: 'bg-green-600', hex: '#16a34a' },
    { name: 'Red', value: 'red', color: 'bg-red-600', hex: '#dc2626' },
    { name: 'Orange', value: 'orange', color: 'bg-orange-600', hex: '#ea580c' },
    { name: 'Teal', value: 'teal', color: 'bg-teal-600', hex: '#0d9488' },
  ];
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
  // 🟩 Avatar Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onNotification?.('File too large (max 2MB)', 'error');
      return;
    }
    setUploading(true);
    try {
      const updatedUser = await uploadAvatar(currentUser.id, file);
      if (updatedUser) {
        onUserUpdate(updatedUser);
        onNotification?.('Avatar updated successfully!', 'success');
      } else {
        onNotification?.('Failed to update avatar', 'error');
      }
    } catch (error) {
      console.error(error);
      onNotification?.('Error uploading avatar', 'error');
    } finally {
      setUploading(false);
    }
  };

  // 🟩 Name Update
  const handleNameChange = async () => {
    if (!name.trim() || name === currentUser?.name) return;
    setSaving(true);
    try {
      const updatedUser = await updateUserProfile(currentUser.id, { name });
      if (updatedUser) {
        onUserUpdate(updatedUser);
        onNotification?.('Name updated successfully!', 'success');
      } else {
        onNotification?.('Failed to update name', 'error');
      }
    } catch (error) {
      console.error(error);
      onNotification?.('Error updating name', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDarkModeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    onNotification?.(`Dark mode ${newTheme === 'dark' ? 'enabled' : 'disabled'}`, 'success');
  };

  // 🟩 Chat Theme Change (Immediate apply)
  const handleThemeChange = (themeValue) => {
  const selectedTheme = themes.find(t => t.value === themeValue);
  if (!selectedTheme) return;

  document.documentElement.style.setProperty('--primary', selectedTheme.hex);

  // हल्का transparent background बनाओ (chat background के लिए)
  const chatBg = hexToRgba(selectedTheme.hex, 0.08);
  document.documentElement.style.setProperty('--chat-bg', chatBg);

  localStorage.setItem('chatThemeValue', themeValue);
  localStorage.setItem('chatThemeHex', selectedTheme.hex);
  localStorage.setItem('chatBg', chatBg);

  setChatTheme(themeValue);
  onNotification?.(`Theme changed to ${selectedTheme.name}`, 'success');
};

  const handleClose = () => {
    setName(currentUser?.name || '');
    setActiveTab('profile');
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
<div
  className="
    bg-white/30 dark:bg-gray-600/30
    backdrop-blur-md
    border border-white/20 dark:border-gray-700/30
    rounded-2xl shadow-2xl
    w-full max-w-md sm:max-w-2xl
    mx-2 sm:mx-4
    max-h-[90vh]
    flex flex-col overflow-hidden
  "
>
        {/* Header */}
        <div className="p-6  flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Settings</h2>
          <button onClick={handleClose} className="p-2 hover:bg-bg-subtle rounded-lg transition">
            <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6">
          {['profile', 'appearance', 'account'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium transition border-b-2 ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Profile Picture</h3>
                <div className="flex items-center space-x-6">
                  <UserAvatar name={currentUser?.name} user={currentUser} size="lg" />
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Change Avatar'}
                    </button>
                    <p className="text-sm text-text-muted mt-2">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Display Name</h3>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="flex-1 px-4 py-2 border border-border-color bg-bg-subtle text-foreground rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleNameChange}
                    disabled={saving || !name.trim() || name === currentUser?.name}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Email */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Email</h3>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-border-color rounded-lg bg-bg-subtle text-text-muted cursor-not-allowed"
                />
                <p className="text-sm text-text-muted mt-2">Email cannot be changed</p>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Dark Mode */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Dark Mode</h3>
                <div className="flex items-center justify-between p-4 bg-bg-subtle rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Enable Dark Mode</p>
                    <p className="text-sm text-text-muted">Use dark theme across the app</p>
                  </div>
                  <button
                    onClick={handleDarkModeToggle}
                    className={`relative w-14 h-8 rounded-full transition ${
                      theme === 'dark' ? 'bg-primary' : 'bg-border-color'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-background rounded-full transition transform ${
                        theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Chat Theme */}
              <div>
  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 text-center sm:text-left">
    Chat Theme
  </h3>
  <p className="text-xs sm:text-sm  mb-4 text-center sm:text-left">
    Choose your preferred chat bubble color
  </p>

  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 justify-items-center sm:justify-items-start">
    {themes.map((t) => (
      <button
        key={t.value}
        onClick={() => handleThemeChange(t.value)}
        className={`
          flex flex-col items-center justify-center
          h-16 w-16 sm:h-20 sm:w-20
          rounded-xl border-2 transition-all duration-200
          text-center
          backdrop-blur-md
          bg-white/25 dark:bg-white/10
          hover:bg-white/30 dark:hover:bg-white/20
          active:scale-95
          ${
            chatTheme === t.value
              ? 'border-primary shadow-[0_0_12px_rgba(59,130,246,0.5)]'
              : 'border-border-color hover:border-primary/50'
          }
        `}
      >
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full mb-1 sm:mb-2 ${t.color}`}
        ></div>
        <p className="text-[11px] sm:text-sm font-medium text-foreground leading-tight">
          {t.name}
        </p>
      </button>
    ))}
  </div>
</div>

            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Logout</h3>
                <p className="text-sm text-red-700 mb-4">
                  You will be logged out of your account and redirected to the login page.
                </p>
                <button
                  onClick={() => {
                    handleClose();
                    onLogout?.();
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Logout
                </button>
              </div>

              <div className="bg-bg-subtle rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Account Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-text-muted">User ID</p>
                    <p className="text-sm text-foreground font-mono">{currentUser?.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-muted">Account Created</p>
                    <p className="text-sm text-foreground">
                      {currentUser?.created ? new Date(currentUser.created).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
