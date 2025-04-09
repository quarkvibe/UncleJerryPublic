# Contributing to Uncle Jerry Blueprint Analyzer

Thank you for considering contributing to the Uncle Jerry Blueprint Analyzer project! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:

1. Clear, descriptive title
2. Steps to reproduce the bug
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Environment details (browser, OS, etc.)

### Suggesting Features

For feature suggestions, create an issue with:

1. Clear, descriptive title
2. Detailed description of the proposed feature
3. Why this feature would be beneficial
4. Any relevant examples or mockups

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Test your changes thoroughly
5. Commit your changes (`git commit -m 'Add some feature'`)
6. Push to your branch (`git push origin feature/your-feature-name`)
7. Create a new Pull Request

## Development Setup

1. Clone the repository
   ```
   git clone https://github.com/your-username/uncle-jerry-blueprint-analyzer.git
   cd uncle-jerry-blueprint-analyzer
   ```

2. Install dependencies
   ```
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables
   ```
   cp .env.example .env
   # Edit .env to add your API keys and configuration
   ```

4. Start development servers
   ```
   # Start backend server
   cd backend
   npm start

   # In another terminal, start frontend server
   cd frontend
   npm start
   ```

## Project Structure

- `/frontend` - React frontend application
- `/backend` - Node.js Express backend server
- `/backend/src/services/trades` - Trade-specific analysis modules
- `/frontend/src/components/trades` - Trade-specific React components

## Adding a New Trade

1. Create a backend service in `backend/src/services/trades/your-trade.js`
2. Create a frontend component in `frontend/src/components/trades/your-trade.tsx`
3. Add the trade to the options in `frontend/src/components/BlueprintUploader/BlueprintUploader.tsx`
4. Add appropriate prompts in `backend/server.js` and `frontend/src/services/claudeApiService.ts`

## Code Style Guidelines

- Use consistent indentation (2 spaces)
- Follow naming conventions:
  - camelCase for variables and functions
  - PascalCase for classes and React components
  - snake_case for database fields
- Write meaningful commit messages that explain the "why" not just the "what"
- Comment complex logic
- Add JSDoc comments for functions

## Testing

- Write tests for new features when possible
- Ensure all existing tests pass before submitting a PR

## Documentation

- Update README.md if you make significant changes
- Document API endpoints
- Add comments to code where necessary

## License

By contributing to this project, you agree that your contributions will be licensed under the project's license.

Thank you for contributing to Uncle Jerry Blueprint Analyzer!