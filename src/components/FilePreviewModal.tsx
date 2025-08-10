import type { FileAttachment } from '../types';
import './FilePreviewModal.css';

interface FilePreviewModalProps {
    file: FileAttachment;
    isOpen: boolean;
    onClose: () => void;
    formatFileSize: (bytes: number) => string;
}

function FilePreviewModal({ file, isOpen, onClose, formatFileSize }: FilePreviewModalProps) {
    if (!isOpen || !file) return null;

    // Validate file data
    const isValidFile = file && file.name && file.type && typeof file.size === 'number';
    if (!isValidFile) {
        console.error('Invalid file data:', file);
        return null;
    }

    const renderPreview = () => {
        if (file.type.startsWith('image/')) {
            return (
                <img
                    src={file.content}
                    alt={file.name}
                    className="preview-image"
                />
            );
        } else if (file.type.startsWith('text/') || file.type === 'application/json') {
            // For text files, the content is already plain text (not base64)
            const textContent = file.content || 'No content available';

            // Create a downloadable data URL for text content
            const createTextDownloadUrl = () => {
                const blob = new Blob([textContent], { type: file.type });
                return URL.createObjectURL(blob);
            };

            return (
                <div className="preview-text-container">
                    <div className="preview-text-header">
                        <span className="preview-label">File Preview</span>
                        <a
                            href={createTextDownloadUrl()}
                            download={file.name}
                            className="download-link"
                        >
                            Download {file.name}
                        </a>
                    </div>
                    <pre className="preview-text">
                        {textContent}
                    </pre>
                </div>
            );
        } else if (file.type === 'application/pdf') {
            return (
                <div className="preview-pdf">
                    <div className="pdf-iframe-container">
                        <iframe
                            src={`${file.content}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
                            title="PDF Preview"
                            className="pdf-iframe"
                        />
                    </div>
                    <div className="pdf-download-section">
                        <p>PDF Document</p>
                        <a
                            href={file.content}
                            download={file.name}
                            className="download-link"
                        >
                            Download {file.name}
                        </a>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="preview-unsupported">
                    <div className="file-icon-large">📄</div>
                    <p>Preview not available for {file.type}</p>
                    <p className="file-info-text">
                        File: {file.name} ({formatFileSize(file.size)})
                    </p>
                    {file.content && (
                        <a
                            href={file.content}
                            download={file.name}
                            className="download-link"
                        >
                            Download File
                        </a>
                    )}
                </div>
            );
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="file-header-info">
                        <h3 className="file-title">{file.name}</h3>
                        <p className="file-meta">
                            {file.type} • {formatFileSize(file.size)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="close-button"
                        title="Close preview"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
                <div className="modal-body">
                    {renderPreview()}
                </div>
            </div>
        </div>
    );
}

export default FilePreviewModal;
