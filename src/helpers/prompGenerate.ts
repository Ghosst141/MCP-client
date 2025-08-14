import type { Message } from "../types";

const userPromptGeneration = async (
    prompt: string,
    messageId: any,
    aiMessageId: number | null,
    geminiModel: any,
    sendingToChatId: string,
    setMessages: (value: React.SetStateAction<Message[]>) => void,
    activeChatIdRef: React.RefObject<string | undefined>,

) => {
    let fullResponse = '';
    const result = await geminiModel.generateContentStream(prompt);
    for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;

        if (activeChatIdRef.current === sendingToChatId) {
            setMessages(prev =>
                prev.map(msg =>
                    (msg.timestamp === aiMessageId && msg.messageId === messageId)
                        ? { ...msg, text: fullResponse }
                        : msg
                )
            );
        }
    }

    return fullResponse;
}

const errorResolveForPrompt = (
    messageId: any,
    errorText: string,
    errorResponse: Message,
    messages: Message[],
    setMessages: (value: React.SetStateAction<Message[]>) => void,
) => {
    const isPresent = messages.findIndex((msg) => {
        return msg.messageId === messageId && msg.sender === 'ai';
    });
    if (isPresent === -1) {
        setMessages(prev => [...prev, errorResponse]);
    }
    else {
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[isPresent]["text"] = errorText;
            return newMessages;
        });
    }
}

const errorResolveForPromptWithRetry = (
    msgIndex: number,
    userMessage: Message,
    errorText: string,
    aiMessageId: number,
    setMessages: (value: React.SetStateAction<Message[]>) => void
) => {
    setMessages(prev => {
        const newMessages = [...prev];
        const nextMsg = newMessages[msgIndex + 1];
        if (nextMsg && nextMsg.sender === 'ai' && nextMsg.messageId === userMessage.messageId) {
          // Update the existing AI message's text
          newMessages[msgIndex + 1] = {
            ...nextMsg,
            text: errorText
          };
        } else {
          // Insert a new error AI message
          const aiResponse: Message = {
            messageId: userMessage.messageId,
            sender: 'ai',
            text: errorText,
            timestamp: aiMessageId
          };
          newMessages.splice(msgIndex + 1, 0, aiResponse);
        }
        return newMessages;
      });
}

export { userPromptGeneration,errorResolveForPrompt, errorResolveForPromptWithRetry }