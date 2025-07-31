// import React from 'react'

function FilesDisplayChat({ attachedFiles, removeAttachedFile, formatFileSize }: {
    attachedFiles: { name: string; size: number }[];
    removeAttachedFile: (index: number) => void;
    formatFileSize: (bytes: number) => string;
}) {
    return (
        <>
            {attachedFiles.length > 0 && (
                <div className="attached-files">
                    <div className="attached-files-header">
                        <span>{attachedFiles.length} file{attachedFiles.length > 1 ? 's' : ''} attached</span>
                    </div>
                    <div className="attached-files-list">
                        {attachedFiles.map((file, index) => (
                            <div key={index} className="attached-file-item">
                                <div className="file-info">
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
        </>
    )
}

export default FilesDisplayChat