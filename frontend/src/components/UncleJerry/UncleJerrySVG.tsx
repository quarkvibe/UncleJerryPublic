import React from 'react';

interface UncleJerrySVGProps {
  mood?: 'happy' | 'thinking' | 'explaining' | 'surprised';
  className?: string;
}

const UncleJerrySVG: React.FC<UncleJerrySVGProps> = ({ mood = 'happy', className = '' }) => {
  // Eyes slight variations based on mood
  const renderEyes = () => {
    switch (mood) {
      case 'thinking':
        return (
          <>
            <path d="M295 310c-1.5 0-2.5-1-2.5-2.5 0-8 6.5-14.5 14.5-14.5 1.5 0 2.5 1 2.5 2.5s-1 2.5-2.5 2.5c-5 0-9.5 4.5-9.5 9.5 0 1.5-1 2.5-2.5 2.5z" fill="#000" />
            <path d="M380 310c-1.5 0-2.5-1-2.5-2.5 0-5-4.5-9.5-9.5-9.5-1.5 0-2.5-1-2.5-2.5s1-2.5 2.5-2.5c8 0 14.5 6.5 14.5 14.5 0 1.5-1 2.5-2.5 2.5z" fill="#000" />
          </>
        );
      case 'surprised':
        return (
          <>
            <ellipse cx="310" cy="310" rx="10" ry="12" fill="#000" />
            <ellipse cx="365" cy="310" rx="10" ry="12" fill="#000" />
          </>
        );
      case 'explaining':
        return (
          <>
            <path d="M315 310c0 5.5-4.5 10-10 10s-10-4.5-10-10 4.5-10 10-10 10 4.5 10 10z" fill="#000" />
            <path d="M375 310c0 5.5-4.5 10-10 10s-10-4.5-10-10 4.5-10 10-10 10 4.5 10 10z" fill="#000" />
          </>
        );
      default: // happy
        return (
          <>
            <path d="M315 310c0 5.5-4.5 10-10 10s-10-4.5-10-10 4.5-10 10-10 10 4.5 10 10z" fill="#000" />
            <path d="M375 310c0 5.5-4.5 10-10 10s-10-4.5-10-10 4.5-10 10-10 10 4.5 10 10z" fill="#000" />
          </>
        );
    }
  };

  // Mouth variations based on mood
  const renderMouth = () => {
    switch (mood) {
      case 'thinking':
        return (
          <path d="M320 380c0 0 15 5 30 0" stroke="#000" strokeWidth="3" fill="none" />
        );
      case 'surprised':
        return (
          <ellipse cx="335" cy="380" rx="15" ry="10" fill="#000" />
        );
      case 'explaining':
        return (
          <path d="M320 380c0 0 10 10 30 0" stroke="#000" strokeWidth="3" fill="none" />
        );
      default: // happy
        return (
          <path d="M320 380c0 0 15 10 30 0" stroke="#000" strokeWidth="3" fill="none" />
        );
    }
  };

  return (
    <svg 
      viewBox="0 0 600 800" 
      xmlns="http://www.w3.org/2000/svg"
      className={`uncle-jerry-svg ${className}`}
    >
      {/* Background */}
      <rect width="600" height="800" fill="#f5e8d0" />
      
      {/* Head */}
      <ellipse cx="340" cy="300" rx="140" ry="160" fill="#e9b587" />
      
      {/* Hair on sides */}
      <path d="M220 280c-10-40 0-100 20-130 10 40 0 90-20 130z" fill="#5e3a1c" />
      <path d="M220 280c-5 10-10 30-10 50 0 20 5 40 10 50 10-30 10-70 0-100z" fill="#5e3a1c" />
      
      {/* Ears */}
      <ellipse cx="200" cy="310" rx="20" ry="30" fill="#e9b587" />
      <ellipse cx="480" cy="310" rx="20" ry="30" fill="#e9b587" />
      
      {/* Eyebrows */}
      <path d="M280 280c10-5 30-5 40 0" stroke="#000" strokeWidth="3" fill="none" />
      <path d="M340 280c10-5 30-5 40 0" stroke="#000" strokeWidth="3" fill="none" />
      
      {/* Face lines */}
      <path d="M280 250c20 0 40 0 60 0" stroke="#000" strokeWidth="1" fill="none" />
      <path d="M260 230c40 0 80 0 120 0" stroke="#000" strokeWidth="1" fill="none" />
      
      {/* Eyes - dynamic based on mood */}
      {renderEyes()}
      
      {/* Nose */}
      <path d="M335 330c10 10 20 20 10 30" stroke="#000" strokeWidth="2" fill="none" />
      
      {/* Mustache */}
      <path d="M300 360c20 10 50 10 70 0" fill="#5e3a1c" />
      
      {/* Mouth - dynamic based on mood */}
      {renderMouth()}
      
      {/* Neck */}
      <rect x="300" y="450" width="80" height="50" fill="#e9b587" />
      
      {/* Shirt */}
      <rect x="200" y="500" width="280" height="300" fill="#d6bc8a" />
      <path d="M200 500l-50 100h380l-50-100z" fill="#d6bc8a" />
      
      {/* Shirt collar */}
      <path d="M300 500l-40 80h160l-40-80z" fill="#d6bc8a" stroke="#000" strokeWidth="2" />
      <path d="M300 500l-20 80" stroke="#000" strokeWidth="1" fill="none" />
      <path d="M380 500l20 80" stroke="#000" strokeWidth="1" fill="none" />
      
      {/* Shirt pocket */}
      <rect x="400" y="550" width="40" height="50" stroke="#000" strokeWidth="1" fill="none" />
      
      {/* Shirt lines */}
      <path d="M250 600c50 20 100 20 150 0" stroke="#000" strokeWidth="1" fill="none" />
      <path d="M220 650c80 30 160 30 240 0" stroke="#000" strokeWidth="1" fill="none" />
      
      {/* Buttons */}
      <circle cx="340" cy="550" r="10" fill="#d6bc8a" stroke="#000" strokeWidth="1" />
      <circle cx="340" cy="600" r="10" fill="#d6bc8a" stroke="#000" strokeWidth="1" />
      <circle cx="340" cy="650" r="10" fill="#d6bc8a" stroke="#000" strokeWidth="1" />
    </svg>
  );
};

export default UncleJerrySVG;