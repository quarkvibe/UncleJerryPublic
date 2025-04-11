import React, { useState, useRef, useEffect } from 'react';
import { BlueprintUploaderProps } from '../../types/components';
import './styles.css';

const BlueprintUploader: React.FC<BlueprintUploaderProps> = ({
  onFileChange,
  onTradeChange,
  isUploading = false,
  acceptedFileTypes = 'image/*',
  trade = 'electrical',
  onUpload,
  isAnalyzing = false,
  label,
  multiple = false,
  maxSizeInMB = 10,
  resetKey = 0
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Reset component state when resetKey changes
  useEffect(() => {
    setFileName('');
    setPreviewUrl(null);
    setError(null);
  }, [resetKey]);

  const validateFile = (file: File): boolean => {
    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSizeInMB) {
      setError(`File size exceeds ${maxSizeInMB}MB limit`);
      return false;
    }

    // Check file type if acceptedFileTypes is provided
    if (acceptedFileTypes && acceptedFileTypes !== '*') {
      const acceptedTypes = acceptedFileTypes.split(',').map(type => type.trim());
      
      // Handle wildcards like 'image/*'
      const fileType = file.type;
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return fileType.startsWith(`${category}/`);
        }
        return type === fileType;
      });
      
      if (!isValidType) {
        setError(`Invalid file type. Accepted types: ${acceptedFileTypes}`);
        return false;
      }
    }
    
    setError(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setError(null);
      const selectedFile = multiple ? e.target.files[0] : e.target.files[0];
      
      if (!validateFile(selectedFile)) {
        return;
      }
      
      setFileName(selectedFile.name);
      setIsLoading(true);
      
      // Process the file
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setIsLoading(false);
        
        // Call the appropriate callback
        if (onUpload) {
          onUpload(selectedFile);
        } else if (onFileChange) {
          onFileChange(selectedFile);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
        setIsLoading(false);
      };
      
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleTradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onTradeChange) {
      onTradeChange(e.target.value);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setError(null);
      const droppedFile = e.dataTransfer.files[0];
      
      if (!validateFile(droppedFile)) {
        return;
      }
      
      setFileName(droppedFile.name);
      setIsLoading(true);
      
      // Create preview
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setIsLoading(false);
        
        // Call the appropriate callback
        if (onUpload) {
          onUpload(droppedFile);
        } else if (onFileChange) {
          onFileChange(droppedFile);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
        setIsLoading(false);
      };
      
      reader.readAsDataURL(droppedFile);
    }
  };

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Function to reset the uploader state
  const resetUploader = () => {
    setFileName('');
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="blueprint-uploader">
      <div className="uploader-section">
        {onTradeChange && (
          <div className="trade-selector">
            <label htmlFor="trade-select">Select Trade:</label>
            <select 
              id="trade-select"
              value={trade}
              onChange={handleTradeChange}
              disabled={isUploading || isAnalyzing}
            >
              <option value="electrical">Electrical</option>
              <option value="plumbing">Plumbing</option>
              <option value="hvac">HVAC/Mechanical</option>
              <option value="framing">Framing</option>
              <option value="flooring">Flooring</option>
            </select>
          </div>
        )}
        
        {label && <div className="uploader-label">{label}</div>}
        
        <div 
          className={`file-drop-area ${dragActive ? 'active' : ''} ${previewUrl ? 'has-preview' : ''} ${isLoading ? 'loading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileSelector}
          role="button"
          tabIndex={0}
          aria-label="Upload blueprint by dragging and dropping or clicking to browse files"
        >
          <input 
            type="file"
            ref={fileInputRef}
            className="file-input"
            accept={acceptedFileTypes}
            onChange={handleFileChange}
            disabled={isUploading || isAnalyzing}
            multiple={multiple}
            aria-label="File input"
          />
          
          {isLoading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Processing file...</p>
            </div>
          )}
          
          {!isLoading && previewUrl ? (
            <div className="file-preview">
              <img src={previewUrl} alt="Blueprint preview" />
              <p className="file-name">{fileName}</p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  resetUploader();
                }}
                className="remove-file"
                disabled={isUploading || isAnalyzing}
                aria-label="Remove file"
              >
                ×
              </button>
            </div>
          ) : (
            !isLoading && (
              <div className="upload-message">
                <div className="upload-icon">📄</div>
                <p>{label || 'Drag blueprint here or click to upload'}</p>
                <p className="upload-hint">Supports JPG, PNG, PDF (Max {maxSizeInMB}MB)</p>
              </div>
            )
          )}
          
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default BlueprintUploader;