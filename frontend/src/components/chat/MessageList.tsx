import React, { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';
import { ChatMessage } from '../../types/chat';
import { UI_CONFIG } from '../../types/constants';

interface MessageListProps {
  messages: ChatMessage[];
}

/**
 * Component that displays a list of messages with auto-scrolling
 */
const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest messages
  useEffect(() => {
    if (!messagesEndRef.current || !containerRef.current) return;

    const container = containerRef.current;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      UI_CONFIG.AUTO_SCROLL_THRESHOLD;

    if (isNearBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full overflow-y-auto p-4"
      data-testid="message-list"
    >
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
