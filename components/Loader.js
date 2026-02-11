import React from 'react';

// 1. 'animation' ko default type set karein
export default function Loader({ loaderType = 'animation' }) {

  // 2. Agar type 'video' hai
  if (loaderType === 'video') {
    return (
      <div className="loader-overlay">
        <video
          autoPlay
          muted
          loop
          src="/Welcome1.mp4" // 👈 Public folder mein video file
          className="loader-video"
        />
      </div>
    );
  }

  // 3. Agar type 'image' (ya GIF) hai
  if (loaderType === 'image') {
    return (
      <div className="loader-overlay">
        <img
          src="/loading-animation.gif" // 👈 Public folder mein GIF file
          alt="Loading..."
          className="loader-image"
        />
      </div>
    );
  }

  // 4. Default: 'animation' (Aapka original CSS animation)
  return (
    <div className="loader-overlay">
      <div className="aurora-blob" />
      <div className="logo-text">
        Loading...
      </div>
    </div>
  );
}