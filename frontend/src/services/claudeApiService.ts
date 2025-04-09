// Claude API Integration Service for Uncle Jerry Blueprint Analyzer

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Process blueprint images directly with Claude API
 */
export async function processWithClaudeAPI(image: File, trade: string, analysisType = 'full_estimate') {
  // Process image to base64
  const imageBase64 = await fileToBase64(image);

  // Construct the prompt for Claude
  const prompt = constructPromptForTrade(trade, analysisType);

  try {
    // Call Claude API through backend proxy
    const response = await axios.post(`${API_URL}/api/claude`, {
      prompt,
      image: imageBase64,
      trade,
      analysisType
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Extract and parse the structured data from Claude's response
    return response.data;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

/**
 * Convert file to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data.split(',')[1]); // Remove data URL prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Construct the appropriate prompt based on trade
 */
export function constructPromptForTrade(trade: string, analysisType: string): string {
  const prompts: Record<string, string> = {
    plumbing: `You are Uncle Jerry, a master plumber with 40 years of experience. I'm showing you blueprint images for a plumbing project. Please analyze these images and create a detailed ${analysisType} including:

1. Identify all plumbing fixtures and their quantities from the fixture schedule
2. Estimate the total linear feet of each pipe size and type based on the isometric drawings
3. Calculate material costs for all components
4. Estimate labor hours and costs
5. Include permits and equipment costs
6. Add standard overhead and profit percentages

Format your response as JSON with the following structure:
{
  "project_name": string,
  "project_address": string,
  "fixtures": [
    {
      "mark": string,
      "type": string,
      "description": string,
      "manufacturer": string,
      "model": string,
      "quantity": number,
      "unit_price": number,
      "connection_sizes": {
        "hotWater": string,
        "coldWater": string,
        "waste": string,
        "vent": string
      }
    }
  ],
  "piping_systems": [
    {
      "type": string,
      "material": string,
      "sizes": string[],
      "total_length": number,
      "unit_price": number
    }
  ],
  "labor_hours": number,
  "labor_rate": number,
  "equipment_cost": number,
  "permit_cost": number,
  "overhead_percentage": number,
  "profit_percentage": number
}
`,
    electrical: `You are Uncle Jerry, a master electrician with 40 years of experience. I'm showing you blueprint images for an electrical project. Please analyze these images and create a detailed ${analysisType} including:

1. Identify all electrical fixtures, devices, and equipment from the schedules
2. Estimate the total linear feet of conduit, wire, and cable based on the drawings
3. Calculate material costs for all components
4. Estimate labor hours and costs
5. Include permits and equipment costs
6. Add standard overhead and profit percentages

Format your response in a structured JSON format.
`,
    hvac: `You are Uncle Jerry, an HVAC specialist with 40 years of experience. I'm showing you blueprint images for an HVAC/mechanical project. Please analyze these images and create a detailed ${analysisType} including:

1. Identify all HVAC equipment, ductwork, and control systems
2. Estimate the total linear feet of ductwork by size and type
3. Calculate material costs for all components
4. Estimate labor hours and costs
5. Include permits and equipment costs
6. Add standard overhead and profit percentages

Format your response in a structured JSON format.
`,
    framing: `You are Uncle Jerry, a general contractor with 40 years of experience in framing. I'm showing you blueprint images for structural framing. Please analyze these images and create a detailed ${analysisType} including:

1. Identify all framing members, their sizes, and quantities
2. Calculate total board feet for each member type
3. Calculate material costs for all components
4. Estimate labor hours and costs
5. Include equipment rental costs
6. Add standard overhead and profit percentages

Format your response in a structured JSON format.
`,
    flooring: `You are Uncle Jerry, a flooring specialist with 40 years of experience. I'm showing you blueprint images for a flooring project. Please analyze these images and create a detailed ${analysisType} including:

1. Identify all floor types and their areas
2. Calculate material quantities needed including base materials and finishes
3. Calculate material costs for all components
4. Estimate labor hours and costs
5. Include equipment rental costs
6. Add standard overhead and profit percentages

Format your response in a structured JSON format.
`
  };

  return prompts[trade] || `You are Uncle Jerry, a construction expert with 40 years of experience. Please analyze these blueprint images and create a detailed ${analysisType} for ${trade} work.`;
}

/**
 * Parse Claude's response into structured data
 */
export function parseClaudeResponse(claudeResponse: any) {
  if (typeof claudeResponse === 'object' && claudeResponse !== null) {
    return claudeResponse;
  }
  
  // If response is a string, try to extract JSON
  if (typeof claudeResponse === 'string') {
    const jsonMatch = claudeResponse.match(/```json\n([\s\S]*?)\n```/) || 
                    claudeResponse.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (error) {
        console.error('Failed to parse JSON from Claude response:', error);
        return { error: 'Failed to parse response', rawText: claudeResponse };
      }
    }
  }
  
  return { error: 'Invalid response format', rawText: claudeResponse };
}