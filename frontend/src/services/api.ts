// src/services/api.ts
// Re-export all functionality from apiService for backward compatibility

import apiService, { AnalysisResult } from './apiService';

export type { AnalysisResult };
export default apiService;