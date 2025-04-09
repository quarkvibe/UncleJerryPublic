import React, { useState, useEffect } from 'react';
import './styles.css';
import UncleJerrySVG from './UncleJerrySVG';

interface InteractionPoint {
  x: number;
  y: number;
  tooltip: string;
  onClick: () => void;
}

export interface UncleJerryProps {
  // Character state
  state: 'idle' | 'talking' | 'thinking' | 'excited' | 'pointing';
  
  // Content
  message?: string;
  
  // Interaction
  onMessageComplete?: () => void;
  interactionPoints?: InteractionPoint[];
  
  // User progress
  userProgress?: number;
  
  // Appearance
  size?: 'small' | 'medium' | 'large';
  position?: 'left' | 'right' | 'center';
}

const UncleJerry: React.FC<UncleJerryProps> = ({
  state = 'idle',
  message = '',
  onMessageComplete = () => {},
  interactionPoints = [],
  userProgress = 0,
  size = 'medium',
  position = 'right',
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Animated text effect
  useEffect(() => {
    if (!message) return;
    
    setIsSpeaking(true);
    let currentChar = 0;
    const messageInterval = setInterval(() => {
      setDisplayedMessage(message.substring(0, currentChar + 1));
      currentChar++;
      
      if (currentChar >= message.length) {
        clearInterval(messageInterval);
        setIsSpeaking(false);
        onMessageComplete();
      }
    }, 30);
    
    return () => clearInterval(messageInterval);
  }, [message, onMessageComplete]);
  
  // Get appropriate mood for state
  const getMood = () => {
    switch(state) {
      case 'talking': return 'explaining';
      case 'thinking': return 'thinking';
      case 'excited': return 'happy';
      case 'pointing': return 'explaining';
      default: return 'happy';
    }
  };
  
  // Helper function to get the appropriate CSS class based on state
  const getStateClass = () => {
    return `uncle-jerry--${state}`;
  };
  
  // Calculate progress bar width
  const getProgressWidth = () => {
    return `${userProgress}%`;
  };
  
  return (
    <div className={`uncle-jerry-container uncle-jerry--${size} uncle-jerry--${position}`}>
      <div className={`uncle-jerry ${getStateClass()}`}>
        <div className="uncle-jerry__character">
          <UncleJerrySVG mood={getMood()} />
          
          {/* Interaction points */}
          {interactionPoints && interactionPoints.map((point, index) => (
            <div 
              key={`interaction-${index}`}
              className="interaction-point"
              style={{ 
                left: `${point.x}px`, 
                top: `${point.y}px` 
              }}
              onClick={point.onClick}
              title={point.tooltip}
            >
              <span className="interaction-dot"></span>
              <div className="tooltip">{point.tooltip}</div>
            </div>
          ))}
        </div>
        
        <div className="uncle-jerry__speech-bubble">
          <p>{displayedMessage}</p>
          {isSpeaking && <span className="uncle-jerry__cursor">|</span>}
        </div>
        
        {userProgress > 0 && (
          <div className="progress-container">
            <div className="progress-bar" style={{ width: getProgressWidth() }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UncleJerry;