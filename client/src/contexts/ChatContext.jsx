import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export function useChat() {
    return useContext(ChatContext);
}

export function ChatProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [initialInput, setInitialInput] = useState('');

    const openChat = (message = '') => {
        setInitialInput(message);
        setIsOpen(true);
    };

    const closeChat = () => {
        setIsOpen(false);
    };

    const toggleChat = () => {
        setIsOpen(prev => !prev);
    };

    // Clear initial input after it's been consumed (optional helper)
    const clearInitialInput = () => setInitialInput('');

    const value = {
        isOpen,
        initialInput,
        openChat,
        closeChat,
        toggleChat,
        clearInitialInput
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}
