import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '../../contexts/ChatContext';
import { useChatService } from '../../hooks/useChatService';

/**
 * Main chat container component that combines list and input
 */
const ChatContainer: React.FC = () => {
  const { messages, isLoading, error } = useChat();
  const { sendMessage, cancelStream } = useChatService();
  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden shadow-lg bg-gray-50 border border-gray-200">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-semibold text-center text-gray-800">
          Chat with Local LLM
        </h1>
      </div>

      {/* Error message display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>

      {/* Input area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <MessageInput
          onSendMessage={sendMessage}
          onCancelStream={cancelStream}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatContainer;
