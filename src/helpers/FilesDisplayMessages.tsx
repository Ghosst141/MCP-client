import { useState } from 'react';
import type { FileAttachment } from "../types";
import FilePreviewModal from '../components/FilePreviewModal';
import './FilesDisplay.css';

function FilesDisplayMessages({ imageFiles, otherFiles, formatFileSize }: {
    imageFiles: FileAttachment[];
    otherFiles: FileAttachment[];
    formatFileSize: (bytes: number) => string;
}) {
    const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
    return (
        <>
            <div className='message-files-container'>
                {/* Images collage */}
                {imageFiles.length > 0 && (
                    <div className="image-collage">
                        {imageFiles.map((file, i) => (
                            <img
                                key={i}
                                src={file.content}
                                alt={file.name}
                                className="file-image-preview collage-image"
                                onClick={() => setPreviewFile(file)}
                                style={{ cursor: 'pointer' }}
                                title={`Click to preview ${file.name}`}
                            />
                        ))}
                    </div>
                )}

                {/* Other (non-image) files */}
                {otherFiles.length > 0 && (
                    <div className="message-files">
                        {otherFiles.map((file, fileIndex) => (
                            <div 
                                key={fileIndex} 
                                className="message-file-item"
                                onClick={() => setPreviewFile(file)}
                                style={{ cursor: 'pointer' }}
                                title={`Click to preview ${file.name}`}
                            >
                                <div className="file-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                            stroke="currentColor" strokeWidth="2"
                                            strokeLinecap="round" strokeLinejoin="round" />
                                        <polyline points="14,2 14,8 20,8"
                                            stroke="currentColor" strokeWidth="2"
                                            strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="file-details">
                                    <div className="file-name">{file.name}</div>
                                    <div className="file-size">{formatFileSize(file.size)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
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

export default FilesDisplayMessages