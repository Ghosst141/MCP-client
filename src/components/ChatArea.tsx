import { useState, useRef, useEffect, type KeyboardEvent, useContext, useMemo } from 'react';
import './ChatArea.css'
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


export default function ChatArea() {

  const { id: chatId } = useParams();
  const Navigate = useNavigate();
  const { input, setInput, messages, loading, mcpOption, setMcpOption, handleSend, handlePaste,
    attachedFiles, removeAttachedFile, handleFileUpload, setMessages, setLoading } = useChat(chatId);
  const [open, setOpen] = useState<boolean>(false);
  const textareaRef = useRef<HTMLDivElement | null>(null);
  const geminiModel = useChatModel(); // Add Gemini model
  const [initialMessageProcessed, setInitialMessageProcessed] = useState<boolean>(false);

  const options: string[] = ['Job Portal', 'Normal'];
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useClickOutside(() => setOpen(false));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
  const { firstchat, setFirstChat, updateChatTimestamp, refreshChats} = contextChat;

  const firstChatData = firstchat;
  const text = firstChatData?.text || '';
  const firstChatFiles = useMemo(() => firstChatData?.files || [], [firstChatData?.files]);

  console.log(chatId);



  useEffect(() => {
    const fetchChat = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/chats/${chatId}?userId=user123`);
        const data = await res.json();

        if (!Array.isArray(data.history)) return;

        // Check if chat has no messages (empty history)
        if (data.history.length === 0 && !text && (!firstChatFiles || firstChatFiles.length === 0)) {
          console.log("Chat has no messages and no firstchat text/files, redirecting to home");
          Navigate('/');
          return;
        }

        const mappedMessages: Message[] = data.history.map((item: any) => {
          const files: FileAttachment[] | undefined = item.files && item.files.length > 0
            ? item.files
            : undefined;

          return {
            sender: item.role === 'user' ? 'user' : 'ai',
            text: item.parts.length > 1 ? item.parts.map((p: any) => p.text) : item.parts[0]?.text || '',
            files,
            timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now(),
          };
        });

        setMessages(mappedMessages);
        console.log("messages", messages);

        // If this is a new chat from dashboard (has firstchat text or files), send initial message to get AI response
        if ((text || (firstChatFiles && firstChatFiles.length > 0)) && !initialMessageProcessed && geminiModel) {
          setInitialMessageProcessed(true); // Mark as processing to prevent duplicate calls
          
          // Add user message first
          const userMessage: Message = {
            sender: 'user',
            text: text,
            files: firstChatFiles.length > 0 ? firstChatFiles : undefined,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, userMessage]);
          
          setLoading(true);

          try {
            // Prepare the prompt
            let prompt = text || '';
            if (firstChatFiles && firstChatFiles.length > 0) {
              const fileInfo = firstChatFiles.map(file => `File: ${file.name} (${file.type})`).join(', ');
              prompt = prompt ? `${prompt}\n\nAttached files: ${fileInfo}` : `Analyze these files: ${fileInfo}`;
            }

            // Call Gemini API
            const result = await geminiModel.generateContent(prompt);
            const responseText = result.response.text();

            // Store raw response
            const aiResponse: Message = {
              sender: 'ai',
              text: responseText,
              timestamp: Date.now()
            };

            setMessages(prev => [...prev, aiResponse]);

            if (chatId) {
              try {
                await fetch(`http://localhost:3000/api/chats/${chatId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: "user123",
                    answer: responseText,
                  }),
                });
                updateChatTimestamp(chatId);
                refreshChats();
              } catch (error) {
                console.error('Error saving AI response to database:', error);
              }
            }

            // Clear firstchat data after successful processing
            setFirstChat(null);

          } catch (error) {
            console.error('Error contacting backend:', error);
            
            const errorResponse: Message = {
              sender: 'ai',
              text: `Error: Failed to get response from Gemini. ${error instanceof Error ? error.message : 'Please try again.'}`,
              timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorResponse]);

            // Save error response to database
            if (chatId) {
              try {
                await fetch(`http://localhost:3000/api/chats/${chatId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: "user123",
                    answer: errorResponse.text,
                  }),
                });
                updateChatTimestamp(chatId);
                refreshChats();
              } catch (error) {
                console.error('Error saving error response to database:', error);
              }
            }

            // Clear firstchat data even on error
            setFirstChat(null);
          } finally {
            setLoading(false);
          }
        }

      } catch (error) {
        console.error("Failed to load chat history: hereeeee", error);
        Navigate('/'); // Redirect to home if chat not found
      }
    };

    if (chatId) {
      fetchChat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  
  // Only redirect if we have no messages AND no chatId AND no firstchat text/files
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
          // Chat was deleted, redirect to home
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
        <MessageList messages={messages} loading={loading} messagesEndRef={messagesEndRef} />
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
        />
      </div>
    </div>

  );
}
