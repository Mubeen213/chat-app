import React, { useState, useRef, useEffect } from 'react';
import { UI_CONFIG } from '../../types/constants';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onCancelStream?: () => void;
  isLoading: boolean;
}

/**
 * Component for text input with submit button
 */
const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onCancelStream,
  isLoading,
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (!textareaRef.current) return;

    // Reset height to calculate proper scrollHeight
    textareaRef.current.style.height = 'auto';

    // Set new height based on content, with a maximum
    const newHeight = Math.min(
      textareaRef.current.scrollHeight,
      UI_CONFIG.MAX_INPUT_HEIGHT
    );

    textareaRef.current.style.height = `${newHeight}px`;
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If loading and cancel is available, cancel the stream
    if (isLoading && onCancelStream) {
      onCancelStream();
      return;
    }

    // Otherwise send the message if it's not empty
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');

      // Focus back to textarea after sending
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  // Handle Enter key for submission (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message here..."
        className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={1}
        disabled={isLoading && !onCancelStream}
        aria-label="Message input"
        data-testid="message-input"
      />

      <button
        type="submit"
        disabled={(!message.trim() && !isLoading) || (isLoading && !onCancelStream)}
        className="absolute right-3 bottom-3 p-2 rounded-full transition-colors"
        aria-label={isLoading ? "Cancel generation" : "Send message"}
        data-testid="send-button"
      >
        {isLoading ? (
          // Show stop icon when loading
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          >
            <rect x="6" y="6" width="12" height="12" rx="2" ry="2" />
          </svg>
        ) : (
          // Show send icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={message.trim() ? "text-blue-500" : "text-gray-400"}
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        )}
      </button>
    </form>
  );
};

export default MessageInput;
