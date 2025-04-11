/**
 * Type definitions for testing components in the Uncle Jerry Blueprint Analyzer
 */

import { ReactElement } from 'react';
import { RenderOptions, RenderResult, queries } from '@testing-library/react';

/**
 * ---------------------------
 * Testing Utility Types
 * ---------------------------
 */

// Extended render options with custom wrapper provider
export interface CustomRenderOptions extends Omit<RenderOptions, 'queries'> {
  initialRoute?: string;
  providerProps?: {
    selectedTrade?: string;
    blueprints?: File[];
    analysisResults?: any;
    user?: {
      id?: string;
      name?: string;
      email?: string;
      token?: string;
    };
  };
}

// Custom render result
export type CustomRenderResult = RenderResult<typeof queries>;

// Render function type
export type CustomRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => CustomRenderResult;

/**
 * ---------------------------
 * Mock Data Types
 * ---------------------------
 */

// Mock file type
export interface MockFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  content?: string | ArrayBuffer;
}

// Mock API response
export interface MockApiResponse<T = any> {
  data?: T;
  success: boolean;
  error?: string;
  message?: string;
  status: number;
}

// Mock event handlers
export interface MockEventHandlers {
  onFileChange?: jest.Mock;
  onTradeChange?: jest.Mock;
  onUpload?: jest.Mock;
  onAnalysisComplete?: jest.Mock;
  onSave?: jest.Mock;
  onNewAnalysis?: jest.Mock;
  onClick?: jest.Mock;
  onChange?: jest.Mock;
  onSubmit?: jest.Mock;
}

/**
 * ---------------------------
 * Test Fixture Types
 * ---------------------------
 */

// Blueprint test fixture
export interface BlueprintFixture {
  id: string;
  name: string;
  url: string;
  type: 'floor' | 'elevation' | 'section' | 'detail';
  filePath: string;
}

// Analysis result test fixture
export interface AnalysisResultFixture {
  id: string;
  projectName: string;
  trade: string;
  materials: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
  labor?: Array<{
    task: string;
    hours: number;
    rate: number;
    cost: number;
  }>;
  totalMaterialCost: number;
  totalLaborCost?: number;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
}

// User test fixture
export interface UserFixture {
  id: string;
  name: string;
  email: string;
  token: string;
  projects?: string[];
}

/**
 * ---------------------------
 * Mock Service Types
 * ---------------------------
 */

// Mock API service
export interface MockApiService {
  auth: {
    login: jest.Mock;
    register: jest.Mock;
    logout: jest.Mock;
    checkToken: jest.Mock;
  };
  blueprints: {
    upload: jest.Mock;
    analyze: jest.Mock;
    getAll: jest.Mock;
    getById: jest.Mock;
    delete: jest.Mock;
  };
  projects: {
    create: jest.Mock;
    update: jest.Mock;
    getAll: jest.Mock;
    getById: jest.Mock;
    delete: jest.Mock;
  };
}

// Mock storage service
export interface MockStorageService {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  clear: jest.Mock;
}