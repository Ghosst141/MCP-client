import React from 'react'
import type { Message } from '../types';
import ChatMessage from './ChatMessage';
// import { useParams } from 'react-router-dom';


interface MessageListProps {
    messages: Message[];
    loading: boolean;
    messagesLoading: boolean;
    streamingMessageId: number | null;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    isOrphanMessage: (msgIndex: number) => boolean;
    handleRetry: (msgIndex: number) => Promise<void>;
    retryingMessageIndex: number | null;
    retryScrollRef?: React.RefObject<HTMLDivElement | null>;
}

function MessageList({
    messages,
    loading,
    streamingMessageId,
    messagesEndRef,
    messagesLoading,
    isOrphanMessage,
    handleRetry,
    retryingMessageIndex,
    retryScrollRef
}: MessageListProps) {
    // Create refs for each message
    // const messageRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    React.useEffect(() => {
        // If retrying, scroll to the retried AI message
        if (retryingMessageIndex !== null && retryScrollRef && retryScrollRef.current) {
            retryScrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [retryingMessageIndex, retryScrollRef]);
    // const {id} = useParams();
    // const activeChatIdRef=useRef(id)

    const renderedMessages = React.useMemo(() => {
        return messages.map((msg, index) => {
            // Attach ref to the retried AI message
            const isRetriedAI = retryingMessageIndex !== null && index === retryingMessageIndex + 1 && msg.sender === 'ai';
            const showRetryIndicatorBelow = (retryingMessageIndex !== null && index === retryingMessageIndex + 1 && msg.sender === 'ai') ;

            return (
                <React.Fragment key={index}>
                    <div>
                        <ChatMessage
                            msg={msg}
                            index={index}
                            isStreaming={streamingMessageId === msg.messageId}
                            isOrphan={isOrphanMessage(index)}
                            onRetry={() => handleRetry(index)}
                            isRetrying={(retryingMessageIndex === index)}
                            loading={loading}
                        />
                        {/* Place the ref at the end of the generated AI message */}
                        {isRetriedAI && <div ref={retryScrollRef} />}
                    </div>
                    {/* Show typing indicator below the AI message after retry */}
                    {showRetryIndicatorBelow && (
                        <div className="message ai">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}
                </React.Fragment>
            );
        });
    }, [messages, streamingMessageId, isOrphanMessage, handleRetry, retryingMessageIndex, retryScrollRef]);

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
                ) : renderedMessages}

                {loading && retryingMessageIndex === null && (
                    <div className="message ai">
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
                <div style={{ position: 'fixed', top: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px', fontSize: '12px', zIndex: 9999 }}>
                    <div>Loading: {loading ? 'true' : 'false'}</div>
                    <div>Streaming ID: {streamingMessageId}</div>
                    <div>Retry Index: {retryingMessageIndex}</div>
                    <div>Messages with empty AI text: {messages.filter(m => m.sender === 'ai' && (!m.text || m.text === '')).length}</div>
                </div>
            </div>
        </>
    );
}

export default MessageList;