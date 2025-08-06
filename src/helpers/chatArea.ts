import type { FileAttachment, Message } from "../types";

const sendInitialMessage = async (
  text: string,
  attachedFiles: FileAttachment[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  mcpOption: string,
  chatId: string | undefined
) => {
  const userMessage: Message = {
    sender: 'user',
    text: text,
    files: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    timestamp: Date.now()
  };

  setMessages(prev => [...prev, userMessage]);
  setLoading(true);

  const apiUrl = 'http://localhost:3001/query';

  try {
    const formData = new FormData();
    formData.append('query', text);
    formData.append('mode', mcpOption);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data = await response.json();
    const responseText: string = data.content;

    const points: string[] = responseText
      .split('\n')
      .filter(point => point.trim() !== '');

    const aiResponse: Message = {
      sender: 'ai',
      text: points,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, aiResponse]);

  } catch (error) {
    console.error('Error contacting backend:', error);
    const errorResponse: Message = {
      sender: 'ai',
      text: `Error: Failed to get response for ${mcpOption} mode. Please check the console and try again.`,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, errorResponse]);
    if (chatId) {
      try {
        await fetch(`http://localhost:3000/api/chats/${chatId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: "user123", // replace with real user
            question: text,
            answer: errorResponse.text,
            img: attachedFiles?.[0] || undefined,
          }),
        });
      } catch (error) {
        console.error('Error saving chat to database:', error);
      }
    }
    
  } finally {
    setLoading(false);
    
  }
};

export { sendInitialMessage };
