import React, { useState, useEffect } from 'react';

export default function WelcomeScreen({ onGetStarted }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef(null);

  // Different message sets for each slide
  const slides = [
    {
      messages: [
        { type: 'voice', time: '13:56', emoji: '👋' },
        { type: 'text', content: "Let's go Shri 🥰", from: 'other' },
        { type: 'text', content: "I am on my way Sahil! 🏃", from: 'me', time: '10:21' }
      ]
    },
    {
      messages: [
        { type: 'text', content: "Hey! How are you? 😊", from: 'other' },
        { type: 'text', content: "I'm doing great! Thanks! 🎉", from: 'me', time: '14:32' },
        { type: 'text', content: "That's awesome! 💪", from: 'other' }
      ]
    },
    {
      messages: [
        { type: 'text', content: "Dinner tonight? 🍕", from: 'other' },
        { type: 'text', content: "Sure! What time? ⏰", from: 'me', time: '16:45' },
        { type: 'text', content: "7 PM works? 🕖", from: 'other' }
      ]
    }
  ];

  useEffect(() => {
    // Auto slide change every 4 seconds
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const handleGetStarted = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    onGetStarted();
  };

  const togglePlay = () => {
    if (audioRef.current) { // Ensure audioRef.current exists
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(err => {
            console.log('Play failed:', err);
            setIsPlaying(false);
          });
      }
    }
  };

  const currentMessages = slides[currentSlide].messages;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-500 to-purple-600 flex flex-col items-center justify-between p-6 text-white overflow-hidden">
      <audio
        ref={audioRef}
        src="/welcom.mp3"
        loop
      />
      {/* Chat Preview */}
      <div className="flex-1 flex items-center justify-center w-full max-w-sm">
        <div className="space-y-4 w-full relative">
          {currentMessages.map((msg, index) => (
            <div
              key={`${currentSlide}-${index}`}
              className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'} transform transition-all duration-700 translate-x-0 opacity-100`}
              style={{ transitionDelay: `${300 + index * 200}ms` }}
            >
              {msg.type === 'voice' ? (
                // Voice Message
                <div className="bg-purple-400 bg-opacity-40 rounded-2xl rounded-tr-sm p-4 max-w-xs relative animate-float">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 h-1 bg-white bg-opacity-50 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-white rounded-full animate-pulse-wave"></div>
                    </div>
                    <span className="text-xs">0:08</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full overflow-hidden border-2 border-white animate-bounce-subtle">
                    <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center text-lg">
                      {msg.emoji}
                    </div>
                  </div>
                  <div className="text-xs text-right mt-1 opacity-75">{msg.time} ✓✓</div>
                </div>
              ) : msg.from === 'other' ? (
                // Message from other person
                <div className="flex items-end gap-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex-shrink-0 animate-pulse-slow">
                    <div className="w-full h-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-xl">
                      🎭
                    </div>
                  </div>
                  <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 max-w-xs animate-float-delayed">
                    <div className="font-medium">{msg.content}</div>
                  </div>
                </div>
              ) : (
                // Message from me
                <div className="bg-purple-400 bg-opacity-40 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs animate-float-more">
                  <div>{msg.content}</div>
                  {msg.time && <div className="text-xs text-right mt-1 opacity-75">{msg.time} ✓✓</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Animated Dots Indicator */}
      <div className="flex gap-2 mb-6 transition-all duration-500 delay-900">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all duration-500 ${
              currentSlide === index
                ? 'w-8 bg-white animate-pulse'
                : 'w-2 bg-white bg-opacity-40 hover:bg-opacity-60'
            }`}
            onClick={() => setCurrentSlide(index)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </div>

      {/* Bottom Section - Slide up */}
      <div className="w-full max-w-sm space-y-6 transform transition-all duration-700 delay-1000 translate-y-0 opacity-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-3">
            Ultimate Platform for Seamless Messaging and Connected Conversations!
          </h1>
        </div>

        <button
          onClick={handleGetStarted}
          className="w-full bg-white text-indigo-600 py-4 rounded-xl font-bold text-lg hover:bg-opacity-90 hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-2xl animate-button-pulse"
        >
          Get Started
        </button>
      </div>

      {/* Voice Note Card - Top Center */}
      <div className="w-full max-w-sm mt-8 relative"> {/* यहाँ 'relative' क्लास जोड़ी गई है */}
        {!isPlaying && ( // 👈 यहाँ नया कोड शुरू होता है
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap z-10">
            You have a voice note! from Devloper 🙌
          </div>
        )} {/* नया कोड यहाँ खत्म होता है */}

        <div
          onClick={togglePlay}
          style={{ cursor: 'pointer' }}
          className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-4 shadow-lg animate-float"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg className={`w-6 h-6 text-indigo-600 ${isPlaying ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">Welcome Message 🎉</span>
              </div>
              <div className="h-1.5 bg-white bg-opacity-30 rounded-full overflow-hidden">
                <div className={`h-full bg-white rounded-full transition-all ${isPlaying ? 'animate-pulse-wave w-1/2' : 'w-0'}`}></div>
              </div>
              <div className="text-xs mt-1 opacity-80">Thank you for choosing our Messaging App!</div>
            </div>
            <div className="text-2xl animate-bounce-subtle">🎵</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes floatDelayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes floatMore {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        @keyframes bounceSubtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes pulseWave {
          0% { width: 10%; }
          50% { width: 60%; }
          100% { width: 10%; }
        }

        @keyframes pulseSlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        @keyframes textGlow {
          0%, 100% { text-shadow: 0 0 10px rgba(255,255,255,0.3); }
          50% { text-shadow: 0 0 20px rgba(255,255,255,0.6); }
        }

        @keyframes buttonPulse {
          0%, 100% { box-shadow: 0 10px 25px rgba(255,255,255,0.3); }
          50% { box-shadow: 0 15px 35px rgba(255,255,255,0.5); }
        }
        
        @keyframes bubblePop { /* नया एनिमेशन! */
          0%, 100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -5px) scale(1.05); opacity: 0.9; }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: floatDelayed 3.5s ease-in-out infinite;
          animation-delay: 0.3s;
        }

        .animate-float-more {
          animation: floatMore 3.2s ease-in-out infinite;
          animation-delay: 0.6s;
        }

        .animate-bounce-subtle {
          animation: bounceSubtle 2s ease-in-out infinite;
        }

        .animate-pulse-wave {
          animation: pulseWave 2s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulseSlow 3s ease-in-out infinite;
        }

        .animate-text-glow {
          animation: textGlow 3s ease-in-out infinite;
        }

        .animate-button-pulse {
          animation: buttonPulse 2s ease-in-out infinite;
        }

        .animate-bubble-pop { /* नया एनिमेशन लागू किया गया */
          animation: bubblePop 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}