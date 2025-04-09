# Uncle Jerry's Blueprint Analyzer

A web application for contractors to input trade-specific blueprints, which "Uncle Jerry" interprets using Claude AI to provide material takeoffs and cost estimates.

## 🏗️ Features

- **Blueprint Analysis**: Upload blueprint images for different trades
- **Material Takeoff**: Get detailed lists of required materials with quantities
- **Cost Estimation**: Calculate material costs and optional labor estimates
- **Trade Support**: Specialized analysis for electrical, plumbing, carpentry, HVAC, and more
- **Project Management**: Save and organize projects
- **Interactive Character**: Uncle Jerry guides users through the process

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6.0 or higher)
- Anthropic API key (for Claude)
- Docker and Docker Compose (optional)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/uncle-jerry-blueprint-analyzer.git
   cd uncle-jerry-blueprint-analyzer
   ```

2. Install dependencies
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Create environment files
   ```bash
   # Backend .env file
   cd ../backend
   cp .env.example .env
   ```
   
   ```bash
   # Frontend .env file
   cd ../frontend
   cp .env.example .env
   ```

4. Configure environment variables
   - Backend: Edit the `.env` file and add your MongoDB URI and Anthropic API key
   - Frontend: Edit the `.env` file to set the API URL and other configurations

### Running the Application

1. Start MongoDB with Docker (optional)
   ```bash
   docker-compose up -d mongodb
   ```

2. Start the backend server
   ```bash
   cd backend
   npm run dev
   ```

3. Start the frontend development server
   ```bash
   cd frontend
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## 🧠 How It Works

1. **Upload**: Contractors upload blueprint images
2. **Analysis**: Claude AI analyzes the images to identify components and quantities
3. **Takeoff**: The system generates a material takeoff with quantities
4. **Estimation**: Optional cost and labor estimates are calculated
5. **Results**: The contractor receives detailed results that can be saved or exported

## 🔧 Project Structure

- `/backend`: Node.js/Express API server
  - `/src/controllers`: Request handlers
  - `/src/models`: MongoDB schemas
  - `/src/routes`: API routes
  - `/src/services`: Business logic and Claude integration

- `/frontend`: React/TypeScript frontend
  - `/src/components`: Reusable UI components
  - `/src/context`: React Context for state management
  - `/src/hooks`: Custom React hooks
  - `/src/services`: API and utility services
  - `/src/types`: TypeScript type definitions

## 🚪 Trade Support

The system currently supports the following trades:

- **Electrical**: Panels, circuits, fixtures, outlets, wiring
- **Plumbing**: Fixtures, piping, fittings, valves
- **Carpentry**: Framing, studs, joists, sheathing
- **HVAC/Mechanical**: Ductwork, equipment, registers, controls
- **Drywall/Finishes**: Board footage, joint compound, trim
- **Flooring**: Materials, underlayment, transitions
- **Roofing**: Materials, flashing, ventilation
- **Acoustical**: Ceiling systems, wall treatments

## 🛡️ Authentication

- JWT-based authentication
- User roles (contractor, admin)
- Secure password handling

## 🔌 API Integration

### Claude AI

The system uses Anthropic's Claude to analyze blueprint images:

1. Images are preprocessed to optimize for Claude
2. Trade-specific prompts guide the analysis
3. Structured JSON output is parsed and validated
4. Results are stored in the database for future reference

### MongoDB

Project and user data is stored in MongoDB:

1. User profiles and authentication
2. Projects with associated blueprints
3. Analysis results with material takeoffs

## 🚀 Deployment

### 5. Production Deployment with Apache

For a production-like environment with Apache as the web server:

1. Install Apache and required modules:
   ```bash
   sudo apt update
   sudo apt install -y apache2 apache2-utils
   sudo a2enmod proxy proxy_http rewrite
   ```

2. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

3. Copy the Apache configuration:
   ```bash
   sudo cp apache-config.conf /etc/apache2/sites-available/blueprint.conf
   sudo a2ensite blueprint.conf
   sudo systemctl restart apache2
   ```

4. Start the backend using PM2:
   ```bash
   npm install -g pm2
   cd backend
   pm2 start server.js --name "uncle-jerry-backend"
   pm2 save
   ```

For detailed deployment instructions to Digital Ocean or other providers, see:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [DEPLOYMENT_GUIDE_DIGITAL_OCEAN.md](./DEPLOYMENT_GUIDE_DIGITAL_OCEAN.md)

## 📄 API Documentation

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🤝 Contributing

For contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.