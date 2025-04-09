import React, { useEffect, useRef } from 'react';

interface UncleJerrySVGProps {
  mood?: 'happy' | 'thinking' | 'explaining' | 'surprised' | 'excited' | 'confused' | 'concerned' | 'approving';
  className?: string;
  isAnimated?: boolean;
  pointingDirection?: 'left' | 'right' | 'up' | 'down' | 'none';
}

const UncleJerrySVG: React.FC<UncleJerrySVGProps> = ({ 
  mood = 'happy', 
  className = '',
  isAnimated = true,
  pointingDirection = 'none'
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const eyeBlinkIntervalRef = useRef<number | null>(null);
  const breathingIntervalRef = useRef<number | null>(null);

  // Set up blinking animation
  useEffect(() => {
    if (!isAnimated) return;

    // Define eye blink animation
    const blinkEyes = () => {
      if (!svgRef.current) return;
      
      const leftEye = svgRef.current.querySelector('.left-eye');
      const rightEye = svgRef.current.querySelector('.right-eye');
      
      if (leftEye && rightEye) {
        // Close eyes
        leftEye.setAttribute('ry', '1');
        rightEye.setAttribute('ry', '1');
        
        // Open eyes after a short delay
        setTimeout(() => {
          if (leftEye && rightEye) {
            leftEye.setAttribute('ry', mood === 'surprised' ? '12' : '10');
            rightEye.setAttribute('ry', mood === 'surprised' ? '12' : '10');
          }
        }, 150);
      }
    };

    // Random blink interval
    const startBlinking = () => {
      if (eyeBlinkIntervalRef.current) {
        window.clearInterval(eyeBlinkIntervalRef.current);
      }
      
      // Blink every 3-8 seconds
      eyeBlinkIntervalRef.current = window.setInterval(() => {
        blinkEyes();
        
        // Reset the interval for variation
        window.clearInterval(eyeBlinkIntervalRef.current!);
        eyeBlinkIntervalRef.current = window.setInterval(blinkEyes, Math.random() * 5000 + 3000);
      }, Math.random() * 5000 + 3000);
    };

    startBlinking();

    // Cleanup
    return () => {
      if (eyeBlinkIntervalRef.current) {
        window.clearInterval(eyeBlinkIntervalRef.current);
      }
      if (breathingIntervalRef.current) {
        window.clearInterval(breathingIntervalRef.current);
      }
    };
  }, [isAnimated, mood]);

  // Eyes variations based on mood
  const renderEyes = () => {
    switch (mood) {
      case 'thinking':
        return (
          <>
            <ellipse className="left-eye" cx="310" cy="310" rx="10" ry="8" fill="#000" />
            <ellipse className="right-eye" cx="365" cy="310" rx="10" ry="8" fill="#000" />
            <path d="M290 280c0-5 10-10 15-5" stroke="#000" strokeWidth="2" fill="none" />
            <path d="M385 280c0-5-10-10-15-5" stroke="#000" strokeWidth="2" fill="none" />
          </>
        );
      case 'surprised':
        return (
          <>
            <ellipse className="left-eye" cx="310" cy="310" rx="12" ry="15" fill="#000" />
            <ellipse className="right-eye" cx="365" cy="310" rx="12" ry="15" fill="#000" />
            <path d="M280 270c10-10 30-10 40 0" stroke="#000" strokeWidth="3" fill="none" />
            <path d="M340 270c10-10 30-10 40 0" stroke="#000" strokeWidth="3" fill="none" />
          </>
        );
      case 'explaining':
        return (
          <>
            <ellipse className="left-eye" cx="310" cy="310" rx="10" ry="10" fill="#000" />
            <ellipse className="right-eye" cx="365" cy="310" rx="10" ry="10" fill="#000" />
            <circle cx="307" cy="307" r="3" fill="#fff" />
            <circle cx="362" cy="307" r="3" fill="#fff" />
          </>
        );
      case 'excited':
        return (
          <>
            <ellipse className="left-eye" cx="310" cy="310" rx="10" ry="10" fill="#000" />
            <ellipse className="right-eye" cx="365" cy="310" rx="10" ry="10" fill="#000" />
            <circle cx="307" cy="307" r="3" fill="#fff" />
            <circle cx="362" cy="307" r="3" fill="#fff" />
            <path className="sparkle left-sparkle" d="M290 295l5-10 5 10-5-10 10 5-10-5 10-5-10 5-5-10 5 10z" fill="#FFD700" />
            <path className="sparkle right-sparkle" d="M390 295l5-10 5 10-5-10 10 5-10-5 10-5-10 5-5-10 5 10z" fill="#FFD700" />
          </>
        );
      case 'confused':
        return (
          <>
            <ellipse className="left-eye" cx="310" cy="310" rx="10" ry="10" fill="#000" />
            <ellipse className="right-eye" cx="365" cy="310" rx="10" ry="10" fill="#000" />
            <path d="M280 270c0 0 10 15 40 5" stroke="#000" strokeWidth="3" fill="none" />
            <path d="M340 270c10-10 30-10 40 0" stroke="#000" strokeWidth="3" fill="none" />
          </>
        );
      case 'concerned':
        return (
          <>
            <ellipse className="left-eye" cx="310" cy="310" rx="10" ry="10" fill="#000" />
            <ellipse className="right-eye" cx="365" cy="310" rx="10" ry="10" fill="#000" />
            <path d="M280 280c10 5 30 5 40 0" stroke="#000" strokeWidth="3" fill="none" transform="rotate(180, 300, 280)" />
            <path d="M340 280c10 5 30 5 40 0" stroke="#000" strokeWidth="3" fill="none" transform="rotate(180, 360, 280)" />
          </>
        );
      case 'approving':
        return (
          <>
            <path className="left-eye" d="M300 310c0 0 10 10 20 0" stroke="#000" strokeWidth="3" fill="none" />
            <path className="right-eye" d="M355 310c0 0 10 10 20 0" stroke="#000" strokeWidth="3" fill="none" />
          </>
        );
      default: // happy
        return (
          <>
            <ellipse className="left-eye" cx="310" cy="310" rx="10" ry="10" fill="#000" />
            <ellipse className="right-eye" cx="365" cy="310" rx="10" ry="10" fill="#000" />
            <circle cx="307" cy="307" r="3" fill="#fff" />
            <circle cx="362" cy="307" r="3" fill="#fff" />
          </>
        );
    }
  };

  // Eyebrows based on mood
  const renderEyebrows = () => {
    switch (mood) {
      case 'thinking':
        return (
          <>
            <path d="M280 270c0 0 20-15 40 0" stroke="#000" strokeWidth="3" fill="none" />
            <path d="M340 260c10-5 30-5 40 10" stroke="#000" strokeWidth="3" fill="none" />
          </>
        );
      case 'surprised':
        return (
          <>
            <path d="M280 260c10-5 30-5 40 0" stroke="#000" strokeWidth="3" fill="none" />
            <path d="M340 260c10-5 30-5 40 0" stroke="#000" strokeWidth="3" fill="none" />
          </>
        );
      case 'confused':
        return (
          <>
            <path d="M280 270c0 0 20-5 40 10" stroke="#000" strokeWidth="3" fill="none" />
            <path d="M340 270c10-5 30-5 40 0" stroke="#000" strokeWidth="3" fill="none" />
          </>
        );
      case 'concerned':
        return (
          <>
            <path d="M280 260c10 10 30 10 40 0" stroke="#000" strokeWidth="3" fill="none" />
            <path d="M340 260c10 10 30 10 40 0" stroke="#000" strokeWidth="3" fill="none" />
          </>
        );
      default:
        return (
          <>
            <path className="eyebrow left-eyebrow" d="M280 280c10-5 30-5 40 0" stroke="#000" strokeWidth="3" fill="none" />
            <path className="eyebrow right-eyebrow" d="M340 280c10-5 30-5 40 0" stroke="#000" strokeWidth="3" fill="none" />
          </>
        );
    }
  };

  // Mouth variations based on mood
  const renderMouth = () => {
    switch (mood) {
      case 'thinking':
        return (
          <path className="mouth" d="M320 380c0 0 15 5 30 0" stroke="#000" strokeWidth="3" fill="none" />
        );
      case 'surprised':
        return (
          <ellipse className="mouth" cx="335" cy="380" rx="15" ry="10" fill="#000" />
        );
      case 'explaining':
        return (
          <path className="mouth talking-mouth" d="M320 380c0 0 10 10 30 0M325 375 v10 M340 375 v10 M355 375 v10" stroke="#000" strokeWidth="2" fill="none" />
        );
      case 'excited':
        return (
          <path className="mouth" d="M320 380c0 0 15 15 30 0" stroke="#000" strokeWidth="3" fill="none" />
        );
      case 'confused':
        return (
          <path className="mouth" d="M320 380c0 0 15 0 30 5" stroke="#000" strokeWidth="3" fill="none" />
        );
      case 'concerned':
        return (
          <path className="mouth" d="M320 385c0 0 15 -5 30 0" stroke="#000" strokeWidth="3" fill="none" />
        );
      case 'approving':
        return (
          <path className="mouth" d="M320 380c0 0 15 15 30 0" stroke="#000" strokeWidth="3" fill="none" />
        );
      default: // happy
        return (
          <path className="mouth" d="M320 380c0 0 15 10 30 0" stroke="#000" strokeWidth="3" fill="none" />
        );
    }
  };

  // Render arms based on pointing direction
  const renderArms = () => {
    switch (pointingDirection) {
      case 'left':
        return (
          <>
            <path className="right-arm" d="M380 550c20 20 40 30 60 30" stroke="#000" strokeWidth="2" fill="#d6bc8a" />
            <path className="left-arm pointing" d="M220 550c-30 0 -80 -60 -100 -100" stroke="#000" strokeWidth="2" fill="#d6bc8a" />
            <path className="pointing-finger" d="M120 450l-10 -10" stroke="#000" strokeWidth="2" fill="none" />
          </>
        );
      case 'right':
        return (
          <>
            <path className="left-arm" d="M220 550c-20 20 -40 30 -60 30" stroke="#000" strokeWidth="2" fill="#d6bc8a" />
            <path className="right-arm pointing" d="M380 550c30 0 80 -60 100 -100" stroke="#000" strokeWidth="2" fill="#d6bc8a" />
            <path className="pointing-finger" d="M480 450l10 -10" stroke="#000" strokeWidth="2" fill="none" />
          </>
        );
      case 'up':
        return (
          <>
            <path className="left-arm" d="M220 550c-20 20 -40 30 -60 30" stroke="#000" strokeWidth="2" fill="#d6bc8a" />
            <path className="right-arm pointing" d="M380 550c20 -60 0 -100 0 -120" stroke="#000" strokeWidth="2" fill="#d6bc8a" />
            <path className="pointing-finger" d="M380 430l10 -10" stroke="#000" strokeWidth="2" fill="none" />
          </>
        );
      case 'down':
        return (
          <>
            <path className="right-arm" d="M380 550c20 20 40 30 60 30" stroke="#000" strokeWidth="2" fill="#d6bc8a" />
            <path className="left-arm pointing" d="M220 550c0 60 20 100 0 140" stroke="#000" strokeWidth="2" fill="#d6bc8a" />
            <path className="pointing-finger" d="M220 690l-10 10" stroke="#000" strokeWidth="2" fill="none" />
          </>
        );
      default:
        return (
          <>
            <path className="left-arm" d="M220 550c-20 20 -40 30 -60 30" stroke="#000" strokeWidth="2" fill="#d6bc8a" />
            <path className="right-arm" d="M380 550c20 20 40 30 60 30" stroke="#000" strokeWidth="2" fill="#d6bc8a" />
          </>
        );
    }
  };

  // Hard hat based on mood (adds tools for explaining/thinking moods)
  const renderHardHat = () => {
    return (
      <>
        <ellipse cx="340" cy="230" rx="130" ry="70" fill="#f8d840" stroke="#000" strokeWidth="2" />
        <path d="M240 220h200" stroke="#000" strokeWidth="1" fill="none" />
        {mood === 'explaining' && (
          <path d="M400 190c10-10 20-10 30 0" stroke="#000" strokeWidth="2" fill="none" />
        )}
        {mood === 'thinking' && (
          <path d="M380 180c0 0 20-20 0-30" stroke="#000" strokeWidth="2" fill="none" />
        )}
      </>
    );
  };

  return (
    <svg 
      ref={svgRef}
      viewBox="0 0 600 800" 
      xmlns="http://www.w3.org/2000/svg"
      className={`uncle-jerry-svg ${className} mood-${mood}`}
    >
      {/* Background - semi-transparent */}
      <rect width="600" height="800" fill="none" />
      
      {/* Hard hat */}
      {renderHardHat()}
      
      {/* Head */}
      <ellipse className="head" cx="340" cy="300" rx="140" ry="160" fill="#e9b587" />
      
      {/* Hair on sides */}
      <path className="hair left-hair" d="M220 280c-10-40 0-100 20-130 10 40 0 90-20 130z" fill="#5e3a1c" />
      <path className="hair sideburn" d="M220 280c-5 10-10 30-10 50 0 20 5 40 10 50 10-30 10-70 0-100z" fill="#5e3a1c" />
      
      {/* Ears */}
      <ellipse className="ear left-ear" cx="200" cy="310" rx="20" ry="30" fill="#e9b587" />
      <ellipse className="ear right-ear" cx="480" cy="310" rx="20" ry="30" fill="#e9b587" />
      
      {/* Dynamic eyebrows based on mood */}
      {renderEyebrows()}
      
      {/* Face lines */}
      <path className="face-line" d="M280 250c20 0 40 0 60 0" stroke="#000" strokeWidth="1" fill="none" />
      <path className="face-line" d="M260 230c40 0 80 0 120 0" stroke="#000" strokeWidth="1" fill="none" />
      
      {/* Eyes - dynamic based on mood */}
      {renderEyes()}
      
      {/* Nose */}
      <path className="nose" d="M335 330c10 10 20 20 10 30" stroke="#000" strokeWidth="2" fill="none" />
      
      {/* Mustache */}
      <path className="mustache" d="M300 360c20 10 50 10 70 0" fill="#5e3a1c" />
      
      {/* Mouth - dynamic based on mood */}
      {renderMouth()}
      
      {/* Neck */}
      <rect className="neck" x="300" y="450" width="80" height="50" fill="#e9b587" />
      
      {/* Shirt */}
      <rect className="shirt" x="200" y="500" width="280" height="300" fill="#d6bc8a" />
      <path className="shirt-top" d="M200 500l-50 100h380l-50-100z" fill="#d6bc8a" />
      
      {/* Shirt collar */}
      <path className="collar" d="M300 500l-40 80h160l-40-80z" fill="#d6bc8a" stroke="#000" strokeWidth="2" />
      <path className="collar-line" d="M300 500l-20 80" stroke="#000" strokeWidth="1" fill="none" />
      <path className="collar-line" d="M380 500l20 80" stroke="#000" strokeWidth="1" fill="none" />
      
      {/* Tool belt */}
      <rect className="tool-belt" x="180" y="650" width="320" height="30" fill="#8B4513" stroke="#000" strokeWidth="2" />
      <rect className="belt-buckle" x="330" y="650" width="40" height="30" fill="#FFD700" stroke="#000" strokeWidth="1" />
      
      {/* Arms - changes based on pointing direction */}
      {renderArms()}
      
      {/* Shirt pocket with pencil */}
      <rect className="pocket" x="400" y="550" width="40" height="50" stroke="#000" strokeWidth="1" fill="none" />
      <path className="pencil" d="M410 555l0 40M430 555l0 40M410 565l20 0" stroke="#000" strokeWidth="1" fill="none" />
      
      {/* Name badge */}
      <rect className="name-badge" x="220" y="550" width="60" height="30" fill="#fff" stroke="#000" strokeWidth="1" rx="5" />
      <text className="badge-text" x="250" y="570" textAnchor="middle" fill="#000" fontSize="12" fontFamily="Arial, sans-serif">JERRY</text>
      
      {/* Tool pockets on belt */}
      <rect className="tool-pocket" x="220" y="650" width="30" height="40" fill="#8B4513" stroke="#000" strokeWidth="1" />
      <rect className="tool-pocket" x="420" y="650" width="30" height="40" fill="#8B4513" stroke="#000" strokeWidth="1" />
      
      {/* Ruler in pocket */}
      <rect className="ruler" x="425" y="655" width="20" height="5" fill="#FFD700" stroke="#000" strokeWidth="0.5" />
      <path className="ruler-marks" d="M425 655l0 5M430 655l0 5M435 655l0 5M440 655l0 5" stroke="#000" strokeWidth="0.5" />
      
      {/* Buttons */}
      <circle className="button" cx="340" cy="550" r="10" fill="#d6bc8a" stroke="#000" strokeWidth="1" />
      <circle className="button" cx="340" cy="600" r="10" fill="#d6bc8a" stroke="#000" strokeWidth="1" />
      <circle className="button" cx="340" cy="650" r="10" fill="#d6bc8a" stroke="#000" strokeWidth="1" />
    </svg>
  );
};

export default UncleJerrySVG;