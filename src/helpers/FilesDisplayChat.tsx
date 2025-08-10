import { useState } from 'react';
import type { FileAttachment } from '../types';
import FilePreviewModal from '../components/FilePreviewModal';
import './FilesDisplay.css';

function FilesDisplayChat({ attachedFiles, removeAttachedFile, formatFileSize, fileLoading }: {
    attachedFiles: FileAttachment[];
    removeAttachedFile: (index: number) => void;
    formatFileSize: (bytes: number) => string;
    fileLoading?: boolean;
}) {
    const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
    return (
        <>
            {(attachedFiles.length > 0 || fileLoading) && (
                <div className="attached-files">
                    <div className="attached-files-header">
                        {fileLoading ? (
                            <span>Processing files...</span>
                        ) : (
                            <span>{attachedFiles.length} file{attachedFiles.length > 1 ? 's' : ''} attached</span>
                        )}
                    </div>
                    {fileLoading && (
                        <div className="file-loading-indicator">
                            <div className="loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}
                    <div className="attached-files-list">
                        {attachedFiles.map((file, index) => (
                            <div key={index} className="attached-file-item">
                                <div 
                                    className="file-info"
                                    onClick={() => setPreviewFile(file)}
                                    style={{ 
                                        cursor: 'pointer',
                                        flex: 1
                                    }}
                                    title="Click to preview"
                                >
                                    <div className="file-name">{file.name}</div>
                                    <div className="file-size">{formatFileSize(file.size)}</div>
                                </div>
                                <button
                                    className="remove-file-btn"
                                    onClick={() => removeAttachedFile(index)}
                                    title="Remove file"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {previewFile && (
                <FilePreviewModal
                    file={previewFile}
                    isOpen={!!previewFile}
                    onClose={() => setPreviewFile(null)}
                    formatFileSize={formatFileSize}
                />
            )}
        </>
    )
}

export default FilesDisplayChat