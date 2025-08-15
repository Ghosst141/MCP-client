import { useState, useRef, useEffect, type KeyboardEvent, useContext } from 'react';
import './ChatArea.css'
import './Dashboard.css';
import Header from './Header';
import { useClickOutside } from '../hooks/useClickOutside';
import { useChat } from '../hooks/useChat';
import InputArea from '../helpers/InputArea';
import { useNavigate } from 'react-router-dom';
import { chatContext } from '../contexts/ChatContext';
import { SideContext } from '../contexts/SidebarContext';
import { createAChatwithFirstMessage } from '../services/ApiCallsforDB';


export default function Dashboard() {

    const { input, setInput, messages, loading, mcpOption, setMcpOption, handlePaste,
        attachedFiles, removeAttachedFile, handleFileUpload ,setLoading, fileLoading} = useChat();
    const [open, setOpen] = useState<boolean>(false);
    const textareaRef = useRef<HTMLDivElement | null>(null);

    const options: string[] = ['Job Portal', 'Normal'];
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const dropdownRef = useClickOutside(() => setOpen(false));
    const scrollRef=useRef<boolean>(false);

    const Navigate = useNavigate();

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

    const chats = useContext(chatContext);
    if (!chats) throw new Error("chatContext is undefined");
    const { setFirstChat } = chats;

    const sidebarContext = useContext(SideContext);
    if (!sidebarContext) throw new Error("SidebarContext is undefined");
    const { setSelectedChatId } = sidebarContext;


    const handleSend = async () => {
        if (input.trim() === '' && attachedFiles.length === 0) return;
        const userId = "user123"; // Replace this with actual user ID logic
        setLoading(true);
        try {
            // Create a new chat with the first message
            const data = await createAChatwithFirstMessage(userId, input.trim(), attachedFiles);
            const chatId = data._id;
            const messageId = data.messageId;

            setFirstChat({
                text: input.trim(),
                files: attachedFiles.length > 0 ? attachedFiles : undefined,
                messageId: messageId
            });
            Navigate(`/chat/${chatId}`);
            setSelectedChatId(chatId);
            setInput("")
            
        } catch (error) {
            console.error("Chat creation failed:", error);
            setLoading(false);
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;

        if (files && files.length > 0) {
            await handleFileUpload(files);
        }
        event.target.value = '';
    };


    return (
        <div className="chat-area">
            <div className='header-area'>
                <Header />
            </div>
            <div className='dashboard-main'>
                <div className='dashboard-container'>
                    <div className="welcome-center">
                        <h2>Welcome, User</h2>
                        <p>Select a mode and ask me anything!</p>
                    </div>
                    <div className="input-wrapper">
                        <InputArea
                            scrollRef={scrollRef}
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
                            fileLoading={fileLoading}
                        />
                    </div>
                </div>

            </div>
        </div>

    );
}
