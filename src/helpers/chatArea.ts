// import type { FileAttachment, Message } from "../types";

import type { FileAttachment } from "../types";

const saveAiMessage = async (
  chatId: string,
  userID: string,
  fullResponse: string,
  updateChatTimestamp: (chatId: string) => void,
  refreshChats: () => void
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

    updateChatTimestamp(chatId);
    return true;
  } catch (error) {
    console.error('Error saving user message:', error);
    return false;
  }
};

const saveModelMessage = async(
  chatId: string,
  userID: string,
  answer: string,
)=>{
  try {
    const response = await fetch(`http://localhost:3000/api/chats/${chatId}/ai`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userID,
        answer,
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

export { saveAiMessage, saveUserMessage, saveModelMessage };
