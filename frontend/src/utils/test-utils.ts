/**
 * Testing utilities for Uncle Jerry Blueprint Analyzer
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { CustomRenderOptions, CustomRenderResult, MockFile } from '../types/testing';
import { TradeProvider } from '../contexts/TradeContext';

/**
 * Custom renderer that wraps components with necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
): CustomRenderResult {
  const {
    initialRoute = '/',
    providerProps = {},
    ...renderOptions
  } = options || {};

  // Create wrapper with providers
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <TradeProvider>
        {children}
      </TradeProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Creates a mock file for testing file uploads
 */
export function createMockFile(
  name = 'test-file.jpg',
  size = 1024,
  type = 'image/jpeg'
): File {
  const file = new File([], name, { type });
  
  // Override properties that cannot be set in the constructor
  Object.defineProperty(file, 'size', { value: size });
  
  return file;
}

/**
 * Creates a mock image file with actual content
 */
export async function createMockImageFile(
  width = 100,
  height = 100,
  name = 'test-image.png',
  type = 'image/png'
): Promise<File> {
  // Create a canvas element to generate image data
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Draw something on the canvas
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.fillText('Test Image', 10, 50);
  }
  
  // Convert canvas to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], name, { type });
        resolve(file);
      } else {
        resolve(createMockFile(name, 1024, type));
      }
    }, type);
  });
}

/**
 * Mock fetch function for testing API calls
 */
export function mockFetch(response: any, status = 200): jest.Mock {
  return jest.fn().mockImplementation(() => 
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      blob: () => Promise.resolve(new Blob([JSON.stringify(response)])),
    })
  );
}

/**
 * Wait for a condition to be true
 */
export function waitForCondition(
  condition: () => boolean,
  timeout = 1000,
  interval = 50
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error('Condition timeout'));
        return;
      }
      
      setTimeout(check, interval);
    };
    
    check();
  });
}

/**
 * Creates test fixtures for the application
 */
export const createTestFixtures = () => {
  return {
    // Mock materials
    materials: [
      { id: '1', name: 'Drywall 1/2"', quantity: 500, unit: 'sqft', unitPrice: 0.5, totalPrice: 250 },
      { id: '2', name: 'Lumber 2x4', quantity: 100, unit: 'ft', unitPrice: 2.5, totalPrice: 250 },
      { id: '3', name: 'Paint', quantity: 5, unit: 'gal', unitPrice: 30, totalPrice: 150 },
    ],
    
    // Mock labor items
    labor: [
      { task: 'Wall framing', hours: 8, rate: 45, cost: 360 },
      { task: 'Drywall installation', hours: 16, rate: 40, cost: 640 },
      { task: 'Painting', hours: 12, rate: 35, cost: 420 },
    ],
    
    // Mock analysis result
    analysisResult: {
      id: 'test-1',
      projectName: 'Test Project',
      trade: 'framing',
      materials: [
        { id: '1', name: 'Drywall 1/2"', quantity: 500, unit: 'sqft', unitPrice: 0.5, totalPrice: 250 },
        { id: '2', name: 'Lumber 2x4', quantity: 100, unit: 'ft', unitPrice: 2.5, totalPrice: 250 },
        { id: '3', name: 'Paint', quantity: 5, unit: 'gal', unitPrice: 30, totalPrice: 150 },
      ],
      labor: [
        { task: 'Wall framing', hours: 8, rate: 45, cost: 360 },
        { task: 'Drywall installation', hours: 16, rate: 40, cost: 640 },
        { task: 'Painting', hours: 12, rate: 35, cost: 420 },
      ],
      totalMaterialCost: 650,
      totalLaborCost: 1420,
      totalCost: 2070,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    
    // Mock user
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      token: 'mock-jwt-token',
    },
    
    // Mock blueprint files
    blueprints: [
      { id: '1', name: 'floor-plan.jpg', url: '/mock/floor-plan.jpg', type: 'floor', filePath: '/mock/floor-plan.jpg' },
      { id: '2', name: 'elevation.jpg', url: '/mock/elevation.jpg', type: 'elevation', filePath: '/mock/elevation.jpg' },
    ],
  };
};