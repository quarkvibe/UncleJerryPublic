const axios = require('axios');
require('dotenv').config();

async function testAnthropicAPI() {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Hello Claude, this is a test request. Please respond with a short greeting.'
          }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );
    
    console.log('Claude response:');
    console.log(response.data.content[0].text);
    console.log('API connection successful!');
  } catch (error) {
    console.error('Error connecting to Claude API:');
    console.error(error.response ? error.response.data : error.message);
  }
}

testAnthropicAPI();
