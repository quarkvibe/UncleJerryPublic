/**
 * Common type definitions for the Uncle Jerry Blueprint Analyzer
 */

// Basic shared types
export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost?: number;
  unitPrice?: number;
  totalPrice?: number;
  category?: string;
  notes?: string;
}

export interface LaborItem {
  task: string;
  hours: number;
  rate: number;
  cost: number;
}

export interface AnalysisResultBase {
  materials: Material[];
  labor?: LaborItem[];
  totalMaterialCost?: number;
  totalLaborCost?: number;
  totalCost?: number;
  notes?: string | string[];
  projectName?: string;
  projectAddress?: string;
}

// Common component prop types
export interface ComponentWithChildren {
  children: React.ReactNode;
}

// Table column types
export interface TableColumn<T> {
  title: string;
  dataIndex?: keyof T;
  key: string;
  render?: (text: any, record: T) => React.ReactNode;
}

// Shared API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// State management types
export interface Action<T = any> {
  type: string;
  payload?: T;
}

export type AppThunkAction<ReturnType = void> = (
  dispatch: (action: Action) => any,
  getState: () => any
) => ReturnType;