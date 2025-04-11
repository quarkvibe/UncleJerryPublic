/**
 * @file apiService.ts
 * Consolidated API Service for Uncle Jerry Blueprint Analyzer
 * Provides an interface for all server communications
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Types
export interface Material {
  name: string;
  quantity: number;
  unit: string;
  cost?: number;
  category?: string;
}

export interface LaborItem {
  task: string;
  hours: number;
  rate?: number;
  cost?: number;
}

export interface AnalysisResult {
  materials: Material[];
  labor?: LaborItem[];
  totalMaterialCost?: number;
  totalLaborCost?: number;
  totalCost?: number;
  notes?: string;
  projectName?: string;
  projectAddress?: string;
  permitCost?: number;
  equipmentCost?: number;
  status?: string;
  analysisDate?: string;
  errorMessage?: string;
}

export interface Blueprint {
  id: string;
  name: string;
  originalName: string;
  contentType: string;
  size: number;
  url: string;
  pageType: string;
  uploadDate: string;
}

export interface Project {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  trade: string;
  projectType?: string;
  blueprints: Blueprint[];
  analysisResults: AnalysisResult[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  clientInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  role: string;
  primaryTrade?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  licenseNumber?: string;
  createdAt: string;
  status: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  companyName?: string;
  primaryTrade?: string;
  phone?: string;
}

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || '/api';  // Changed to relative path for production
const API_TIMEOUT_MS = parseInt(process.env.REACT_APP_API_TIMEOUT_MS || '30000', 10);

// Feature Flags
const ENABLE_MOCK_API = process.env.REACT_APP_ENABLE_MOCK_API === 'true';
const ENABLE_LOGGING = process.env.REACT_APP_ENABLE_DEBUG_LOGS === 'true';

// Create a base axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from local storage
    const token = localStorage.getItem('accessToken');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Log request if logging is enabled
    if (ENABLE_LOGGING) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    if (ENABLE_LOGGING) {
      console.error('API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response) => {
    // Log response if logging is enabled
    if (ENABLE_LOGGING) {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    // Log error if logging is enabled
    if (ENABLE_LOGGING) {
      console.error('API Response Error:', error);
    }
    
    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401) {
      // Clear authentication data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Redirect to login page if we're in a browser context
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
const authApi = {
  /**
   * Register a new user
   */
  register: async (userData: RegisterData): Promise<{ token: string; user: User }> => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      
      // Store authentication data
      localStorage.setItem('accessToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Login a user
   */
  login: async (credentials: LoginCredentials): Promise<{ token: string; user: User }> => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      // Store authentication data
      localStorage.setItem('accessToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Logout the current user
   */
  logout: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    
    // Redirect to login page if we're in a browser context
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
  
  /**
   * Get the current user profile
   */
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data.user;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update the current user profile
   */
  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      return response.data.user;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Change user password
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await apiClient.put('/auth/password', { currentPassword, newPassword });
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Reset password with token
   */
  resetPassword: async (token: string, password: string): Promise<void> => {
    try {
      await apiClient.post('/auth/reset-password', { token, password });
    } catch (error) {
      throw error;
    }
  }
};

// Projects API
const projectsApi = {
  /**
   * Create a new project
   */
  createProject: async (projectData: Partial<Project>): Promise<Project> => {
    try {
      const response = await apiClient.post('/projects', projectData);
      return response.data.project;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get all projects for the current user
   */
  getUserProjects: async (userId: string, limit = 10, skip = 0): Promise<{ projects: Project[]; total: number }> => {
    try {
      if (ENABLE_MOCK_API) {
        // Return mock data for development
        return {
          projects: getMockProjects(3),
          total: 3
        };
      }
      
      const response = await apiClient.get(`/projects/user/${userId}?limit=${limit}&skip=${skip}`);
      return {
        projects: response.data.projects,
        total: response.data.pagination.total
      };
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get a project by ID
   */
  getProject: async (projectId: string): Promise<Project> => {
    try {
      if (ENABLE_MOCK_API) {
        // Return mock data for development
        return getMockProjects(1)[0];
      }
      
      const response = await apiClient.get(`/projects/${projectId}`);
      return response.data.project;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update a project
   */
  updateProject: async (projectId: string, projectData: Partial<Project>): Promise<Project> => {
    try {
      const response = await apiClient.put(`/projects/${projectId}`, projectData);
      return response.data.project;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Delete a project
   */
  deleteProject: async (projectId: string): Promise<void> => {
    try {
      await apiClient.delete(`/projects/${projectId}`);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Upload blueprints to a project
   */
  uploadBlueprints: async (projectId: string, files: File[], pageTypes?: Record<number, string>): Promise<Blueprint[]> => {
    try {
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append('blueprints', file);
      });
      
      if (pageTypes) {
        formData.append('pageTypes', JSON.stringify(pageTypes));
      }
      
      const response = await apiClient.post(`/projects/${projectId}/blueprints`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.blueprints;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Delete a blueprint from a project
   */
  deleteBlueprint: async (projectId: string, blueprintId: string): Promise<void> => {
    try {
      await apiClient.delete(`/projects/${projectId}/blueprints/${blueprintId}`);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get the URL for a blueprint image
   */
  getBlueprintImageUrl: (projectId: string, blueprintId: string): string => {
    return `${API_URL}/projects/${projectId}/blueprints/${blueprintId}/image`;
  },
  
  /**
   * Analyze blueprints for a project
   */
  analyzeBlueprints: async (projectId: string, analysisLevel: 'takeoff' | 'costEstimate' | 'fullEstimate' = 'takeoff'): Promise<{ analysisId: string }> => {
    try {
      if (ENABLE_MOCK_API) {
        // Return mock data for development
        return { analysisId: 'mock-analysis-123' };
      }
      
      const response = await apiClient.post(`/projects/${projectId}/analyze`, { analysisLevel });
      return { analysisId: response.data.analysisId };
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get analysis results by ID
   */
  getAnalysisResults: async (projectId: string, analysisId: string): Promise<AnalysisResult> => {
    try {
      if (ENABLE_MOCK_API) {
        // Return mock data for development
        return getMockAnalysisResult();
      }
      
      const response = await apiClient.get(`/projects/${projectId}/analysis/${analysisId}`);
      return response.data.analysis;
    } catch (error) {
      throw error;
    }
  }
};

// Consolidated API service
const apiService = {
  auth: authApi,
  projects: projectsApi,
  fileToBase64,
  fileToBlob,
  
  /**
   * Get Uncle Jerry's responses for trade-specific dialogue
   */
  getUncleJerryResponse: async (trade: string, situation: string): Promise<string> => {
    try {
      const response = await apiClient.post('/uncle-jerry/dialogue', { trade, situation });
      return response.data.dialogue;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Perform initial assessment of blueprint files
   */
  initialAssessment: async (files: File[]): Promise<{ assessment: string, suggestedTrade: string }> => {
    try {
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append('blueprints', file);
      });
      
      const response = await apiClient.post('/blueprints/assess', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return {
        assessment: response.data.assessment,
        suggestedTrade: response.data.suggestedTrade
      };
    } catch (error) {
      throw error;
    }
  }
};

/**
 * Convert a file to Base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1] || ''); // Remove data URL prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a file to Blob URL
 */
function fileToBlob(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(URL.createObjectURL(file));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate mock projects for development
 */
function getMockProjects(count: number): Project[] {
  const projects: Project[] = [];
  
  for (let i = 0; i < count; i++) {
    projects.push({
      _id: `mock-project-${i + 1}`,
      userId: 'mock-user-123',
      title: `Mock Project ${i + 1}`,
      description: 'This is a mock project for development',
      trade: ['electrical', 'plumbing', 'carpentry'][i % 3],
      projectType: 'residential',
      blueprints: [{
        id: `mock-blueprint-${i + 1}`,
        name: `blueprint-${i + 1}.jpg`,
        originalName: `Blueprint ${i + 1}.jpg`,
        contentType: 'image/jpeg',
        size: 1024 * 1024 * 2, // 2 MB
        url: 'https://via.placeholder.com/1000x800',
        pageType: 'floorplan',
        uploadDate: new Date().toISOString()
      }],
      analysisResults: [{
        materials: [{
          name: 'Mock Material',
          quantity: 10,
          unit: 'pieces',
          cost: 20
        }],
        labor: [{
          task: 'Installation',
          hours: 8,
          rate: 45,
          cost: 360
        }],
        totalMaterialCost: 200,
        totalLaborCost: 360,
        totalCost: 560,
        notes: 'Mock analysis for development',
        status: 'completed',
        analysisDate: new Date().toISOString()
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    });
  }
  
  return projects;
}

/**
 * Generate a mock analysis result for development
 */
function getMockAnalysisResult(): AnalysisResult {
  return {
    materials: [
      { name: 'Romex 14/2', quantity: 250, unit: 'ft', cost: 125 },
      { name: 'Standard Outlets', quantity: 20, unit: 'ea', cost: 60 },
      { name: 'Light Fixtures', quantity: 8, unit: 'ea', cost: 240 }
    ],
    labor: [
      { task: 'Rough-in', hours: 16, rate: 65, cost: 1040 },
      { task: 'Trim-out', hours: 8, rate: 65, cost: 520 }
    ],
    totalMaterialCost: 425,
    totalLaborCost: 1560,
    totalCost: 1985,
    notes: 'This is a mock analysis result for development purposes.',
    status: 'completed',
    analysisDate: new Date().toISOString()
  };
}

export default apiService;