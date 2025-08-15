const fetchMessagesAndSort = async (
    chatId: string | undefined,
    userId: string,
    text: string,
    firstChatFiles: any[]
) => {
    const res = await fetch(`http://localhost:3000/api/chats/${chatId}?userId=${userId}`);
    if (!res.ok && res.status !== 404) {
        return null;
    }
    const data = await res.json();
    if (!Array.isArray(data.history)) {
        return null;
    }
    if (data.history.length === 0 && !text && (!firstChatFiles || firstChatFiles.length === 0)) {
        return null;
    }
    const sortedHistory = data.history.sort((a: any, b: any) => {
        const aId = a.messageId || a._id || 0;
        const bId = b.messageId || b._id || 0;
        return aId.toString().localeCompare(bId.toString());
    });
    return sortedHistory;
};

const createAChatwithFirstMessage = async (userId: string, text: string, attachedFiles: any[]) => {
    const res = await fetch("http://localhost:3000/api/chats", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            userId,
            text,
            files: attachedFiles.length > 0 ? attachedFiles : undefined
        })
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create chat");
    }
    return await res.json();
};

const fetchChats = async (userId: string) => {
    const res = await fetch(`http://localhost:3000/api/userchats?userId=${userId}`, {
        credentials: "include",
    });

    const data = await res.json();

    // Sort chats by createdAt timestamp in descending order (newest first)
    const sortedChats = data.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Most recent first
    });

    return sortedChats;
}

const deleteChatfromDB = async (chatId: string, userId: string) => {
    const url = `http://localhost:3000/api/chats/${chatId}?userId=${userId}`;

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
};

export { fetchMessagesAndSort, createAChatwithFirstMessage, fetchChats, deleteChatfromDB };