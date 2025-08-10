// import React from 'react'
import type { Message } from '../types/index'
import FilesDisplayMessages from './FilesDisplayMessages';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

// Utility function to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

function ChatMessage({ msg, index, isStreaming = false }: { msg: Message; index: number; isStreaming?: boolean }) {
    const imageFiles = msg.files?.filter(file => file.type.startsWith('image/')) || [];
    const otherFiles = msg.files?.filter(file => !file.type.startsWith('image/')) || [];

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
                {(msg.text && msg.text !== '') || (msg.sender === 'ai' && Array.isArray(msg.text)) || (isStreaming && msg.sender === 'ai') ? (
                    <div key={index} className={`message ${msg.sender}`}>
                        {isStreaming && (!msg.text || msg.text === '') ? (
                            <div></div>
                        ) : msg.sender === 'ai' && Array.isArray(msg.text) ? (
                            <ul>
                                {msg.text.map((point, i) => (
                                    <li key={i}>{point}</li>
                                ))}
                            </ul>
                        ) : msg.sender === 'ai' ? (
                            <div className='markdown-content'>
                                <Markdown rehypePlugins={[rehypeHighlight]}>{msg.text as any}</Markdown>
                            </div>
                        ) : (
                            <span style={{ whiteSpace: "pre-wrap" }}>{msg.text}</span>
                        )}
                    </div>
                ) : null}
            </div>
        </>
    )
}

export default ChatMessage