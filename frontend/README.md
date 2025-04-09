# Uncle Jerry's Blueprint Analyzer

A web application for analyzing construction blueprints and generating material takeoffs, cost estimates, and labor calculations.

## Features

- Upload and analyze blueprint images
- Get material takeoffs and cost estimates for different construction trades
- Interactive interface with animated Uncle Jerry character
- Multi-page workflow for blueprint analysis
- Save and retrieve project estimates

## Getting Started

### Prerequisites

- Node.js (v16.x recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/uncle-jerry-blueprint-analyzer.git
   cd uncle-jerry-blueprint-analyzer/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the required environment variables (see ENV-CONFIG.md for details).

4. Start the development server:
   ```bash
   npm start
   ```

## Build for Production

To build the application for production:

```bash
npm run build
```

This will create a production-ready build in the `build` directory.

### OpenSSL Issue with Node.js 17+

If you encounter the following error when building:

```
Error: error:0308010C:digital envelope routines::unsupported
```

It means you're using Node.js 17+ which has changed the default OpenSSL provider. The application has been configured to handle this automatically by using the legacy provider when building.

To fix this issue manually on:

- Linux/macOS: 
  ```bash
  export NODE_OPTIONS=--openssl-legacy-provider
  npm run build
  ```

- Windows:
  ```cmd
  set NODE_OPTIONS=--openssl-legacy-provider
  npm run build
  ```

Alternatively, you can:
- Use Node.js 16.x instead
- Run `npm run build:windows` on Windows

## Environment Configuration

The application uses three environment files:

1. `.env` - Base variables for all environments
2. `.env.development` - Development-specific overrides
3. `.env.production` - Production-specific overrides

For detailed environment variable documentation, see [ENV-CONFIG.md](./ENV-CONFIG.md).

## Deployment

For deployment instructions, including how to deploy to DigitalOcean, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Bundle Optimization

The application has been optimized for production with:

- Code splitting via React.lazy for all trade components
- Route-level code splitting with Suspense
- Gzip compression of static assets
- Bundle analysis tools
- Tree-shaking optimizations

For detailed optimization strategies and performance improvements, see [BUNDLE-OPTIMIZATION.md](./BUNDLE-OPTIMIZATION.md).

## Technologies Used

- React.js
- TypeScript
- React Router
- Axios for API requests
- Code-splitting with React.lazy
- Suspense for improved loading states
- Claude AI integration

## Project Structure

- `/src/components` - React components
  - `/common` - Common UI components
  - `/trades` - Trade-specific components
  - `/UncleJerry` - Uncle Jerry character components
  - `/BlueprintUploader` - File upload components
  - `/AnalysisResults` - Analysis result display components
- `/src/services` - API services and integrations
- `/src/utils` - Utility functions
- `/src/types` - TypeScript type definitions
- `/src/contexts` - React Context providers

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Construction industry experts for domain knowledge
- Claude AI for blueprint analysis