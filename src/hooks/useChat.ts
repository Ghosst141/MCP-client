import { useContext, useState, useEffect } from "react";
import type { Message, FileAttachment } from "../types/index";
import { chatContext } from "../contexts/ChatContext";
import useChatModel from "./useChatModel";
import { saveModelMessage, saveUserMessage } from "../helpers/chatArea";

export function useChat(chatId?: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [fileLoading, setFileLoading] = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string | undefined>(chatId);
    const [mcpOption, setMcpOption] = useState('select');
    const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);

    const context = useContext(chatContext);
    const updateChatTimestamp = context?.updateChatTimestamp;
    const geminiModel = useChatModel(); // Add Gemini model
    const pushOngoingChat = context?.pushOngoingChat;
    const popOngoingChat = context?.popOngoingChat;

    // Cleanup when chat changes
    useEffect(() => {
        if (currentChatId !== chatId) {
            // Clear streaming state when switching chats
            setStreamingMessageId(null);
            setLoading(false);
            setFileLoading(false);
            setCurrentChatId(chatId);
        }
    }, [chatId, currentChatId]);

    const handleSend = async (textareaRef: React.RefObject<HTMLDivElement | null>): Promise<void> => {
        if (!input.trim() && attachedFiles.length === 0) return;

        // Store values before clearing state
        const currentInput = input.trim();
        const currentFiles = [...attachedFiles];
        const sendingToChatId = chatId;

        if (!sendingToChatId) {
            console.error('No chat ID available');
            return;
        }

        // Set loading state first
        let aiMessageId: number | null = null; // Declare outside try-catch to access in error handling
        let messageId: any = null;
        try {
            // 1. Save user message to database FIRST
            const isUserMessageSaved = await saveUserMessage(
                sendingToChatId,
                "user123",
                currentInput,
                currentFiles,
                updateChatTimestamp as (chatId: string) => void
            );
            console.log(isUserMessageSaved);

            if (!isUserMessageSaved) {
                setLoading(false); // Reset loading state
                return;
            }
            messageId = isUserMessageSaved;

            // 2. Only clear UI state AFTER successful save
            const userMessage: Message = {
                messageId: messageId, // Use the messageId returned from saveUserMessage
                sender: 'user',
                text: currentInput,
                files: currentFiles.length > 0 ? currentFiles : undefined,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, userMessage]);
            setLoading(true);

            setInput('');
            setAttachedFiles([]);

            if (textareaRef.current) {
                textareaRef.current.innerHTML = '';
                textareaRef.current.innerText = '';
            }

            // 3. Generate AI response
            // aiMessageId is already declared above

            // Check if Gemini model is loaded
            if (!geminiModel) {
                throw new Error('Gemini model not loaded yet');
            }

            // Prepare the prompt
            let prompt = currentInput;
            if (currentFiles.length > 0) {
                const fileInfo = currentFiles.map(file => `File: ${file.name} (${file.type})`).join(', ');
                prompt = prompt ? `${prompt}\n\nAttached files: ${fileInfo}` : `Analyze these files: ${fileInfo}`;
            }

            // Call Gemini API with streaming
            const result = await geminiModel.generateContentStream(prompt);
            let fullResponse = '';
            aiMessageId = Date.now() + Math.random(); // Prevent collisions

            if (pushOngoingChat) {
                pushOngoingChat(chatId || "", aiMessageId, messageId);
            }
            // Process the streaming response
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullResponse += chunkText;

                // Create AI message on first chunk
                if (aiMessageId === null) {
                    const aiResponse: Message = {
                        messageId: messageId,
                        sender: 'ai',
                        text: fullResponse,
                        timestamp: aiMessageId
                    };
                    setMessages(prev => [...prev, aiResponse]);

                    // Only show streaming indicator if we're still in the same chat
                    if (chatId === sendingToChatId) {
                        setStreamingMessageId(aiMessageId);
                    }
                } else {
                    // Update the AI message in real-time
                    setMessages(prev =>
                        prev.map(msg =>
                            (msg.timestamp === aiMessageId && msg.messageId === messageId)
                                ? { ...msg, text: fullResponse }
                                : msg
                        )
                    );
                }
            }

            // Clear streaming state only if we're still in the same chat
            if (aiMessageId !== null && chatId === sendingToChatId) {
                setStreamingMessageId(null);
                setLoading(false); // Clear loading immediately after streaming ends
            }

            // 4. Save AI response to database
            if (fullResponse && aiMessageId !== null) {
                const isModelMessageSaved = await saveModelMessage(
                    sendingToChatId,
                    "user123",
                    fullResponse,
                    messageId
                );

                // Always clean up ongoing chat using the original sending chat ID
                if (popOngoingChat) {
                    popOngoingChat(sendingToChatId, aiMessageId); // Use sendingToChatId for consistency
                }

                if (!isModelMessageSaved) {
                    console.error('Failed to save AI response to database');
                    // Don't return early - response is already shown to user
                }

            }

        } catch (error) {
            console.error('Error contacting backend:', error);
            const errorText = `Error: Failed to get response from Gemini. ${error instanceof Error ? error.message : 'Please try again.'}`;

            // Only update state if we're still on the same chat
            if (chatId === sendingToChatId) {
                // Clear streaming state
                setStreamingMessageId(null);

                // Add error message
                const errorMessageId = Date.now() + Math.random();
                const errorResponse: Message = {
                    messageId: messageId,
                    sender: 'ai',
                    text: errorText,
                    timestamp: errorMessageId
                };
                setMessages(prev => [...prev, errorResponse]);

                // Save error response to database
                try {
                    await saveModelMessage(
                        sendingToChatId,
                        "user123",
                        errorText,
                        messageId
                    );
                } catch (dbError) {
                    console.error('Failed to save error response to database:', dbError);
                }
            }

            // Clean up ongoing chat even if we switched tabs - use the AI message ID from this request
            if (popOngoingChat && aiMessageId !== null) {
                popOngoingChat(sendingToChatId, aiMessageId);
            }
        } finally {
            // Always reset loading state
            if (chatId === sendingToChatId) {
                setLoading(false);
                setStreamingMessageId(null);
            }
        }
    };


    const handleFileUpload = async (files: FileList): Promise<void> => {
        if (fileLoading) {
            alert('Please wait, files are still being processed...');
            return;
        }

        setFileLoading(true);

        try {
            const maxFileSize = 10 * 1024 * 1024; // 10MB limit
            const maxFiles = 10;
            const allowedTypes = [
                'text/plain',
                'text/csv',
                'application/json',
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/gif',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            const currentFileCount = attachedFiles.length;
            const availableSlots = maxFiles - currentFileCount;

            if (availableSlots <= 0) {
                alert(`You already uploaded the maximum of ${maxFiles} files.`);
                return;
            }

            const allFiles = Array.from(files);

            if (allFiles.length > availableSlots) {
                alert(`You can only upload ${availableSlots} more file(s). Only the first ${availableSlots} will be added.`);
            }

            const filesToProcess = allFiles.slice(0, availableSlots);  // take only up to the allowed number

            const rejectedFiles: string[] = [];
            const validFiles: FileAttachment[] = [];

            for (const file of filesToProcess) {
                // Check file size
                if (file.size > maxFileSize) {
                    rejectedFiles.push(`"${file.name}" (too large - maximum size is 10MB)`);
                    continue;
                }

                // Check file type
                if (!allowedTypes.includes(file.type)) {
                    rejectedFiles.push(`"${file.name}" (unsupported file type: ${file.type})`);
                    continue;
                }

                try {
                    const content = file.type.startsWith('text/') || file.type === 'application/json'
                        ? await readFileAsText(file)
                        : await readFileAsDataURL(file);

                    validFiles.push({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        content,
                        lastModified: file.lastModified
                    });
                } catch (error) {
                    console.error(`Error reading file "${file.name}":`, error);
                    rejectedFiles.push(`"${file.name}" (failed to read file)`);
                }
            }

            // Show alert for rejected files if any
            if (rejectedFiles.length > 0) {
                const rejectedCount = rejectedFiles.length;
                const uploadedCount = validFiles.length;
                alert(`${rejectedCount} file(s) were rejected:\n\n${rejectedFiles.join('\n')}\n\n${uploadedCount} file(s) uploaded successfully.`);
            }

            setAttachedFiles(prev => [...prev, ...validFiles]);
        } catch (error) {
            console.error('Error during file upload:', error);
            alert('An error occurred while uploading files. Please try again.');
        } finally {
            setFileLoading(false);
        }
    };


    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    };

    const readFileAsDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    };

    const removeAttachedFile = (index: number): void => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handlePaste = async (
        e: React.ClipboardEvent<HTMLDivElement>,
        textareaRef: React.RefObject<HTMLDivElement | null>
    ) => {
        e.preventDefault();

        const files = e.clipboardData.files;
        if (files.length > 0) {
            await handleFileUpload(files); // use your existing upload logic
            return;
        }

        const pastedText = e.clipboardData.getData('text/plain');

        if (textareaRef.current) {
            // Insert at current caret position
            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(pastedText);
            range.insertNode(textNode);

            // Move caret to end of inserted text
            range.setStartAfter(textNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);

            // Sync input state
            setInput(textareaRef.current.innerText);
        }
    };

    return {
        input,
        setInput,
        messages,
        loading,
        fileLoading,
        streamingMessageId,
        setStreamingMessageId,
        mcpOption,
        setMcpOption,
        handleSend,
        handlePaste,
        attachedFiles,
        handleFileUpload,
        removeAttachedFile,
        setMessages,
        setLoading
    };
}
