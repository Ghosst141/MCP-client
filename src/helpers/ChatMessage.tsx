// import React from 'react'
import type { Message } from '../types/index'
import FilesDisplayMessages from './FilesDisplayMessages';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
// import { useParams } from 'react-router-dom';

// Utility function to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

function ChatMessage({ 
    msg, 
    index, 
    isStreaming = false, 
    isOrphan = false, 
    onRetry,
    isRetrying = false,
    loading
}: { 
    msg: Message; 
    index: number; 
    isStreaming?: boolean;
    isOrphan?: boolean;
    onRetry?: () => Promise<void>;
    isRetrying?: boolean;
    loading:boolean
}) {
    // const {id}=useParams()
    const imageFiles = msg.files?.filter(file => file.type.startsWith('image/')) || [];
    const otherFiles = msg.files?.filter(file => !file.type.startsWith('image/')) || [];
    // console.log("from current chat", isStreaming, id);

    return (
        <>
            <div className='chat-container'>
                {msg.files && msg.files.length > 0 && msg.sender === 'user' && (
                    <FilesDisplayMessages
                        imageFiles={imageFiles}
                        otherFiles={otherFiles}
                        formatFileSize={formatFileSize}
                    />
                )}
                {(msg.text && msg.text !== '') || (isStreaming && msg.sender === 'ai') ? (
                    <div key={index} className={`message ${msg.sender} ${msg.text!==''? "":"msg-disable"}`}>
                        {isStreaming && (!msg.text || msg.text === '') ? (
                            <div></div>
                        ) : msg.sender === 'ai' ? (
                            <div className='markdown-content'>
                                <Markdown rehypePlugins={[rehypeHighlight]}>{msg.text as any}</Markdown>
                            </div>
                        ) : (
                            <span style={{ whiteSpace: "pre-wrap" }}>{msg.text}</span>
                        )}
                    </div>
                ) : null}
                
                {/* Retry button for orphan user messages */}
                {isOrphan && msg.sender === 'user' && onRetry && !isRetrying &&!loading && (
                    <div className="retry-container">
                        <button 
                            className="retry-button" 
                            onClick={onRetry}
                            title="Retry - Generate AI response for this message"
                        >
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2"
                            >
                                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
                            </svg>
                            Retry
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}

export default ChatMessage