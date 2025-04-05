import { useRef, useEffect, useCallback } from 'react';
import { useChat } from '../contexts/ChatContext';
import chatService from '../api/chatService';

/**
 * Custom hook for chat operations
 * Handles communication with the chat API and manages message state
 */
export const useChatService = () => {
  const {
    addUserMessage,
    addAssistantMessage,
    updateAssistantMessage,
    setLoading,
    setError,
  } = useChat();

  // Reference to store the cleanup function for the streaming connection
  const streamCleanupRef = useRef<(() => void) | null>(null);

  // Clean up any active streams when the component unmounts
  useEffect(() => {
    return () => {
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
        streamCleanupRef.current = null;
      }
    };
  }, []);

  /**
   * Send a message to the LLM and process the streaming response
   */
  const sendMessage = useCallback(
    (prompt: string) => {
      // Validate input
      if (!prompt.trim()) return;

      // Clean up any existing stream
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
        streamCleanupRef.current = null;
      }

      // Add user message to chat
      addUserMessage(prompt);

      // Set loading state
      setLoading(true);
      setError(null);

      // Add initial empty assistant message
      const messageId = addAssistantMessage();

      // Track the complete response for accumulation
      let fullResponse = '';

      // Start streaming from the API
      streamCleanupRef.current = chatService.streamMessage(
        prompt,
        // Process each token as it arrives
        (token) => {
          fullResponse += token;
          updateAssistantMessage(messageId, fullResponse);
        },
        // Handle errors
        (errorMessage) => {
          setError(errorMessage);
          setLoading(false);

          // If we have no content yet, show the error in the message
          if (!fullResponse) {
            updateAssistantMessage(messageId, `Error: ${errorMessage}`);
          }
        },
        // Handle completion
        () => {
          setLoading(false);
          streamCleanupRef.current = null;
        }
      );
    },
    [addUserMessage, addAssistantMessage, updateAssistantMessage, setLoading, setError]
  );

  /**
   * Cancel the current streaming response
   */
  const cancelStream = useCallback(() => {
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
      streamCleanupRef.current = null;
      setLoading(false);
    }
  }, [setLoading]);

  return {
    sendMessage,
    cancelStream,
  };
};
