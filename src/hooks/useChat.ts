import { useContext, useState, useEffect } from "react";
import type { Message, FileAttachment } from "../types/index";
import { chatContext } from "../contexts/ChatContext";
import useChatModel from "./useChatModel";
import { saveModelMessage, saveUserMessage } from "../helpers/chatArea";
// import { useParams } from "react-router-dom";
import { useRef } from "react";
import { errorResolveForPrompt, userPromptGeneration } from "../helpers/prompGenerate";

export function useChat(chatId?: string) {
    // Ref to track the active chatId for async update protection
    const activeChatIdRef = useRef(chatId);
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
            activeChatIdRef.current = chatId; // Update ref on chat change
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
        const aiMessageId = Date.now() + Math.random(); // Declare outside try-catch to access in error handling
        let messageId: any = null;
        try {
            // 1. Save user message to database FIRST
            setLoading(true);
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

            setInput('');
            setAttachedFiles([]);

            if (textareaRef.current) {
                textareaRef.current.innerHTML = '';
                textareaRef.current.innerText = '';
            }

            if (!geminiModel) {
                throw new Error('Gemini model not loaded yet');
            }

            let prompt = currentInput;
            if (currentFiles.length > 0) {
                const fileInfo = currentFiles.map(file => `File: ${file.name} (${file.type})`).join(', ');
                prompt = prompt ? `${prompt}\n\nAttached files: ${fileInfo}` : `Analyze these files: ${fileInfo}`;
            }

            if (pushOngoingChat) {
                pushOngoingChat(sendingToChatId, aiMessageId, messageId);
            }

            const aiResponse: Message = {
                messageId: messageId,
                sender: 'ai',
                text: '',
                timestamp: aiMessageId
            };

            if (chatId === sendingToChatId) {
                setStreamingMessageId(messageId);
            }

            setMessages(prev => [...prev, aiResponse]);

            const fullResponse=await userPromptGeneration(prompt, messageId, aiMessageId, geminiModel, sendingToChatId, setMessages, activeChatIdRef)


            if (chatId === sendingToChatId) {
                setStreamingMessageId(null);
                setLoading(false); 
            }

            if (popOngoingChat) {
                popOngoingChat(sendingToChatId, aiMessageId);
            }
            // 4. Save AI response to database
            if (fullResponse && aiMessageId !== null) {
                setLoading(false)
                const isModelMessageSaved = await saveModelMessage(
                    sendingToChatId,
                    "user123",
                    fullResponse,
                    messageId
                );

                if (!isModelMessageSaved) {
                    console.error('Failed to save AI response to database');
                }

            }

        } catch (error) {
            console.error('Error contacting backend:', error);
            const errorText = `Error: Failed to get response from Gemini. ${error instanceof Error ? error.message : 'Please try again.'}`;
            setLoading(false);
            setStreamingMessageId(null);
            const errorMessageId = aiMessageId;
            const errorResponse: Message = {
                messageId: messageId,
                sender: 'ai',
                text: errorText,
                timestamp: errorMessageId
            };
            if (activeChatIdRef.current === chatId) {
                errorResolveForPrompt(messageId, errorText, errorResponse, messages, setMessages);
            }

            
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
            
            if (popOngoingChat && aiMessageId !== null) {
                popOngoingChat(sendingToChatId, aiMessageId);
            }
        } finally {
            console.log("response completed");    
            // Always reset loading state
            if(popOngoingChat){
                popOngoingChat(sendingToChatId, aiMessageId);
            }
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
