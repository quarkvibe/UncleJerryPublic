/**
 * Type definitions for Material UI components
 */
import React from 'react';

/**
 * ---------------------------
 * Grid Components
 * ---------------------------
 */
export type BreakpointValue = 'auto' | boolean | number;

export interface GridProps {
  // Grid container props
  container?: boolean;
  spacing?: number | string;
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  
  // Grid item props
  item?: boolean;
  xs?: BreakpointValue;
  sm?: BreakpointValue;
  md?: BreakpointValue;
  lg?: BreakpointValue;
  xl?: BreakpointValue;
  zeroMinWidth?: boolean;
  
  // HTML element to render
  component?: React.ElementType;
  
  // Additional props
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

/**
 * ---------------------------
 * Input Components
 * ---------------------------
 */
export interface InputProps {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  type?: string;
  required?: boolean;
  fullWidth?: boolean;
  variant?: 'standard' | 'outlined' | 'filled';
  size?: 'small' | 'medium';
  label?: React.ReactNode;
  id?: string;
  name?: string;
  className?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}

/**
 * ---------------------------
 * Button Components
 * ---------------------------
 */
export interface ButtonProps {
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  size?: 'small' | 'medium' | 'large';
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  href?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * ---------------------------
 * Parser Functions
 * ---------------------------
 */
export type InputNumberParserType = (value: string | undefined) => number;
export type InputNumberFormatterType = (value: number | undefined) => string;

/**
 * ---------------------------
 * Table Components
 * ---------------------------
 */
export interface TableColumnProps<T> {
  title: string;
  dataIndex?: keyof T;
  key: string;
  render?: (text: any, record: T, index: number) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string | number;
  fixed?: 'left' | 'right' | boolean;
  ellipsis?: boolean;
  sorter?: boolean | ((a: T, b: T) => number);
  sortOrder?: 'ascend' | 'descend' | null;
  sortDirections?: Array<'ascend' | 'descend' | null>;
  defaultSortOrder?: 'ascend' | 'descend' | null;
  editable?: boolean;
}