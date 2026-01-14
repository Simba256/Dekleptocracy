'use client';

import React from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface MessageListProps {
  messages: Message[];
}

function formatContent(content: string): JSX.Element[] {
  // Split content by newlines and process each line
  const lines = content.split('\n');

  return lines.map((line, index) => {
    // Handle special formatting
    if (line.startsWith('Using tool:')) {
      return (
        <div key={index} className="text-sm text-blue-600 dark:text-blue-400 italic my-2">
          {line}
        </div>
      );
    }

    if (line.startsWith('"')) {
      return (
        <li key={index} className="ml-4">
          {line.substring(1).trim()}
        </li>
      );
    }

    if (line.trim() === '') {
      return <br key={index} />;
    }

    // Check for code blocks (simple detection)
    if (line.startsWith('```')) {
      return (
        <div key={index} className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded my-1">
          {line}
        </div>
      );
    }

    return <span key={index}>{line}<br /></span>;
  });
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-3xl px-4 py-3 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Role indicator */}
            <div className="text-xs font-semibold mb-1 opacity-70">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>

            {/* Message content */}
            <div className="whitespace-pre-wrap break-words">
              {formatContent(message.content)}
            </div>

            {/* Streaming indicator */}
            {message.isStreaming && (
              <span className="inline-block mt-2">
                <svg
                  className="animate-pulse w-4 h-4 text-gray-400"
                  viewBox="0 0 24 24"
                >
                  <circle cx="4" cy="12" r="2" fill="currentColor" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                  <circle cx="20" cy="12" r="2" fill="currentColor" />
                </svg>
              </span>
            )}

            {/* Timestamp */}
            <div className="text-xs mt-2 opacity-50">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}