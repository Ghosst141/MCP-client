import { useState, useRef, useEffect, type KeyboardEvent, useContext, useMemo } from 'react';
import './ChatArea.css'
import '../helpers/markdown.css'
import Header from './Header';
import { useClickOutside } from '../hooks/useClickOutside';
import { useChat } from '../hooks/useChat';
import MessageList from '../helpers/MessageList';
import InputArea from '../helpers/InputArea';
import { useNavigate, useParams } from 'react-router-dom';
// import type { Message } from '../types';
import type { FileAttachment, Message } from '../types';
import { chatContext } from '../contexts/ChatContext';
import useChatModel from '../hooks/useChatModel';
import { saveAiMessage } from '../helpers/chatArea';


export default function ChatArea() {

  const { id: chatId } = useParams();
  const Navigate = useNavigate();
  const { input, setInput, messages, loading, streamingMessageId, setStreamingMessageId, mcpOption, setMcpOption, handleSend, handlePaste,
    attachedFiles, removeAttachedFile, handleFileUpload, setMessages, setLoading, fileLoading } = useChat(chatId);
  const [open, setOpen] = useState<boolean>(false);
  const textareaRef = useRef<HTMLDivElement | null>(null);
  const geminiModel = useChatModel(); // Add Gemini model
  const [initialMessageProcessed, setInitialMessageProcessed] = useState<boolean>(false);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);

  const options: string[] = ['Job Portal', 'Normal'];
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useClickOutside(() => setOpen(false));
  const hasScrolledOnLoad = useRef<boolean>(false);

  useEffect(() => {
    // Only scroll if this chat is actively streaming or loading
    const isThisChatStreaming = streamingMessageId !== null;
    const isThisChatLoading = loading;
    
    if (isThisChatStreaming || isThisChatLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, streamingMessageId]);

  // Separate effect for initial scroll when messages are first loaded
  useEffect(() => {
    if (messages.length > 0 && !messagesLoading && !hasScrolledOnLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      hasScrolledOnLoad.current = true;
    }
  }, [messages.length, messagesLoading]);

  // Reset scroll flag when chat changes
  useEffect(() => {
    hasScrolledOnLoad.current = false;
  }, [chatId]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // reset first
      textarea.style.height = `${textarea.scrollHeight}px`; // then set to scrollHeight
    }
  }, [input]);


  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (!loading && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(textareaRef);
    }
  };

  const contextChat = useContext(chatContext);
  if (!contextChat) throw new Error("chatContext is undefined");
  const { firstchat, setFirstChat, updateChatTimestamp, refreshChats } = contextChat;

  const firstChatData = firstchat;
  const text = firstChatData?.text || '';
  const firstChatFiles = useMemo(() => firstChatData?.files || [], [firstChatData?.files]);
  const pushOngoingChat = contextChat?.pushOngoingChat;
  const popOngoingChat = contextChat?.popOngoingChat;
  const onGoingChat = contextChat?.onGoingChat;

  // console.log('onGoingChat:', onGoingChat);


  useEffect(() => {
    if (!chatId) {
      Navigate('/');
      return;
    }

    const ongoing = onGoingChat?.find(chat => chat.chatId === chatId);
    if (ongoing) {
      // console.log(`Found ongoing chat ${chatId} with aiMessageId ${ongoing.aiMessageId}`);
      setLoading(true);
      setStreamingMessageId(ongoing.aiMessageId);

      const hasAiMessage = messages.some(msg => (msg.timestamp === ongoing.aiMessageId && msg.messageId === ongoing.messageId));
      if (!hasAiMessage && messages.length > 0) {
        // console.log(`AI message with timestamp ${ongoing.aiMessageId} not found, creating placeholder`);

        const aiResponse: Message = {
          messageId: ongoing.messageId, // Use the SAME messageId as ongoing stream
          sender: 'ai',
          text: '', // Start with empty text, will be filled by ongoing stream
          timestamp: ongoing.aiMessageId // Use the SAME timestamp as ongoing stream
        };
        setMessages(prev => [...prev, aiResponse]);
      }
    }
  }, [chatId, onGoingChat, Navigate, messages, setLoading, setMessages, setStreamingMessageId]); // Include all dependencies


  useEffect(() => {
    const fetchChat = async () => {
      try {
        setMessagesLoading(true);
        const res = await fetch(`http://localhost:3000/api/chats/${chatId}?userId=user123`);
        const data = await res.json();

        if (!Array.isArray(data.history)) {
          setMessagesLoading(false);
          Navigate('/');
          return;
        }

        // Check if chat has no messages (empty history)
        if (data.history.length === 0 && !text && (!firstChatFiles || firstChatFiles.length === 0)) {
          console.log("Chat has no messages and no firstchat text/files, redirecting to home");
          Navigate('/');
          setMessagesLoading(false);
          return;
        }

        const mappedMessages: Message[] = data.history.map((item: any) => {
          const files: FileAttachment[] | undefined = item.files && item.files.length > 0
            ? item.files
            : undefined;

          return {
            messageId: item.messageId,
            sender: item.role === 'user' ? 'user' : 'ai',
            text: item.parts.length > 1 ? item.parts.map((p: any) => p.text) : item.parts[0]?.text || '',
            files,
            timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now(),
          };
        });

        setMessages(mappedMessages);
        setMessagesLoading(false);

        // If this is a new chat from dashboard (has firstchat text or files), send initial message to get AI response
        if ((text || (firstChatFiles && firstChatFiles.length > 0)) && !initialMessageProcessed && geminiModel) {
          setInitialMessageProcessed(true); // Mark as processing to prevent duplicate calls

          // Create a placeholder AI message for streaming
          let aiMessageId: number | null = null; // Declare outside try-catch to access in error handling
          const messageId = firstChatData?.messageId;
          // Add chat to ongoing chats
          setLoading(true);

          try {
            // Prepare the prompt
            let prompt = text || '';
            if (firstChatFiles && firstChatFiles.length > 0) {
              const fileInfo = firstChatFiles.map(file => `File: ${file.name} (${file.type})`).join(', ');
              prompt = prompt ? `${prompt}\n\nAttached files: ${fileInfo}` : `Analyze these files: ${fileInfo}`;
            }

            // Call Gemini API with streaming
            const result = await geminiModel.generateContentStream(prompt);
            let fullResponse = '';

            // Process the streaming response
            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              fullResponse += chunkText;

              if (aiMessageId === null) {
                aiMessageId = Date.now() + 1; // Ensure unique timestamp
                const aiResponse: Message = {
                  messageId: messageId, // Use the same messageId as user message
                  sender: 'ai',
                  text: '',
                  timestamp: aiMessageId
                };
                setMessages(prev => [...prev, aiResponse]);
                pushOngoingChat(chatId as any, aiMessageId, messageId); // Add to ongoing chats
              }
              else{
                setMessages(prev =>
                  prev.map(msg =>
                    (msg.timestamp === aiMessageId && msg.messageId === messageId)
                      ? { ...msg, text: fullResponse }
                      : msg
                  )
                );
              }
            }

            if (chatId && fullResponse && aiMessageId !== null) {
              await saveAiMessage(chatId, "user123", fullResponse, updateChatTimestamp, refreshChats,messageId);
              popOngoingChat(chatId || "", aiMessageId); // Remove chat from ongoing chats
            }

            // Clear firstchat data after successful processing
            setFirstChat(null);

          } catch (error) {
            console.error('Error contacting backend:', error);

            const errorText = `Error: Failed to get response from Gemini. ${error instanceof Error ? error.message : 'Please try again.'}`;

            // Update the AI message with error
            setMessages(prev =>
              prev.map(msg =>
                (msg.timestamp === aiMessageId && msg.messageId === messageId)
                  ? { ...msg, text: errorText }
                  : msg
              )
            );

            // Save error response to database
            if (chatId) {
              await saveAiMessage(chatId, "user123", errorText, updateChatTimestamp, refreshChats,messageId);
            }

            // Clear firstchat data even on error
            setFirstChat(null);
          } finally {
            setLoading(false);
          }
        }

      } catch (error) {
        console.error("Failed to load chat history: hereeeee", error);
        setMessagesLoading(false);
        Navigate('/'); // Redirect to home if chat not found
      }
    };

    if (chatId) {
      fetchChat();
    }
  }, [chatId, text, firstChatFiles, mcpOption, geminiModel, initialMessageProcessed]);

  // Handle paste events to strip formatting
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files && files.length > 0) {
      await handleFileUpload(files);
    }
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  // This prevents premature redirects when loading a chat
  useEffect(() => {
    if (!chatId && !text && (!firstChatFiles || firstChatFiles.length === 0) && messages.length === 0) {
      Navigate("/");
    }
  }, [chatId, text, firstChatFiles, messages.length, Navigate]);

  // Check if the current chat still exists
  useEffect(() => {
    const checkChatExists = async () => {
      if (!chatId || text) return; // Skip if it's a new chat from dashboard

      try {
        const res = await fetch(`http://localhost:3000/api/chats/${chatId}?userId=user123`);
        if (!res.ok && res.status === 404) {
          Navigate("/");
        }
      } catch (error) {
        console.error("Error checking chat existence:", error);
      }
    };

    checkChatExists();
  }, [chatId, text, Navigate]);


  return (
    <div className="chat-area">
      <div className='header-area'>
        <Header />
      </div>
      <div className='messages-body'>
        <MessageList
          messages={messages}
          loading={loading}
          messagesLoading={messagesLoading}
          streamingMessageId={streamingMessageId}
          messagesEndRef={messagesEndRef}
        />
      </div>

      <div className="input-wrapper">
        <InputArea
          input={input}
          setInput={setInput}
          textareaRef={textareaRef}
          handleKeyDown={handleKeyDown}
          handlePaste={(e) => handlePaste(e, textareaRef)}
          loading={loading}
          handleSend={handleSend}
          mcpOption={mcpOption}
          setMcpOption={setMcpOption}
          options={options}
          open={open}
          setOpen={setOpen}
          dropdownRef={dropdownRef}
          attachedFiles={attachedFiles}
          removeAttachedFile={removeAttachedFile}
          handleFileChange={handleFileChange}
          fileLoading={fileLoading}
        />
      </div>
    </div>

  );
}
