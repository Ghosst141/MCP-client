// import React from 'react'
import type { Message } from '../types';
import ChatMessage from './ChatMessage';

function MessageList({ messages, loading, streamingMessageId, messagesEndRef, messagesLoading }: { 
    messages: Message[]; 
    loading: boolean; 
    messagesLoading: boolean;
    streamingMessageId: number | null;
    messagesEndRef: React.RefObject<HTMLDivElement | null> 
}) {
    return (
        <>
            <div className="messages-container">
                {messages.length === 0 && !messagesLoading && (
                    <div className="welcome-center">
                        <h2>Welcome, User</h2>
                        <p>Select a mode and ask me anything!</p>
                    </div>
                )}

                {messagesLoading ? (
                    // Show skeleton messages while loading
                    <div className="welcome-center loading-messages">
                        <h2>Loading...</h2>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <ChatMessage
                            key={index}
                            msg={msg}
                            index={index}
                            isStreaming={streamingMessageId === msg.timestamp}
                        />
                    ))
                )}

                {loading && (
                    <div className="message ai">
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </>
    )
}

export default MessageList