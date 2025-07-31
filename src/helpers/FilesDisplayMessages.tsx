// import React from 'react'

import type { FileAttachment } from "../types";

function FilesDisplayMessages({ imageFiles, otherFiles, formatFileSize }: {
    imageFiles: FileAttachment[];
    otherFiles: FileAttachment[];
    formatFileSize: (bytes: number) => string;
}) {
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
                            />
                        ))}
                    </div>
                )}

                {/* Other (non-image) files */}
                {otherFiles.length > 0 && (
                    <div className="message-files">
                        {otherFiles.map((file, fileIndex) => (
                            <div key={fileIndex} className="message-file-item">
                                <div className="file-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
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
        </>
    )
}

export default FilesDisplayMessages