import { useContext, useState } from "react";
import type { Message, FileAttachment } from "../types/index";
import { chatContext } from "../contexts/ChatContext";
import useChatModel from "./useChatModel";

export function useChat(chatId?: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [mcpOption, setMcpOption] = useState('select');
    const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);

    const context = useContext(chatContext);
    const updateChatTimestamp = context?.updateChatTimestamp;
    const geminiModel = useChatModel(); // Add Gemini model

    const handleSend = async (textareaRef: React.RefObject<HTMLDivElement | null>): Promise<void> => {
        if (!input.trim() && attachedFiles.length === 0) return;

        const userMessage: Message = {
            sender: 'user',
            text: input.trim(),
            files: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMessage]);

        const currentInput = input.trim();
        const currentFiles = [...attachedFiles];
        setInput('');
        setAttachedFiles([]);
        setLoading(true);
        if (textareaRef.current) {
            textareaRef.current.innerHTML = '';
            textareaRef.current.innerText = '';
        }

        try {
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

            // Save the conversation to database if chatId is provided
            if (chatId) {
                try {
                    await fetch(`http://localhost:3000/api/chats/${chatId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            userId: "user123",
                            question: currentInput,
                            answer: responseText,
                            files: currentFiles.length > 0 ? currentFiles : undefined,
                        }),
                    });
                    // Update chat timestamp to move it to top of sidebar
                    if (updateChatTimestamp) {
                        updateChatTimestamp(chatId);
                    }
                } catch (dbError) {
                    console.error('Error saving conversation to database:', dbError);
                }
            }

        } catch (error) {
            console.error('Error contacting backend:', error);
            const errorResponse: Message = {
                sender: 'ai',
                text: `Error: Failed to get response from Gemini. ${error instanceof Error ? error.message : 'Please try again.'}`,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorResponse]);

            // Save error response to database if chatId is provided
            if (chatId) {
                try {
                    await fetch(`http://localhost:3000/api/chats/${chatId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            userId: "user123",
                            question: currentInput,
                            answer: errorResponse.text,
                            files: currentFiles.length > 0 ? currentFiles : undefined,
                        }),
                    });
                    if (updateChatTimestamp) {
                        updateChatTimestamp(chatId);
                    }
                } catch (dbError) {
                    console.error('Error saving error response to database:', dbError);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // const handleFileUpload = async (files: FileList): Promise<void> => {
    //     const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    //     const maxFiles = 10; // Maximum number of files allowed
    //     const allowedTypes = [
    //         'text/plain',
    //         'text/csv',
    //         'application/json',
    //         'application/pdf',
    //         'image/jpeg',
    //         'image/png',
    //         'image/gif',
    //         'application/msword',
    //         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    //     ];

    //     // Check if adding these files would exceed the limit
    //     const currentFileCount = attachedFiles.length;
    //     const newFileCount = files.length;

    //     if (currentFileCount + newFileCount > maxFiles) {
    //         alert(`Cannot upload more than ${maxFiles} files. You currently have ${currentFileCount} files and are trying to add ${newFileCount} more.`);
    //         return;
    //     }

    //     console.log(Array.from(files));


    //     const filePromises = Array.from(files).map(async (file): Promise<FileAttachment | null> => {
    //         // Check file size
    //         if (file.size > maxFileSize) {
    //             alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
    //             return null;
    //         }

    //         console.log(file.type);
    //         // Check file type
    //         if (!allowedTypes.includes(file.type)) {
    //             alert(`File type "${file.type}" is not supported for "${file.name}".`);
    //             return null;
    //         }

    //         try {
    //             let content: string;

    //             if (file.type.startsWith('text/') || file.type === 'application/json') {
    //                 // Read text files directly
    //                 content = await readFileAsText(file);
    //             } else if (file.type.startsWith('image/')) {
    //                 // Convert images to base64
    //                 content = await readFileAsDataURL(file);
    //             } else {
    //                 // For other files, convert to base64
    //                 content = await readFileAsDataURL(file);
    //             }

    //             return {
    //                 name: file.name,
    //                 size: file.size,
    //                 type: file.type,
    //                 content: content,
    //                 lastModified: file.lastModified
    //             };
    //         } catch (error) {
    //             console.error(`Error reading file "${file.name}":`, error);
    //             alert(`Failed to read file "${file.name}".`);
    //             return null;
    //         }
    //     });

    //     const processedFiles = await Promise.all(filePromises);
    //     const validFiles = processedFiles.filter((file): file is FileAttachment => file !== null);

    //     setAttachedFiles(prev => [...prev, ...validFiles]);
    //     console.log("attached files", attachedFiles);

    // };

    const handleFileUpload = async (files: FileList): Promise<void> => {
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

        const filePromises = filesToProcess.map(async (file): Promise<FileAttachment | null> => {
            if (file.size > maxFileSize) {
                alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
                return null;
            }

            if (!allowedTypes.includes(file.type)) {
                alert(`File type "${file.type}" is not supported for "${file.name}".`);
                return null;
            }

            try {
                const content = file.type.startsWith('text/') || file.type === 'application/json'
                    ? await readFileAsText(file)
                    : await readFileAsDataURL(file);

                return {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    content,
                    lastModified: file.lastModified
                };
            } catch (error) {
                console.error(`Error reading file "${file.name}":`, error);
                alert(`Failed to read file "${file.name}".`);
                return null;
            }
        });

        const processedFiles = await Promise.all(filePromises);
        const validFiles = processedFiles.filter((file): file is FileAttachment => file !== null);

        setAttachedFiles(prev => [...prev, ...validFiles]);
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
