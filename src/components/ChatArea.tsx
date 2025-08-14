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
import { saveAiMessage, handleRetryMessage, isOrphanMessage } from '../helpers/chatArea';
// import { SideContext } from '../contexts/SidebarContext';


export default function ChatArea() {
  const { id: chatId } = useParams();
  const activeChatIdRef = useRef(chatId);

  const Navigate = useNavigate();
  const { input, setInput, messages, loading, streamingMessageId, setStreamingMessageId, mcpOption, setMcpOption, handleSend, handlePaste,
    attachedFiles, removeAttachedFile, handleFileUpload, setMessages, setLoading, fileLoading } = useChat(chatId);
  const [open, setOpen] = useState<boolean>(false);
  const textareaRef = useRef<HTMLDivElement | null>(null);
  const geminiModel = useChatModel();
  const [initialMessageProcessed, setInitialMessageProcessed] = useState<boolean>(false);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [retryingMessageIndex, setRetryingMessageIndex] = useState<number | null>(null);

  const options: string[] = ['Job Portal', 'Normal'];
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const retryScrollRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useClickOutside(() => setOpen(false));
  const hasScrolledOnLoad = useRef<boolean>(false);
  const userScrollRef = useRef<boolean>(false);

  useEffect(() => {
    // Only scroll if this chat is actively streaming or loading and NOT retrying
    const isThisChatStreaming = streamingMessageId !== null;
    const isThisChatLoading = loading;

    if ((isThisChatStreaming || isThisChatLoading) && retryingMessageIndex === null && !userScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, streamingMessageId, retryingMessageIndex]);

  useEffect(() => {
    userScrollRef.current = false;
    
    if (messages.length > 0 && !messagesLoading && !hasScrolledOnLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      hasScrolledOnLoad.current = true;
    }
  }, [messages.length, messagesLoading]);


  // const context = useContext(SideContext);
  // const setSelectedChatId = context?.setSelectedChatId;

  useEffect(() => {
    if (activeChatIdRef.current !== chatId) {
      setRetryingMessageIndex(null);
    }
    hasScrolledOnLoad.current = false;
  }, [chatId]);

  useEffect(() => {
    if (retryingMessageIndex !== null && retryScrollRef.current && !userScrollRef.current) {
      retryScrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [messages, retryingMessageIndex]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (!loading && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      userScrollRef.current = false; // Set to true to prevent auto-scroll during send
      handleSend(textareaRef);
    }
  };

  const checkIsOrphanMessage = (msgIndex: number): boolean => {
    return isOrphanMessage(messages, msgIndex);
  };

  const handleRetry = async (msgIndex: number) => {
    userScrollRef.current = false;
    await handleRetryMessage(
      msgIndex,
      messages,
      geminiModel,
      chatId as string,
      setMessages,
      setStreamingMessageId,
      pushOngoingChat,
      popOngoingChat,
      updateChatTimestamp,
      refreshChats,
      setRetryingMessageIndex,
      activeChatIdRef,
      setLoading
    );
    console.log("will this got called");

    setLoading(false);
    setStreamingMessageId(null);
    setRetryingMessageIndex(null);
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

  useEffect(() => {
    if (!chatId) {
      Navigate('/');
      return;
    }
    const ongoing = onGoingChat?.find(chat => chat.chatId === chatId);
    if (ongoing) {
      // console.log("or here full show");
      // console.log(ongoing);
      setLoading(true);
      setStreamingMessageId(ongoing.messageId);
      if (ongoing.retry) {
        setRetryingMessageIndex(ongoing.retry);
      }
      const hasAiMessage = messages.some(msg => (msg.timestamp === ongoing.aiMessageId && msg.messageId === ongoing.messageId && msg.sender === 'ai'));
      if (!hasAiMessage && messages.length > 0) {
        const aiResponse: Message = {
          messageId: ongoing.messageId,
          sender: 'ai',
          text: '',
          timestamp: ongoing.aiMessageId
        };
        setMessages(prev => {
          const userMsgIndex = prev.findIndex(
            msg => msg.messageId === ongoing.messageId && msg.sender === 'user'
          );

          if (userMsgIndex === -1) {
            // If user message not found, just append
            return [...prev, aiResponse];
          }

          const newMessages = [...prev];
          newMessages.splice(userMsgIndex + 1, 0, aiResponse);
          return newMessages;
        });
      }
    }
  }, [chatId, onGoingChat, Navigate, messages, setLoading, setMessages, setStreamingMessageId]);

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
        if (data.history.length === 0 && !text && (!firstChatFiles || firstChatFiles.length === 0)) {
          Navigate('/');
          setMessagesLoading(false);
          return;
        }
        const sortedHistory = data.history.sort((a: any, b: any) => {
          const aId = a.messageId || a._id || 0;
          const bId = b.messageId || b._id || 0;
          return aId.toString().localeCompare(bId.toString());
        });
        const mappedMessages: Message[] = sortedHistory.map((item: any) => {
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
        if ((text || (firstChatFiles && firstChatFiles.length > 0)) && !initialMessageProcessed && geminiModel) {
          setInitialMessageProcessed(true);
          let aiMessageId: number | null = null;
          const messageId = firstChatData?.messageId;
          setLoading(true);
          try {
            let prompt = text || '';
            if (firstChatFiles && firstChatFiles.length > 0) {
              const fileInfo = firstChatFiles.map(file => `File: ${file.name} (${file.type})`).join(', ');
              prompt = prompt ? `${prompt}\n\nAttached files: ${fileInfo}` : `Analyze these files: ${fileInfo}`;
            }
            const result = await geminiModel.generateContentStream(prompt);
            let fullResponse = '';
            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              fullResponse += chunkText;
              if (aiMessageId === null) {
                aiMessageId = Date.now() + 1;
                const aiResponse: Message = {
                  messageId: messageId,
                  sender: 'ai',
                  text: '',
                  timestamp: aiMessageId
                };
                setMessages(prev => [...prev, aiResponse]);
                pushOngoingChat(chatId as any, aiMessageId, messageId);
              }
              else {
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
              await saveAiMessage(chatId, "user123", fullResponse, updateChatTimestamp, refreshChats, messageId);
              popOngoingChat(chatId || "", aiMessageId);
            }
            setFirstChat(null);
          } catch (error) {
            const errorText = `Error: Failed to get response from Gemini. ${error instanceof Error ? error.message : 'Please try again.'}`;
            setMessages(prev =>
              prev.map(msg =>
                (msg.timestamp === aiMessageId && msg.messageId === messageId)
                  ? { ...msg, text: errorText }
                  : msg
              )
            );
            if (chatId) {
              await saveAiMessage(chatId, "user123", errorText, updateChatTimestamp, refreshChats, messageId);
            }
            setFirstChat(null);
          } finally {
            setLoading(false);
          }
        }
      } catch {
        setMessagesLoading(false);
        Navigate('/');
      }
    };
    if (chatId) {
      fetchChat();
    }
  }, [chatId, text, firstChatFiles, mcpOption, geminiModel, initialMessageProcessed]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files);
    }
    event.target.value = '';
  };

  useEffect(() => {
    if (!chatId && !text && (!firstChatFiles || firstChatFiles.length === 0) && messages.length === 0) {
      Navigate("/");
    }
  }, [chatId, text, firstChatFiles, messages.length, Navigate]);

  useEffect(() => {
    const checkChatExists = async () => {
      if (!chatId || text) return;
      try {
        const res = await fetch(`http://localhost:3000/api/chats/${chatId}?userId=user123`);
        if (!res.ok && res.status === 404) {
          Navigate("/");
        }
      } catch (e) {
        console.log("Error fetching chat:", e);
      }
    };
    checkChatExists();
  }, [chatId, text, Navigate]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 5; // 5px tolerance

    if (!isAtBottom) {
      userScrollRef.current = true;
    } else {
      userScrollRef.current = false;
    }
  };
  return (
    <div className="chat-area">
      <div className='header-area'>
        <Header />
      </div>
      <div className='messages-body' onScroll={handleScroll}>
        <MessageList
          messages={messages}
          loading={loading}
          messagesLoading={messagesLoading}
          streamingMessageId={streamingMessageId}
          messagesEndRef={messagesEndRef}
          isOrphanMessage={checkIsOrphanMessage}
          handleRetry={handleRetry}
          retryingMessageIndex={retryingMessageIndex}
          retryScrollRef={retryScrollRef}
        />
      </div>
      <div className="input-wrapper">
        <InputArea
          input={input}
          setInput={setInput}
          textareaRef={textareaRef}
          scrollRef={userScrollRef}
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