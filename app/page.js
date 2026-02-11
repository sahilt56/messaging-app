'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, signup, resetPassword, isUsernameAvailable } from '@/lib/pocketbase';
import pb from '@/lib/pocketbase';
import WelcomeScreen from '@/components/WelcomeScreen';
import Loader from '@/components/Loader';

function isValidUsername(username) {
  const regex = /^[a-z0-9_]{3,15}$/;
  return regex.test(username);
}

export default function AuthPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDesktopLoader, setShowDesktopLoader] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: '', // 👈 नया फ़ील्ड यहाँ जोड़े  ं
  });

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (mobile) {
        // मोबाइल: सिर्फ वेलकम स्क्रीन दिखाएँ
        setShowWelcome(true);
        setShowAuth(false);
        setShowDesktopLoader(false);
      } else {
        // डेस्कटॉप: पहले लोडर दिखाएँ, फिर 2.5 सेकंड बाद लॉगिन फॉर्म
        setShowWelcome(false);
        setShowAuth(false);
        setShowDesktopLoader(true); // 👈 लोडर दिखाएँ

        // 2.5 सेकंड बाद (एनीमेशन के लिए), लोडर छिपाएँ और Auth फॉर्म दिखाएँ
        setTimeout(() => {
          setShowDesktopLoader(false);
          setShowAuth(true);
        }, 5000); // 2.5 सेकंड (इसे अपने CSS एनीमेशन जितना लंबा रखें)
      }
    };
    
    // यह सिर्फ एक बार पेज लोड होने पर चलना चाहिए
    checkMobile();
    
  }, []); // 👈 खाली array (ताकि यह सिर्फ एक बार चले)

  // Handle Get Started click
  const handleGetStarted = () => {
    setShowWelcome(false);
    setTimeout(() => setShowAuth(true), 100);
  };

  // Password validation function
  const validatePassword = (password) => {
    const hasAlphabet = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    if (!isLongEnough) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasAlphabet) {
      return 'Password must contain at least one letter';
    }
    if (!hasNumber) {
      return 'Password must contain at least one number';
    }
    if (!hasSymbol) {
      return 'Password must contain at least one special character (!@#$%^&*...)';
    }
    return null;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      let result;
      
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        // Validate name
        if (!formData.name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        const cleanUsername = formData.username.toLowerCase(); // 👈 लोवरकेस करें

        // 👈 === NAYA STEP: Username ki uplabdhata jaanchein ===
        setLoading(true); // Yahaan se loading shuru karein
        setError('');

        if (!isValidUsername(cleanUsername)) {
          setError('Username must be 3-15 characters long and can only contain letters, numbers, and underscores (_).');
          setLoading(false);
          return;
        }
        const available = await isUsernameAvailable(cleanUsername);
        if (!available) {
          setError('This username is already taken.');
          setLoading(false);
          return;
        }
        if (!formData.username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }

        // Validate password
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          setError(passwordError);
          setLoading(false);
          return;
        }

        result = await signup(formData.email, formData.password, formData.name, cleanUsername); // 👈 साफ़ किया हुआ यूज़रनेम भेजें
      }

      if (result.success) {
        router.push('/chat');
      } else {
        setError(result.error || 'Something went wrong');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!formData.email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      const result = await resetPassword(formData.email);
      if (result.success) {
        setSuccessMessage('Password reset link has been sent to your email!');
        setTimeout(() => {
          setIsForgotPassword(false);
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OAuth2 Login Handlers
  // page.js

  const handleOAuthLogin = async (provider) => {
    try {
      setLoading(true);
      setError('');
      
      // 1. User ko Google se login karvayein
      const authData = await pb.collection('users').authWithOAuth2({ provider });
      
      // 2. ⚠️ Yahi hai zaroori check!
      // authData.meta.isNew batata hai ki user pehli baar login kar raha hai
      if (authData.meta.isNew) {
        
        // 3. Naya user! Use '/chat' par NAHIN bhejenge.
        // Use ek naye "Complete Profile" page par bhejenge.
        router.push('/complete-profile'); 
        
      } else {
        // 4. Purana user! Iske paas username hai. Seedhe '/chat' par bhejenge.
        router.push('/chat');
      }
      
    } catch (error) {
      console.error(`${provider} login error:`, error);
      setError(`Failed to login with ${provider}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // === रेंडर लॉजिक शुरू ===

  // 1. Show Welcome Screen (only on mobile)
  if (isMobile && showWelcome) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  // 2. Show Desktop Loader (only on desktop)
  if (!isMobile && showDesktopLoader) {
    // Video ke liye:
     return <Loader loaderType="video" />;

    // Image/GIF ke liye:
    // return <Loader loaderType="image" />;
    return <Loader />;
  }

  // 👈 3. सिर्फ तब Auth फॉर्म्स दिखाएँ जब showAuth true हो
  if (showAuth) {
    
    // 3a. Forgot Password View
    if (isForgotPassword) {
      return (
        <div className="min-h-screen md:bg-gradient-to-br md:from-blue-50 md:to-indigo-100 flex items-center justify-center">
          <div className="bg-white md:rounded-2xl md:shadow-xl w-full min-h-screen md:min-h-0 md:max-w-md p-6 md:p-8 flex flex-col justify-center">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
              <p className="text-gray-600">Enter your email to receive reset link</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 3b. Main Login/Signup View
    return (
      <div className="min-h-screen md:bg-gradient-to-br md:from-blue-50 md:to-indigo-100 flex items-center justify-center">
        <div className="bg-white md:rounded-2xl md:shadow-xl w-full min-h-screen md:min-h-0 md:max-w-md p-6 md:p-8 flex flex-col justify-center">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </h1>
            <p className="text-gray-600">
              {isLogin ? 'Login to continue messaging' : 'Sign up to start chatting'}
            </p>
          </div>

          {/* OAuth2 Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="Enter your name"
                  required={!isLogin}
                />
              </div>
            )}

            {/* === ⬇️ यह नया फ़ील्ड यहाँ जोड़ें === */}
  {!isLogin && (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
      <input
        type="text"
        name="username"
        value={formData.username}
        onChange={handleChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg ..."
        placeholder="Enter a unique @username"
        required={!isLogin}
      />
      <p className="mt-2 text-xs text-gray-500">
        (No spaces or special characters except _ )
      </p>
    </div>
  )}
  {/* === ⬆️ नया फ़ील्ड यहाँ खत्म होता है === */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Enter your password"
                required
                minLength={8}
              />
              {!isLogin && (
                <p className="mt-2 text-xs text-gray-500">
                  Password must contain letters, numbers, and special characters (!@#$%...)
                </p>
              )}
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ email: '', password: '', name: '',username: '' });
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 👈 4. जब तक कुछ दिखाने को न हो (जैसे मोबाइल पर 100ms ट्रांज़िशन), तब null दिखाएँ
  return null;
}