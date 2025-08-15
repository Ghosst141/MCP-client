import React, { createContext, useEffect, useState } from 'react'
import { deleteChatfromDB, fetchChats } from '../services/ApiCallsforDB';

type FirstChatData = {
    text: string;
    files?: any[];
    messageId?: any;
} | null;

type OngoingChat = {
    chatId: string;
    aiMessageId: number;
    messageId: any;
    retry?: number;
};

type ChatContextType = {
    chats: any[];
    loading: boolean;
    error: boolean;
    setChats: React.Dispatch<React.SetStateAction<any[]>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<boolean>>;
    refreshChats: () => Promise<void>;
    deleteChat: (chatId: string) => Promise<void>;
    firstchat: FirstChatData;
    setFirstChat: React.Dispatch<React.SetStateAction<FirstChatData>>;
    updateChatTimestamp: (chatId: string) => void;
    pushOngoingChat: (chatId: string, aiMessageId:number,messageId: any,retry?: number) => void;
    popOngoingChat: (chatId: string, aiMessageId:number) => void;
    onGoingChat: OngoingChat[];
}

const chatContext = createContext<ChatContextType | undefined>(undefined)


function ChatContext({ children }: { children: React.ReactNode }) {

    const [chats, setChats] = useState([] as any[]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [firstchat, setFirstChat] = useState<FirstChatData>(null);
    const [onGoingChat, setOnGoingChat] = useState<OngoingChat[]>([]);

    const refreshChats = async () => {
        try {
            setLoading(true);
            //fetch chats
            const sortedChats = await fetchChats("user123");

            setChats(sortedChats);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch chats:", err);
            setError(true);
            setLoading(false);
        }
    };

    const deleteChat = async (chatId: string) => {
        try {
            const userId = "user123";
            await deleteChatfromDB(chatId, userId);

            await refreshChats();
        } catch (err) {
            console.error("Failed to delete chat:", err);
            if (err instanceof Error && !err.message.includes("restart your server")) {
                setError(true);
            }
            throw err; // Re-throw so the caller can handle it
        }
    };

    const updateChatTimestamp = (chatId: string) => {
        // Update the local chat list to move the updated chat to the top
        setChats(prevChats => {
            const updatedChats = prevChats.map(chat => {
                if (chat._id === chatId) {
                    return { ...chat, createdAt: new Date().toISOString() };
                }
                return chat;
            });

            // Sort again to ensure the updated chat is at the top
            return updatedChats.sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA; // Most recent first
            });
        });
    };

    const pushOngoingChat = (chatId: string, aiMessageId: number,messageId: any,retry?: number) => {
        if(chatId !=""){
            setOnGoingChat(prev => [...prev, { chatId, aiMessageId,messageId,retry }]);
        }
    };

    const popOngoingChat = (chatId: string, aiMessageId: number) => {
        if(chatId !=""){
            setOnGoingChat(prev => prev.filter(chat => chat.chatId !== chatId || chat.aiMessageId !== aiMessageId));
        }
    };

    useEffect(() => {
        refreshChats();
    }, []);



    return (
        <chatContext.Provider value={{ chats, loading, error, setChats, setLoading, setError, refreshChats, deleteChat, firstchat, onGoingChat, setFirstChat, updateChatTimestamp, pushOngoingChat, popOngoingChat }}>
            {children}
        </chatContext.Provider>
    )
}

export default ChatContext;
export { chatContext };