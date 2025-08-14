import type { FileAttachment, Message } from "../types";
import { errorResolveForPromptWithRetry, userPromptGeneration } from "./prompGenerate";

const saveAiMessage = async (
  chatId: string,
  userID: string,
  fullResponse: string,
  updateChatTimestamp: (chatId: string) => void,
  refreshChats: () => void,
  messageId?: string
) => {
  try {
    await fetch(`http://localhost:3000/api/chats/${chatId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userID,
        answer: fullResponse,
        messageId: messageId
      }),
    });
    updateChatTimestamp(chatId);
    refreshChats();
  } catch (error) {
    console.error('Error saving AI response to database:', error);
  }
};

const saveUserMessage = async (
  chatId: string,
  userID: string,
  question: string,
  files: FileAttachment[],
  updateChatTimestamp: (chatId: string) => void,
) => {
  try {
    const response = await fetch(`http://localhost:3000/api/chats/${chatId}/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userID,
        question,
        files,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    updateChatTimestamp(chatId);
    return data;
  } catch (error) {
    console.error('Error saving user message:', error);
    return null;
  }
};

const saveModelMessage = async (
  chatId: string,
  userID: string,
  answer: string,
  messageId: any
) => {
  try {
    const response = await fetch(`http://localhost:3000/api/chats/${chatId}/ai`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userID,
        answer,
        messageId
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error saving AI message:', error);
    return false;
  }
}

// Function to detect orphan messages (user messages without AI responses)
const isOrphanMessage = (messages: Message[], msgIndex: number): boolean => {
  const currentMsg = messages[msgIndex];
  if (currentMsg.sender !== 'user') return false;
  
  // Check if the next message is an AI response
  const nextMsg = messages[msgIndex + 1];
  return !nextMsg || nextMsg.sender !== 'ai';
};

// Retry function for orphan messages
const handleRetryMessage = async (
  msgIndex: number,
  messages: Message[],
  geminiModel: any,
  chatId: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setStreamingMessageId: (id: number | null) => void,
  pushOngoingChat: (chatId: string, aiMessageId: number, messageId: any,retry?: number) => void,
  popOngoingChat: (chatId: string, aiMessageId: number) => void,
  updateChatTimestamp: (chatId: string) => void,
  refreshChats: () => void,
  setRetryingMessageIndex: (index: number | null) => void,
  activeChatIdRef: any,
  setLoading: (loading: boolean) => void
): Promise<void> => {
  const userMessage = messages[msgIndex];
  if (!userMessage || userMessage.sender !== 'user' || !geminiModel) return;
  const aiMessageId = Date.now();

  try {
    // Set retry state to show inline typing indicator
    setRetryingMessageIndex(msgIndex);
    setLoading(true);
    // Generate unique IDs for the retry response
    const messageId = userMessage.messageId;

    // Prepare the prompt from the user message
    let prompt = userMessage.text as string || '';
    if (userMessage.files && userMessage.files.length > 0) {
      const fileInfo = userMessage.files.map(file => `File: ${file.name} (${file.type})`).join(', ');
      prompt = prompt ? `${prompt}\n\nAttached files: ${fileInfo}` : `Analyze these files: ${fileInfo}`;
    }

    // Create placeholder AI message and insert it after the user message
    const aiResponse: Message = {
      messageId: messageId,
      sender: 'ai',
      text: '',
      timestamp: aiMessageId
    };

    // Insert the AI response right after the user message
    setMessages(prev => {
      const newMessages = [...prev];
      newMessages.splice(msgIndex + 1, 0, aiResponse);
      return newMessages;
    });

    // Add to ongoing chats for streaming
    pushOngoingChat(chatId, aiMessageId, messageId, msgIndex);
    setStreamingMessageId(messageId);

    // Call Gemini API with streaming
    const fullResponse = await userPromptGeneration(prompt, messageId, aiMessageId, geminiModel, chatId, setMessages, activeChatIdRef);

    popOngoingChat(chatId, aiMessageId);
    setLoading(false)


    // Save the AI response to database
    if (chatId && fullResponse) {
      await saveAiMessage(chatId, "user123", fullResponse, updateChatTimestamp, refreshChats, messageId);
    }

    // Clean up
    setStreamingMessageId(null);

  } catch (error) {
    console.error('Error during retry:', error);

    const errorText = `Error: Failed to get response from Gemini. ${error instanceof Error ? error.message : 'Please try again.'}`;

    // Check if an AI message already exists after the user message
    if (activeChatIdRef.current === chatId) {
      errorResolveForPromptWithRetry(msgIndex, userMessage, errorText, aiMessageId, setMessages);
    }
    console.log("idhar pahuch nii paya kya popOngoing m catch ke");
    
    popOngoingChat(chatId, aiMessageId);
    setLoading(false)


    // Save error response to database
    if (chatId) {
      await saveAiMessage(chatId, "user123", errorText, updateChatTimestamp, refreshChats, userMessage.messageId);
    }
  } finally {
    // Clear retry state
    setLoading(false)
    setStreamingMessageId(null);
    setRetryingMessageIndex(null);
    console.log("and this call");
    popOngoingChat(chatId, aiMessageId);
  }
};

export { saveAiMessage, saveUserMessage, saveModelMessage, isOrphanMessage, handleRetryMessage };