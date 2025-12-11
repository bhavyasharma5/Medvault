import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

// Icons as SVG components
const Icons = {
  Document: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  Folder: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  CloudUpload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      <polyline points="16 16 12 12 8 16" />
    </svg>
  ),
  Medical: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  FolderOpen: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  )
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Toast Component
const Toast = ({ message, type, onClose }) => (
  <div className={`toast toast--${type}`}>
    <span className="toast__icon">
      {type === 'success' ? <Icons.Check /> : <Icons.AlertCircle />}
    </span>
    <span className="toast__message">{message}</span>
    <button className="toast__close" onClick={onClose}>
      <Icons.X />
    </button>
  </div>
);

// Document Card Component
const DocumentCard = ({ document, onDownload, onDelete, isDeleting }) => (
  <div className="document-card" style={{ animationDelay: `${document.id * 0.05}s` }}>
    <div className="document-card__icon">
      <Icons.FileText />
    </div>
    <div className="document-card__info">
      <div className="document-card__name" title={document.filename}>
        {document.filename}
      </div>
      <div className="document-card__meta">
        <span>{formatFileSize(document.filesize)}</span>
        <span>{formatDate(document.created_at)}</span>
      </div>
    </div>
    <div className="document-card__actions">
      <button 
        className="action-btn action-btn--download"
        onClick={() => onDownload(document)}
        title="Download"
      >
        <Icons.Download />
      </button>
      <button 
        className="action-btn action-btn--delete"
        onClick={() => onDelete(document.id)}
        disabled={isDeleting}
        title="Delete"
      >
        <Icons.Trash />
      </button>
    </div>
  </div>
);

// Empty State Component
const EmptyState = () => (
  <div className="empty-state">
    <div className="empty-state__icon">
      <Icons.FolderOpen />
    </div>
    <p className="empty-state__text">No documents uploaded yet</p>
    <p className="empty-state__hint">Upload your first PDF to get started</p>
  </div>
);

// Loading Skeleton
const LoadingSkeleton = () => (
  <>
    {[1, 2, 3].map((i) => (
      <div key={i} className="skeleton skeleton-card" style={{ animationDelay: `${i * 0.1}s` }} />
    ))}
  </>
);

// Main App Component
function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Show toast notification
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Remove toast
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch all documents
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents`);
      if (response.data.success) {
        setDocuments(response.data.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      showToast('Failed to load documents. Is the server running?', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showToast('Please select a PDF file', 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size exceeds 10MB limit', 'error');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showToast('Please select a PDF file', 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size exceeds 10MB limit', 'error');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        showToast('Document uploaded successfully!', 'success');
        setSelectedFile(null);
        fetchDocuments();
      }
    } catch (error) {
      console.error('Upload error:', error);
      const message = error.response?.data?.message || 'Failed to upload document';
      showToast(message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle document download
  const handleDownload = async (document) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents/${document.id}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement ? window.document.createElement('a') : null;
      if (link) {
        link.href = url;
        link.setAttribute('download', document.filename);
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      showToast('Download started!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download document', 'error');
    }
  };

  // Handle document deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await axios.delete(`${API_BASE_URL}/documents/${id}`);
      if (response.data.success) {
        showToast('Document deleted successfully', 'success');
        fetchDocuments();
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete document', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__logo">
          <div className="header__icon">
            <Icons.Medical />
          </div>
          <h1 className="header__title">MedVault</h1>
        </div>
        <p className="header__subtitle">Secure Patient Document Portal</p>
      </header>

      {/* Main Content */}
      <main className="main-grid">
        {/* Upload Section */}
        <section className="card upload-section">
          <h2 className="card__title">
            <span className="card__title-icon"><Icons.Upload /></span>
            Upload Document
          </h2>

          <div 
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              type="file"
              id="file-input"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
            />
            <div className="upload-zone__icon">
              <Icons.CloudUpload />
            </div>
            <p className="upload-zone__text">
              <strong>Click to upload</strong> or drag and drop
            </p>
            <p className="upload-zone__hint">PDF files only (max 10MB)</p>
          </div>

          {/* Selected File Preview */}
          {selectedFile && (
            <div className="selected-file">
              <div className="selected-file__icon">
                <Icons.FileText />
              </div>
              <div className="selected-file__info">
                <div className="selected-file__name">{selectedFile.name}</div>
                <div className="selected-file__size">{formatFileSize(selectedFile.size)}</div>
              </div>
              <button 
                className="selected-file__remove"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
              >
                <Icons.X />
              </button>
            </div>
          )}

          {/* Upload Button */}
          <button 
            className="upload-btn"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <span className="spinner"></span>
                Uploading...
              </>
            ) : (
              <>
                <Icons.Upload />
                Upload Document
              </>
            )}
          </button>
        </section>

        {/* Documents Section */}
        <section className="card documents-section">
          <div className="documents-header">
            <h2 className="card__title">
              <span className="card__title-icon"><Icons.Folder /></span>
              My Documents
            </h2>
            <span className="documents-count">{documents.length} files</span>
          </div>

          <div className="document-list">
            {isLoading ? (
              <LoadingSkeleton />
            ) : documents.length === 0 ? (
              <EmptyState />
            ) : (
              documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  isDeleting={deletingId === doc.id}
                />
              ))
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Patient Document Portal &copy; 2025 | Built with React & Express</p>
      </footer>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default App;

