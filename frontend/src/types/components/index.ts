/**
 * Centralized component prop types for the Uncle Jerry Blueprint Analyzer
 */
import React from 'react';
import { Material, LaborItem, AnalysisResultBase } from '../common';

// Re-export MUI specific types
export * from './mui';

// Re-export common component type interfaces
export * from '../common';

/**
 * ---------------------------
 * Blueprint Uploader Component
 * ---------------------------
 */
export interface BlueprintUploaderProps {
  onFileChange?: (file: File) => void;
  onTradeChange?: (trade: string) => void;
  isUploading?: boolean;
  acceptedFileTypes?: string;
  trade?: string;
  onUpload: (file: File) => void;
  isAnalyzing?: boolean;
  label?: string;
  multiple?: boolean;
  maxSizeInMB?: number;
  resetKey?: number;
}

/**
 * ---------------------------
 * Uncle Jerry Character Component
 * ---------------------------
 */
export interface InteractionPoint {
  x: number;
  y: number;
  tooltip: string;
  onClick: () => void;
}

// Speech bubble effects
export type SpeechEffect = 'normal' | 'thinking' | 'excited' | 'warning' | 'technical';

// Uncle Jerry's moods
export type UncleJerryMood = 'happy' | 'explaining' | 'thinking' | 'excited' | 'confused' | 'concerned' | 'approving';

// Uncle Jerry's states
export type UncleJerryState = 'idle' | 'talking' | 'thinking' | 'excited' | 'pointing' | 'confused' | 'concerned' | 'approving';

// Message queue for handling complex interactions
export interface QueuedMessage {
  content: string;
  effect?: SpeechEffect;
  duration?: number; // How long should the message be displayed (ms)
  onComplete?: () => void;
}

export interface UncleJerryProps {
  // Character state
  state: UncleJerryState;
  
  // Content
  message?: string;
  messageEffect?: SpeechEffect;
  messageQueue?: QueuedMessage[];
  
  // Interaction
  onMessageComplete?: () => void;
  interactionPoints?: InteractionPoint[];
  onCharacterClick?: () => void;
  
  // User progress
  userProgress?: number;
  
  // Appearance
  size?: 'small' | 'medium' | 'large';
  position?: 'left' | 'right' | 'center';
  pointingDirection?: 'left' | 'right' | 'up' | 'down' | 'none';
  
  // Animation
  typingSpeed?: number; // ms per character
  isAnimated?: boolean;
  
  // Accessibility
  ariaLabel?: string;
}

export interface UncleJerrySVGProps {
  mood: UncleJerryMood;
  isAnimated?: boolean;
  pointingDirection?: 'left' | 'right' | 'up' | 'down' | 'none';
  className?: string;
}

/**
 * ---------------------------
 * Analysis Results Component
 * ---------------------------
 */
export interface AnalysisResult extends AnalysisResultBase {
  project_name?: string;
  permit_cost?: number;
  equipment_cost?: number;
}

export interface AnalysisResultsProps {
  results: AnalysisResult;
  blueprintImage?: string;
  trade: string;
  isLoading?: boolean;
  onSave?: () => void;
  onNewAnalysis?: () => void;
}

/**
 * ---------------------------
 * Trade Components
 * ---------------------------
 */
export interface TradeSelectorProps {
  onTradeChange?: (trade: string) => void;
}

// Basic material item for various trade components
export interface TradeItemBase {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  cost?: number;
  unitPrice?: number; 
  totalPrice?: number;
}

// Material item with category
export interface CategoryMaterial extends TradeItemBase {
  category: string;
}

// Common props for all trade components
export interface TradeComponentProps {
  blueprints?: File[];
  onAnalysisComplete?: (results: AnalysisResult) => void;
  isAnalyzing?: boolean;
}

// Common app state structure
export interface AppStateBase {
  isLoading: boolean;
  error: null | string;
  currentAnalysis: any;
  isAnalyzing: boolean;
}

/**
 * ---------------------------
 * Common UI Components
 * ---------------------------
 */
export interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  overlay?: boolean;
}

export interface HeaderProps {
  title?: string;
  showLoginButton?: boolean;
  isLoggedIn?: boolean;
  username?: string;
  onLogin?: () => void;
  onLogout?: () => void;
}

export interface FooterProps {
  showCopyright?: boolean;
  showLinks?: boolean;
  customText?: string;
}

/**
 * ---------------------------
 * Context Provider Props
 * ---------------------------
 */
export interface ContextProviderProps {
  children: React.ReactNode;
}

/**
 * ---------------------------
 * Grid Components
 * ---------------------------
 */
export interface StyledGridProps {
  container?: boolean;
  item?: boolean;
  xs?: number | 'auto' | boolean;
  sm?: number | 'auto' | boolean;
  md?: number | 'auto' | boolean;
  lg?: number | 'auto' | boolean;
  xl?: number | 'auto' | boolean;
  spacing?: number;
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
}