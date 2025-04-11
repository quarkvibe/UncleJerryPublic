import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BlueprintUploader from '../BlueprintUploader';
import { renderWithProviders, createMockFile } from '../../../utils/test-utils';
import { MockEventHandlers } from '../../../types/testing';

describe('BlueprintUploader', () => {
  const mockHandlers: MockEventHandlers = {
    onFileChange: jest.fn(),
    onTradeChange: jest.fn(),
    onUpload: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload area with correct label', () => {
    const testLabel = 'Test Upload Label';
    renderWithProviders(
      <BlueprintUploader 
        onUpload={mockHandlers.onUpload!}
        label={testLabel}
      />
    );

    expect(screen.getByText(testLabel)).toBeInTheDocument();
  });

  test('shows trade selector when onTradeChange is provided', () => {
    renderWithProviders(
      <BlueprintUploader 
        onUpload={mockHandlers.onUpload!}
        onTradeChange={mockHandlers.onTradeChange}
        trade="electrical"
      />
    );

    expect(screen.getByLabelText(/select trade/i)).toBeInTheDocument();
  });

  test('does not show trade selector when onTradeChange is not provided', () => {
    renderWithProviders(
      <BlueprintUploader 
        onUpload={mockHandlers.onUpload!}
      />
    );

    expect(screen.queryByLabelText(/select trade/i)).not.toBeInTheDocument();
  });

  test('calls onTradeChange when trade is changed', () => {
    renderWithProviders(
      <BlueprintUploader 
        onUpload={mockHandlers.onUpload!}
        onTradeChange={mockHandlers.onTradeChange}
        trade="electrical"
      />
    );

    fireEvent.change(screen.getByLabelText(/select trade/i), {
      target: { value: 'plumbing' }
    });

    expect(mockHandlers.onTradeChange).toHaveBeenCalledWith('plumbing');
  });

  test('shows file size limit in upload hint', () => {
    const testSizeLimit = 20;
    renderWithProviders(
      <BlueprintUploader 
        onUpload={mockHandlers.onUpload!}
        maxSizeInMB={testSizeLimit}
      />
    );

    const uploadHint = screen.getByText(/supports.*max/i);
    expect(uploadHint).toHaveTextContent(`Max ${testSizeLimit}MB`);
  });

  test('handles file upload correctly', async () => {
    // Create a mock file
    const file = createMockFile('test.jpg', 1024, 'image/jpeg');
    
    // Mock FileReader
    const originalFileReader = global.FileReader;
    const mockFileReaderInstance = {
      readAsDataURL: jest.fn(),
      onloadend: null,
      result: 'data:image/jpeg;base64,mockbase64data',
    };
    const mockFileReader = jest.fn(() => mockFileReaderInstance);
    global.FileReader = mockFileReader as any;

    renderWithProviders(
      <BlueprintUploader 
        onUpload={mockHandlers.onUpload!}
      />
    );

    // Get the file input
    const input = screen.getByLabelText(/file input/i);
    
    // Simulate file upload
    fireEvent.change(input, { target: { files: [file] } });
    
    // Simulate FileReader onloadend
    if (mockFileReaderInstance.onloadend) {
      (mockFileReaderInstance.onloadend as any)();
    }
    
    // Verify onUpload was called with the file
    await waitFor(() => {
      expect(mockHandlers.onUpload).toHaveBeenCalledWith(file);
    });
    
    // Clean up - restore FileReader
    global.FileReader = originalFileReader;
  });

  test('resets the uploader when resetKey changes', () => {
    const { rerender } = renderWithProviders(
      <BlueprintUploader 
        onUpload={mockHandlers.onUpload!}
        resetKey={1}
      />
    );

    // Create a mock file and simulate upload
    const file = createMockFile();
    
    // Mock FileReader
    const originalFileReader = global.FileReader;
    const mockFileReaderInstance = {
      readAsDataURL: jest.fn(),
      onloadend: null,
      result: 'data:image/jpeg;base64,mockdata',
    };
    const mockFileReader = jest.fn(() => mockFileReaderInstance);
    global.FileReader = mockFileReader as any;

    // Get the file input and trigger upload
    const input = screen.getByLabelText(/file input/i);
    fireEvent.change(input, { target: { files: [file] } });
    
    // Simulate FileReader onloadend
    if (mockFileReaderInstance.onloadend) {
      (mockFileReaderInstance.onloadend as any)();
    }

    // Change the resetKey prop
    rerender(
      <BlueprintUploader 
        onUpload={mockHandlers.onUpload!}
        resetKey={2}
      />
    );

    // Verify that the file preview is no longer shown
    expect(screen.queryByText(file.name)).not.toBeInTheDocument();
    
    // Clean up - restore FileReader
    global.FileReader = originalFileReader;
  });
});