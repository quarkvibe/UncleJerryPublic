# Environment Variable Configuration for Uncle Jerry Blueprint Analyzer

This document explains the environment variables used in the Uncle Jerry Blueprint Analyzer application and how to configure them for different environments.

## Overview

The application uses React's environment variable system, which requires variables to be prefixed with `REACT_APP_`. These variables are embedded during the build process and cannot be changed afterward without rebuilding the application.

## Configuration Files

The application uses three environment files:

1. `.env` - Base variables for all environments
2. `.env.development` - Development-specific overrides (when running `npm start`)
3. `.env.production` - Production-specific overrides (when running `npm run build`)

## Required Variables

These variables must be configured for the application to work properly:

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | URL to the backend API | `http://localhost:3001` (dev) or `https://your-domain.com/api` (prod) |

## Feature Flags

These variables enable or disable specific features:

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_ENABLE_CLAUDE_INTEGRATION` | Enables direct Claude API integration | `true` |
| `REACT_APP_ENABLE_MOCK_API` | Uses mock data instead of real API calls | `true` (dev), `false` (prod) |
| `REACT_APP_ENABLE_DEBUG_LOGS` | Outputs detailed logs to console | `true` (dev), `false` (prod) |
| `REACT_APP_DEMO_MODE` | Enables demo mode with pre-loaded examples | `true` (dev), `false` (prod) |

## Content Settings

These variables control content handling:

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_MAX_UPLOAD_SIZE_MB` | Maximum file upload size in MB | `15` |
| `REACT_APP_SUPPORTED_FILE_TYPES` | Comma-separated list of allowed MIME types | `image/jpeg,image/png,image/tiff,application/pdf` |
| `REACT_APP_MAX_BLUEPRINTS` | Maximum number of blueprints per project | `10` |

## Performance Settings

These variables affect application performance:

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_TIMEOUT_MS` | API request timeout in milliseconds | `30000` (dev), `60000` (prod) |
| `REACT_APP_CACHE_DURATION_MIN` | Cache duration in minutes | `15` (dev), `60` (prod) |

## Authentication Variables (Production Only)

Configure these for production authentication:

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_AUTH_DOMAIN` | Authentication provider domain | `your-domain.auth0.com` |
| `REACT_APP_AUTH_CLIENT_ID` | Client ID for authentication | `your-client-id` |

## Application Information

Information about the application version:

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_VERSION` | Application version | `$npm_package_version` (auto-populated) |
| `REACT_APP_BUILD_DATE` | Build timestamp | `$(date -u +'%Y-%m-%dT%H:%M:%SZ')` (auto-populated) |

## Custom Paths

Customize API endpoint paths:

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_BLUEPRINTS_PATH` | Blueprint API endpoint | `/blueprints` |
| `REACT_APP_API_PROJECTS_PATH` | Projects API endpoint | `/projects` |
| `REACT_APP_API_ANALYSIS_PATH` | Analysis API endpoint | `/analyze-blueprint` |
| `REACT_APP_API_CLAUDE_PATH` | Claude integration endpoint | `/claude` |

## Setup Instructions

1. Create all three files (`.env`, `.env.development`, `.env.production`) in your project root
2. Configure the required variables for each environment
3. Add environment-specific overrides in the appropriate files
4. For production deployment:
   - Ensure `.env.production` has the correct API URL and authentication settings
   - Set `REACT_APP_ENABLE_MOCK_API=false` to use the real API
   - Set `REACT_APP_ENABLE_DEBUG_LOGS=false` to disable debug logging

## Accessing Environment Variables in Code

Access these variables in your code using:

```javascript
const apiUrl = process.env.REACT_APP_API_URL;
```

Remember that all environment variables are embedded at build time. To change them, you must rebuild the application.

## Security Notes

1. Environment variables in client-side React applications are embedded in the build and visible in the browser
2. Do not store secrets (API keys, database credentials, etc.) in these files
3. Only store public configuration that is safe to expose to users
4. For secrets, use server-side environment variables in your backend API

## Troubleshooting

- If changes to environment variables don't seem to take effect, restart your development server
- After changing `.env.production` variables, you must rebuild the application
- Make sure all required variables are set before building for production
- Check for typos in variable names - they must match exactly as shown