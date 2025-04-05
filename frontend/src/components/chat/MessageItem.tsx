import React from 'react';
import classNames from 'classnames';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ChatMessage } from '../../types/chat';

interface MessageItemProps {
  message: ChatMessage;
}

/**
 * Component for rendering a single chat message
 */
const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isStreaming = !!message.isStreaming;

  return (
    <div
      className={classNames('flex w-full mb-4', {
        'justify-end': isUser,
        'justify-start': !isUser,
      })}
    >
      <div
        className={classNames('max-w-[80%] rounded-lg px-4 py-3', {
          'bg-blue-600 text-white': isUser,
          'bg-white border border-gray-200 text-gray-800': !isUser,
        })}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <div className="message-content">
            {isStreaming && !message.content ? (
              <div className="flex space-x-1 h-6 items-center">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-300"></div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    pre: (props) => (
                      <pre
                        className="bg-gray-100 p-3 rounded-md my-2 overflow-x-auto text-sm"
                        {...props}
                      />
                    ),
                    code: ({ inline, className, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) =>
                      inline ? (
                        <code
                          className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono"
                          {...props}
                        />
                      ) : (
                        <code className="font-mono" {...props} />
                      ),
                    p: (props) => <p className="mb-3 last:mb-0" {...props} />,
                    ul: (props) => <ul className="list-disc pl-5 mb-3" {...props} />,
                    ol: (props) => <ol className="list-decimal pl-5 mb-3" {...props} />,
                    h1: (props) => <h1 className="text-xl font-bold mb-2" {...props} />,
                    h2: (props) => <h2 className="text-lg font-bold mb-2" {...props} />,
                    h3: (props) => <h3 className="text-md font-bold mb-2" {...props} />,
                  }}
                >
                  {message.content || ''}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <div
            className={classNames('text-xs mt-1', {
              'text-blue-200': isUser,
              'text-gray-500': !isUser,
            })}
          >
            {format(new Date(message.timestamp), 'h:mm a')}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
