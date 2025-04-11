/**
 * API service type definitions
 */
import { AnalysisResultBase, ApiResponse } from '../types/common';

// Auth types
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

export interface AuthResponse {
  token: string;
  user: User;
}

// Project types
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
  analysisResults: AnalysisResultBase[];
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

// API service interfaces
export interface AuthService {
  register: (userData: RegisterData) => Promise<AuthResponse>;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => void;
  getCurrentUser: () => Promise<User>;
  updateProfile: (profileData: Partial<User>) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

export interface ProjectsService {
  createProject: (projectData: Partial<Project>) => Promise<Project>;
  getUserProjects: (userId: string, limit?: number, skip?: number) => Promise<{ projects: Project[]; total: number }>;
  getProject: (projectId: string) => Promise<Project>;
  updateProject: (projectId: string, projectData: Partial<Project>) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
  uploadBlueprints: (projectId: string, files: File[], pageTypes?: Record<number, string>) => Promise<Blueprint[]>;
  deleteBlueprint: (projectId: string, blueprintId: string) => Promise<void>;
  getBlueprintImageUrl: (projectId: string, blueprintId: string) => string;
  analyzeBlueprints: (projectId: string, analysisLevel?: 'takeoff' | 'costEstimate' | 'fullEstimate') => Promise<{ analysisId: string }>;
  getAnalysisResults: (projectId: string, analysisId: string) => Promise<AnalysisResultBase>;
}

export interface BlueprintAnalysisService {
  analyzeBlueprintsByTrade: (files: File[], trade: string, analysisType: 'takeoff' | 'costEstimate' | 'fullEstimate') => Promise<AnalysisResultBase>;
  initialAssessment: (files: File[]) => Promise<{ assessment: string, suggestedTrade: string }>;
  saveProject: (userId: string, projectData: {
    title: string;
    trade: string;
    files: File[];
    results: AnalysisResultBase;
  }) => Promise<{ projectId: string }>;
  getUncleJerryResponse: (trade: string, situation: string) => Promise<string>;
}

export interface UtilityService {
  fileToBase64: (file: File) => Promise<string>;
  fileToBlob: (file: File) => Promise<string>;
}

// Complete API service interface
export interface ApiService extends UtilityService {
  auth: AuthService;
  projects: ProjectsService;
  analyzeBlueprintsByTrade: BlueprintAnalysisService['analyzeBlueprintsByTrade'];
  initialAssessment: BlueprintAnalysisService['initialAssessment'];
  saveProject: BlueprintAnalysisService['saveProject'];
  getUncleJerryResponse: BlueprintAnalysisService['getUncleJerryResponse'];
}