import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="container">
        <h1>Uncle Jerry's Blueprint Analyzer</h1>
        <nav className="main-nav">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/projects">My Projects</a></li>
            <li><a href="/help">Help</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
