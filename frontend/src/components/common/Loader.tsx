import React from 'react';

interface LoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const Loader: React.FC<LoaderProps> = ({ 
  message = 'Loading...', 
  size = 'medium' 
}) => {
  return (
    <div className={`loader-container loader-${size}`} aria-busy="true">
      <div className="loader-spinner" aria-hidden="true"></div>
      {message && <p className="loader-message">{message}</p>}
    </div>
  );
};

export default Loader;
