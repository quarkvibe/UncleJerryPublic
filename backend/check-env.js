// This script checks if environment variables are properly set
require('dotenv').config();

// Function to check required environment variables
function checkRequiredEnvVars() {
  const requiredVars = [
    'PORT',
    'MONGODB_URI',
    'ANTHROPIC_API_KEY',
    'CLAUDE_MODEL',
    'CLAUDE_API_URL',
    'ANTHROPIC_VERSION'
  ];
  
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(` - ${varName}`));
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    console.error('You can copy .env.example to .env and fill in the missing values.');
    return false;
  }
  
  console.log('✅ All required environment variables are set!');
  return true;
}

// Run the check
const envVarsOk = checkRequiredEnvVars();

// Export the result for use in other scripts
module.exports = envVarsOk;