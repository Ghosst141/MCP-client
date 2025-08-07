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

    // Add files to form data if they exist
    if (attachedFiles.length > 0) {
      formData.append('filesData', JSON.stringify(attachedFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        content: file.content
      }))));
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data = await response.json();
    const responseText: string = data.content;

    // Store raw response instead of splitting into points
    const aiResponse: Message = {
      sender: 'ai',
      text: responseText, // Keep raw response
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
            files: attachedFiles.length > 0 ? attachedFiles : undefined,
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
