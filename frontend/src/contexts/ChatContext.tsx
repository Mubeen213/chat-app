import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../types/chat';
import { SYSTEM_MESSAGES } from '../types/constants';

/**
 * Interface for the chat context state and actions
 */
interface ChatContextValue {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addUserMessage: (content: string) => void;
  addAssistantMessage: () => string; // Returns the message ID
  updateAssistantMessage: (id: string, content: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

// Create the context with undefined initial value
const ChatContext = createContext<ChatContextValue | undefined>(undefined);

// Initial welcome message
const initialMessages: ChatMessage[] = [
  {
    id: uuidv4(),
    role: 'assistant',
    content: SYSTEM_MESSAGES.WELCOME,
    timestamp: Date.now(),
  },
];

interface ChatProviderProps {
  children: ReactNode;
}

/**
 * Provider component for the chat context
 */
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Add a user message to the chat
   */
  const addUserMessage = useCallback((content: string) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  /**
   * Add an empty assistant message that will be updated with streaming content
   * @returns The ID of the created message
   */
  const addAssistantMessage = useCallback(() => {
    const id = uuidv4();

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      },
    ]);

    return id;
  }, []);

  /**
   * Update an existing assistant message with new content
   */
  const updateAssistantMessage = useCallback((id: string, content: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((message) =>
        message.id === id
          ? { ...message, content, isStreaming: false }
          : message
      )
    );
  }, []);

  /**
   * Clear all messages except the initial welcome message
   */
  const clearMessages = useCallback(() => {
    setMessages(initialMessages);
    setError(null);
  }, []);

  const value: ChatContextValue = {
    messages,
    isLoading,
    error,
    addUserMessage,
    addAssistantMessage,
    updateAssistantMessage,
    setLoading: setIsLoading,
    setError,
    clearMessages,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

/**
 * Custom hook to use the chat context
 */
export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);

  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }

  return context;
};
