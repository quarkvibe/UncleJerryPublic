/**
 * @file ProjectContext.tsx
 * Context for managing project state
 */
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import apiService, { Project, AnalysisResult, Blueprint } from '../services/apiService';
import useAuth from '../hooks/useAuth';

// Define context state
interface ProjectContextState {
  projects: Project[];
  currentProject: Project | null;
  selectedBlueprints: Blueprint[];
  isLoading: boolean;
  error: string | null;
  totalProjects: number;
}

// Define context actions
interface ProjectContextActions {
  fetchProjects: (limit?: number, skip?: number) => Promise<void>;
  fetchProject: (projectId: string) => Promise<void>;
  createProject: (projectData: Partial<Project>) => Promise<Project>;
  updateProject: (projectId: string, projectData: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  uploadBlueprints: (files: File[], pageTypes?: Record<number, string>) => Promise<void>;
  deleteBlueprint: (blueprintId: string) => Promise<void>;
  analyzeBlueprints: (analysisLevel: 'takeoff' | 'costEstimate' | 'fullEstimate') => Promise<string>;
  getAnalysisResults: (analysisId: string) => Promise<AnalysisResult>;
  selectBlueprint: (blueprintId: string) => void;
  deselectBlueprint: (blueprintId: string) => void;
  clearSelectedBlueprints: () => void;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
}

// Create context
const ProjectContext = createContext<ProjectContextState & ProjectContextActions | undefined>(undefined);

// Provider component
interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // State
  const [state, setState] = useState<ProjectContextState>({
    projects: [],
    currentProject: null,
    selectedBlueprints: [],
    isLoading: false,
    error: null,
    totalProjects: 0
  });

  // Fetch projects
  const fetchProjects = useCallback(async (limit = 10, skip = 0) => {
    if (!user) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { projects, total } = await apiService.projects.getUserProjects(user.id, limit, skip);
      
      setState(prev => ({
        ...prev,
        projects,
        totalProjects: total,
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch projects'
      }));
    }
  }, [user]);

  // Fetch a single project
  const fetchProject = useCallback(async (projectId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const project = await apiService.projects.getProject(projectId);
      
      setState(prev => ({
        ...prev,
        currentProject: project,
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Error fetching project:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch project'
      }));
    }
  }, []);

  // Create a new project
  const createProject = useCallback(async (projectData: Partial<Project>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Add user ID to project data
      const projectWithUser = {
        ...projectData,
        userId: user?.id
      };
      
      const newProject = await apiService.projects.createProject(projectWithUser);
      
      setState(prev => ({
        ...prev,
        projects: [newProject, ...prev.projects],
        currentProject: newProject,
        isLoading: false
      }));
      
      return newProject;
    } catch (error: any) {
      console.error('Error creating project:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to create project'
      }));
      throw error;
    }
  }, [user]);

  // Update a project
  const updateProject = useCallback(async (projectId: string, projectData: Partial<Project>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const updatedProject = await apiService.projects.updateProject(projectId, projectData);
      
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p._id === projectId ? updatedProject : p),
        currentProject: prev.currentProject?._id === projectId ? updatedProject : prev.currentProject,
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Error updating project:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to update project'
      }));
      throw error;
    }
  }, []);

  // Delete a project
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await apiService.projects.deleteProject(projectId);
      
      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p._id !== projectId),
        currentProject: prev.currentProject?._id === projectId ? null : prev.currentProject,
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Error deleting project:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to delete project'
      }));
      throw error;
    }
  }, []);

  // Upload blueprints
  const uploadBlueprints = useCallback(async (files: File[], pageTypes?: Record<number, string>) => {
    if (!state.currentProject) {
      setState(prev => ({
        ...prev,
        error: 'No project selected for blueprint upload'
      }));
      return;
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const blueprints = await apiService.projects.uploadBlueprints(
        state.currentProject._id,
        files,
        pageTypes
      );
      
      // Update current project with new blueprints
      const updatedProject = {
        ...state.currentProject,
        blueprints: [...state.currentProject.blueprints, ...blueprints]
      };
      
      setState(prev => ({
        ...prev,
        currentProject: updatedProject,
        projects: prev.projects.map(p => 
          p._id === updatedProject._id ? updatedProject : p
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Error uploading blueprints:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to upload blueprints'
      }));
      throw error;
    }
  }, [state.currentProject]);

  // Delete a blueprint
  const deleteBlueprint = useCallback(async (blueprintId: string) => {
    if (!state.currentProject) {
      setState(prev => ({
        ...prev,
        error: 'No project selected for blueprint deletion'
      }));
      return;
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await apiService.projects.deleteBlueprint(
        state.currentProject._id,
        blueprintId
      );
      
      // Update current project without deleted blueprint
      const updatedProject = {
        ...state.currentProject,
        blueprints: state.currentProject.blueprints.filter(b => b.id !== blueprintId)
      };
      
      setState(prev => ({
        ...prev,
        currentProject: updatedProject,
        projects: prev.projects.map(p => 
          p._id === updatedProject._id ? updatedProject : p
        ),
        selectedBlueprints: prev.selectedBlueprints.filter(b => b.id !== blueprintId),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Error deleting blueprint:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to delete blueprint'
      }));
      throw error;
    }
  }, [state.currentProject]);

  // Analyze blueprints
  const analyzeBlueprints = useCallback(async (
    analysisLevel: 'takeoff' | 'costEstimate' | 'fullEstimate'
  ): Promise<string> => {
    if (!state.currentProject) {
      setState(prev => ({
        ...prev,
        error: 'No project selected for analysis'
      }));
      throw new Error('No project selected for analysis');
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { analysisId } = await apiService.projects.analyzeBlueprints(
        state.currentProject._id,
        analysisLevel
      );
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      return analysisId;
    } catch (error: any) {
      console.error('Error analyzing blueprints:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to analyze blueprints'
      }));
      throw error;
    }
  }, [state.currentProject]);

  // Get analysis results
  const getAnalysisResults = useCallback(async (analysisId: string): Promise<AnalysisResult> => {
    if (!state.currentProject) {
      setState(prev => ({
        ...prev,
        error: 'No project selected for fetching analysis results'
      }));
      throw new Error('No project selected for fetching analysis results');
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const results = await apiService.projects.getAnalysisResults(
        state.currentProject._id,
        analysisId
      );
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      return results;
    } catch (error: any) {
      console.error('Error getting analysis results:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to get analysis results'
      }));
      throw error;
    }
  }, [state.currentProject]);

  // Select a blueprint
  const selectBlueprint = useCallback((blueprintId: string) => {
    if (!state.currentProject) return;
    
    const blueprint = state.currentProject.blueprints.find(b => b.id === blueprintId);
    if (!blueprint) return;
    
    if (!state.selectedBlueprints.some(b => b.id === blueprintId)) {
      setState(prev => ({
        ...prev,
        selectedBlueprints: [...prev.selectedBlueprints, blueprint]
      }));
    }
  }, [state.currentProject, state.selectedBlueprints]);

  // Deselect a blueprint
  const deselectBlueprint = useCallback((blueprintId: string) => {
    setState(prev => ({
      ...prev,
      selectedBlueprints: prev.selectedBlueprints.filter(b => b.id !== blueprintId)
    }));
  }, []);

  // Clear selected blueprints
  const clearSelectedBlueprints = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedBlueprints: []
    }));
  }, []);

  // Set current project
  const setCurrentProject = useCallback((project: Project | null) => {
    setState(prev => ({
      ...prev,
      currentProject: project,
      selectedBlueprints: []
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  // Load initial projects on user change
  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setState(prev => ({
        ...prev,
        projects: [],
        currentProject: null,
        selectedBlueprints: [],
        totalProjects: 0
      }));
    }
  }, [user, fetchProjects]);

  // Context value
  const value = {
    ...state,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    uploadBlueprints,
    deleteBlueprint,
    analyzeBlueprints,
    getAnalysisResults,
    selectBlueprint,
    deselectBlueprint,
    clearSelectedBlueprints,
    setCurrentProject,
    clearError
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

// Custom hook to use the project context
export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectContext;