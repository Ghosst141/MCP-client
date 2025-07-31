// import React from 'react'
import type { Message } from '../types';
import ChatMessage from './ChatMessage';

function MessageList({ messages, loading, messagesEndRef }: { messages: Message[]; loading: boolean; messagesEndRef: React.RefObject<HTMLDivElement | null> }) {
    return (
        <>
            <div className="messages-container">
                {messages.length === 0 && (
                    <div className="welcome-center">
                        <h2>Welcome, User</h2>
                        <p>Select a mode and ask me anything!</p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <ChatMessage
                        key={index}
                        msg={msg}
                        index={index}
                    />
                ))}

                {loading && (
                    <div className="message ai">
                        <i>Typing...</i>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </>
    )
}

export default MessageList