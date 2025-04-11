import React, { useState, useEffect, useRef } from 'react';
import { UncleJerryProps, UncleJerryMood, SpeechEffect, QueuedMessage } from '../../types/components';
import './styles.css';
import UncleJerrySVG from './UncleJerrySVG';

const UncleJerry: React.FC<UncleJerryProps> = ({
  state = 'idle',
  message = '',
  messageEffect = 'normal',
  messageQueue = [],
  onMessageComplete = () => {},
  interactionPoints = [],
  onCharacterClick = () => {},
  userProgress = 0,
  size = 'medium',
  position = 'right',
  pointingDirection = 'none',
  typingSpeed = 30,
  isAnimated = true,
  ariaLabel = 'Character Uncle Jerry'
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [currentMessageEffect, setCurrentMessageEffect] = useState<SpeechEffect>(messageEffect);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentQueue, setCurrentQueue] = useState<QueuedMessage[]>([]);
  const characterRef = useRef<HTMLDivElement>(null);
  
  // Initialize the queue when the component mounts or when messageQueue changes
  useEffect(() => {
    if (messageQueue.length > 0) {
      setCurrentQueue([...messageQueue]);
    }
  }, [messageQueue]);
  
  // Process the queue
  useEffect(() => {
    if (currentQueue.length > 0 && !isSpeaking) {
      const nextMessage = currentQueue[0];
      setCurrentMessageEffect(nextMessage.effect || 'normal');
      displayMessage(nextMessage.content, nextMessage.duration || 0, () => {
        if (nextMessage.onComplete) {
          nextMessage.onComplete();
        }
        setCurrentQueue(prevQueue => prevQueue.slice(1));
      });
    }
  }, [currentQueue, isSpeaking]);
  
  // Animated text effect for a single message
  const displayMessage = (text: string, duration: number, callback: () => void) => {
    if (!text) {
      callback();
      return;
    }
    
    setIsSpeaking(true);
    let currentChar = 0;
    setDisplayedMessage('');
    
    const messageInterval = setInterval(() => {
      setDisplayedMessage(text.substring(0, currentChar + 1));
      currentChar++;
      
      if (currentChar >= text.length) {
        clearInterval(messageInterval);
        
        if (duration > 0) {
          // If a duration is specified, wait and then complete
          setTimeout(() => {
            setIsSpeaking(false);
            callback();
          }, duration);
        } else {
          setIsSpeaking(false);
          callback();
        }
      }
    }, typingSpeed);
    
    return () => clearInterval(messageInterval);
  };
  
  // Direct message display (outside of queue)
  useEffect(() => {
    if (message && currentQueue.length === 0) {
      setCurrentMessageEffect(messageEffect);
      displayMessage(message, 0, onMessageComplete);
    }
  }, [message, onMessageComplete, messageEffect]);
  
  // Add a wiggle effect when character state changes
  useEffect(() => {
    if (!isAnimated || !characterRef.current) return;
    
    if (state === 'excited' || state === 'pointing') {
      characterRef.current.classList.add('wiggle-animation');
      setTimeout(() => {
        if (characterRef.current) {
          characterRef.current.classList.remove('wiggle-animation');
        }
      }, 1000);
    }
  }, [state, isAnimated]);
  
  // Get appropriate mood for state
  const getMood = (): UncleJerryMood => {
    switch(state) {
      case 'talking': return 'explaining';
      case 'thinking': return 'thinking';
      case 'excited': return 'excited';
      case 'pointing': return 'explaining';
      case 'confused': return 'confused';
      case 'concerned': return 'concerned';
      case 'approving': return 'approving';
      default: return 'happy';
    }
  };
  
  // Helper function to get the appropriate CSS class based on state
  const getStateClass = () => {
    return `uncle-jerry--${state}`;
  };
  
  // Get speech bubble class based on effect
  const getSpeechBubbleClass = () => {
    switch(currentMessageEffect) {
      case 'thinking': return 'speech-bubble--thinking';
      case 'excited': return 'speech-bubble--excited';
      case 'warning': return 'speech-bubble--warning';
      case 'technical': return 'speech-bubble--technical';
      default: return '';
    }
  };
  
  // Calculate progress bar width
  const getProgressWidth = () => {
    return `${userProgress}%`;
  };
  
  return (
    <div 
      className={`uncle-jerry-container uncle-jerry--${size} uncle-jerry--${position}`}
      role="region"
      aria-label={ariaLabel}
    >
      <div className={`uncle-jerry ${getStateClass()}`}>
        <div 
          ref={characterRef}
          className="uncle-jerry__character"
          onClick={onCharacterClick}
          role="img"
          aria-label={`Uncle Jerry character in ${state} state`}
        >
          <UncleJerrySVG 
            mood={getMood()} 
            isAnimated={isAnimated}
            pointingDirection={pointingDirection}
          />
          
          {/* Interaction points */}
          {interactionPoints && interactionPoints.map((point, index) => (
            <div 
              key={`interaction-${index}`}
              className="interaction-point"
              style={{ 
                left: `${point.x}px`, 
                top: `${point.y}px` 
              }}
              onClick={(e) => {
                e.stopPropagation(); // Prevent character click
                point.onClick();
              }}
              title={point.tooltip}
              role="button"
              aria-label={point.tooltip}
              tabIndex={0}
            >
              <span className="interaction-dot"></span>
              <div className="tooltip">{point.tooltip}</div>
            </div>
          ))}
        </div>
        
        <div className={`uncle-jerry__speech-bubble ${getSpeechBubbleClass()}`}>
          <p aria-live="polite">{displayedMessage}</p>
          {isSpeaking && <span className="uncle-jerry__cursor">|</span>}
          
          {/* Skip button for long messages */}
          {(displayedMessage.length > 100 && isSpeaking) && (
            <button 
              className="skip-button"
              onClick={() => {
                setIsSpeaking(false);
                setDisplayedMessage(message);
                onMessageComplete();
              }}
              aria-label="Skip to end of message"
            >
              Skip
            </button>
          )}
        </div>
        
        {userProgress > 0 && (
          <div 
            className="progress-container" 
            role="progressbar"
            aria-valuenow={userProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress-bar" style={{ width: getProgressWidth() }}></div>
            <span className="progress-label">{userProgress}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UncleJerry;