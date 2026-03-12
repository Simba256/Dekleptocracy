'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isError?: boolean;
}

interface MessageListProps {
  messages: Message[];
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function UserIcon() {
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  );
}

function AssistantIcon() {
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center">
      <svg className="w-4 h-4 text-foreground-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isError = message.content.startsWith('Error:');

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {isUser ? <UserIcon /> : <AssistantIcon />}

      {/* Message Content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
        {/* Role label */}
        <span className="text-xs font-medium text-foreground-muted mb-1 px-1">
          {isUser ? 'You' : 'Assistant'}
        </span>

        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-primary text-white rounded-br-md'
              : isError
              ? 'bg-red-50 dark:bg-red-950/30 text-foreground border border-red-200 dark:border-red-900 rounded-bl-md'
              : 'bg-background-secondary text-foreground border border-border rounded-bl-md'
          }`}
        >
          {/* Error icon for error messages */}
          {isError && (
            <div className="flex items-center gap-2 mb-2 text-accent-error">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium">Error</span>
            </div>
          )}

          {/* Message content with markdown */}
          {message.isStreaming && !message.content ? (
            <LoadingDots />
          ) : (
            <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'dark:prose-invert'}`}>
              <ReactMarkdown
                components={{
                  // Style code blocks
                  code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code
                        className={`${isUser ? 'bg-white/20' : 'bg-background-tertiary'} px-1.5 py-0.5 rounded text-sm font-mono`}
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <code
                        className={`block ${isUser ? 'bg-white/10' : 'bg-background-tertiary'} p-3 rounded-lg text-sm font-mono overflow-x-auto`}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  // Style lists
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
                  ),
                  // Style paragraphs
                  p: ({ children }) => (
                    <p className="my-1.5 leading-relaxed">{children}</p>
                  ),
                  // Style links
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`underline ${isUser ? 'text-white/90 hover:text-white' : 'text-primary hover:text-primary-hover'}`}
                    >
                      {children}
                    </a>
                  ),
                  // Style headers
                  h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
                  // Style blockquotes
                  blockquote: ({ children }) => (
                    <blockquote className={`border-l-2 ${isUser ? 'border-white/50' : 'border-primary'} pl-3 my-2 italic`}>
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Streaming indicator */}
          {message.isStreaming && message.content && (
            <span className="inline-block ml-1 w-2 h-4 bg-current animate-pulse rounded-sm" />
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-foreground-muted mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
