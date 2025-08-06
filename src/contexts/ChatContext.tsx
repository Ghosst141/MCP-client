import React, { createContext, useEffect, useState } from 'react'

type ChatContextType = {
    chats: any[];
    loading: boolean;
    error: boolean;
    setChats: React.Dispatch<React.SetStateAction<any[]>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<boolean>>;
    refreshChats: () => Promise<void>;
    deleteChat: (chatId: string) => Promise<void>;
    firstchat: string;
    setFirstChat: React.Dispatch<React.SetStateAction<string>>;
}

const chatContext = createContext<ChatContextType | undefined>(undefined)


function ChatContext({ children }: { children: React.ReactNode }) {

    const [chats, setChats] = useState([] as any[]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [firstchat, setFirstChat] = useState<string>('');

    const refreshChats = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:3000/api/userchats?userId=user123`, {
                credentials: "include",
            });
            const data = await res.json();
            
            // Reverse the array to show newest chats first
            setChats(data.reverse());
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch chats:", err);
            setError(true);
            setLoading(false);
        }
    };

    const deleteChat = async (chatId: string) => {
        try {
            const url = `http://localhost:3000/api/chats/${chatId}?userId=user123`;
            
            const res = await fetch(url, {
                method: 'DELETE',
                credentials: "include",
            });
            
            if (!res.ok) {
                // Check if it's a 404 error (route not found) vs other errors
                if (res.status === 404) {
                    const errorText = await res.text();
                    if (errorText.includes("Cannot DELETE")) {
                        throw new Error("Server doesn't support DELETE operation. Please restart your server.");
                    } else {
                        throw new Error("Chat not found or already deleted.");
                    }
                } else {
                    const errorText = await res.text();
                    throw new Error(`Failed to delete chat: ${res.status} - ${errorText}`);
                }
            }
            
            await refreshChats();
        } catch (err) {
            console.error("Failed to delete chat:", err);
            if (err instanceof Error && !err.message.includes("restart your server")) {
                setError(true);
            }
            throw err; // Re-throw so the caller can handle it
        }
    };

    useEffect(() => {
        refreshChats();
    }, []);

    

    return (
        <chatContext.Provider value={{ chats, loading, error, setChats, setLoading, setError, refreshChats, deleteChat, firstchat, setFirstChat }}>
            {children}
        </chatContext.Provider>
    )
}

export default ChatContext;
export { chatContext };