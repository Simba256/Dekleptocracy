import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Chatbot.css';

// localStorage utilities for chat history
const STORAGE_KEY = 'dekleptocracy_chat_history';

const getChatHistory = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { chats: [], currentChatId: null };
  } catch (error) {
    console.error('Error loading chat history:', error);
    return { chats: [], currentChatId: null };
  }
};

const saveChatHistory = (history) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
};

// Fallback title generation using keyword extraction (used if LLM fails)
const generateChatTitleFallback = (messages) => {
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  if (!firstUserMessage) return 'New Chat';

  const content = firstUserMessage.content;

  // Remove common question words and filler words
  const fillerWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'is', 'are', 'was', 'were',
                       'the', 'a', 'an', 'can', 'could', 'would', 'should', 'do', 'does', 'did',
                       'have', 'has', 'had', 'be', 'been', 'being', 'me', 'you', 'please', 'tell',
                       'show', 'give', 'explain', 'about', 'for', 'of', 'to', 'in', 'on', 'at'];

  // Extract sentences (split by question marks or periods)
  const sentences = content.split(/[.?!]+/).filter(s => s.trim().length > 0);
  const firstSentence = sentences[0].trim();

  // Split into words and filter
  const words = firstSentence.toLowerCase()
    .split(/\s+/)
    .filter(word => {
      // Remove punctuation
      const cleanWord = word.replace(/[^\w\s]/g, '');
      // Keep words that are not filler words and are at least 3 chars
      return cleanWord.length >= 3 && !fillerWords.includes(cleanWord);
    })
    .map(word => word.replace(/[^\w\s]/g, '')); // Clean punctuation

  // If we extracted meaningful words, create a title from them
  if (words.length > 0) {
    // Capitalize first letter of each word
    const titleWords = words.slice(0, 6).map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    );

    const generatedTitle = titleWords.join(' ');

    // Limit to 50 characters
    if (generatedTitle.length <= 50) {
      return generatedTitle;
    } else {
      return generatedTitle.substring(0, 47) + '...';
    }
  }

  // Fallback: use first 50 characters if we couldn't extract keywords
  const fallbackTitle = content.substring(0, 50);
  return content.length > 50 ? fallbackTitle + '...' : fallbackTitle;
};

// LLM-powered title generation using gpt-3.5-turbo
const generateChatTitle = async (messages, mcpServerUrl) => {
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  if (!firstUserMessage) return 'New Chat';

  try {
    // Call the backend API for LLM-generated title
    const response = await fetch(`${mcpServerUrl}/generate-title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: firstUserMessage.content
      }),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Limit to 50 characters and add ellipsis if needed
    let title = data.title || '';
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }

    return title || generateChatTitleFallback(messages);
  } catch (error) {
    console.warn('LLM title generation failed, using fallback:', error);
    // Fallback to keyword extraction if LLM fails
    return generateChatTitleFallback(messages);
  }
};

const Chatbot = () => {
  const location = useLocation();
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant with access to comprehensive trade and tariff analysis tools. I can help you with:\n\n• Trade statistics and economic data\n• Tariff rates and policy impacts\n• Stock market and financial information\n• News and trade policy updates\n• General questions about policy impacts on your budget\n\nHow can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState(() => getChatHistory());
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const hasSubmittedInitialQuery = useRef(false);

  // MCP Server URL - uses environment variable in production, localhost in development
  const MCP_SERVER_URL = import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:8000';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle initial query from navigation state
  useEffect(() => {
    if (location.state?.initialQuery && !hasSubmittedInitialQuery.current) {
      hasSubmittedInitialQuery.current = true;
      submitMessage(location.state.initialQuery);
    }
  }, [location.state]);

  // Save current chat to history after messages change
  useEffect(() => {
    if (messages.length > 1) { // More than just the welcome message
      saveCurrentChat();
    }
  }, [messages]);

  const saveCurrentChat = async () => {
    const history = getChatHistory();
    const chatId = currentChatId || Date.now().toString();

    // Generate title using LLM (with fallback to keyword extraction)
    const title = await generateChatTitle(messages, MCP_SERVER_URL);

    const existingChatIndex = history.chats.findIndex(chat => chat.id === chatId);
    const chatData = {
      id: chatId,
      title: title,
      messages: messages,
      createdAt: existingChatIndex >= 0 ? history.chats[existingChatIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingChatIndex >= 0) {
      history.chats[existingChatIndex] = chatData;
    } else {
      history.chats.unshift(chatData); // Add to beginning
    }

    history.currentChatId = chatId;
    saveChatHistory(history);
    setChatHistory(history);

    if (!currentChatId) {
      setCurrentChatId(chatId);
    }
  };

  const loadChat = (chatId) => {
    const history = getChatHistory();
    const chat = history.chats.find(c => c.id === chatId);

    if (chat) {
      setMessages(chat.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
      setCurrentChatId(chatId);
      setShowHistory(false);
    }
  };

  const startNewChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant with access to comprehensive trade and tariff analysis tools. I can help you with:\n\n• Trade statistics and economic data\n• Tariff rates and policy impacts\n• Stock market and financial information\n• News and trade policy updates\n• General questions about policy impacts on your budget\n\nHow can I help you today?',
        timestamp: new Date(),
      },
    ]);
    setCurrentChatId(null);
    setInput('');
    setShowHistory(false);
  };

  const deleteChat = (chatId, event) => {
    event.stopPropagation();

    const history = getChatHistory();
    history.chats = history.chats.filter(chat => chat.id !== chatId);

    if (history.currentChatId === chatId) {
      history.currentChatId = null;
    }

    saveChatHistory(history);
    setChatHistory(history);

    // If deleting current chat, start a new one
    if (currentChatId === chatId) {
      startNewChat();
    }
  };

  const submitMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Create a placeholder for the assistant's response
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      const response = await fetch(`${MCP_SERVER_URL}/chat/intelligent/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({
            role,
            content,
          })),
          use_mcp_tools: true,
          // Context window management parameters (optional)
          max_iterations: 10,          // Maximum tool calling iterations
          max_total_tools: 8,           // Maximum total tools to call
          preserve_recent_messages: 3,  // Number of recent messages to preserve when truncating
          // max_context_tokens can be set to limit context size (uncomment to use)
          // max_context_tokens: 50000,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Handle JSON response from MCP V2
      const data = await response.json();

      // Update message with the complete response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: data.content || data.response || 'No response generated',
                isLoading: false,
              }
            : msg
        )
      );

      // Log metadata for debugging
      if (data.metadata) {
        console.log('MCP V2 Metadata:', data.metadata);
        console.log(`Tools used: ${data.metadata.tool_count}, Iterations: ${data.metadata.iterations}, Tokens: ${data.metadata.tokens_used}`);

        // Log token/context metadata
        if (data.metadata.token_metadata) {
          const tm = data.metadata.token_metadata;
          console.log(`Context Window: ${tm.initial_messages_tokens?.toLocaleString() || 'N/A'} / ${tm.context_limit?.toLocaleString() || 'N/A'} tokens (${tm.initial_utilization_percent || 0}%)`);

          if (tm.truncation_occurred) {
            console.warn(`⚠️ Context truncation occurred: ${tm.messages_removed} messages removed`);
          }
        }

        // Log if limits were reached
        if (data.metadata.tool_limit_reached) {
          console.warn('⚠️ Tool limit reached - some analysis may be incomplete');
        }
        if (data.metadata.max_iterations_reached) {
          console.warn('⚠️ Max iterations reached - some analysis may be incomplete');
        }
      }
      if (data.tools_used) {
        console.log('Tools used:', data.tools_used);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Chat error:', error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: `Error: ${error.message || 'Failed to get response. Make sure the MCP server is running on ' + MCP_SERVER_URL}`,
                  isLoading: false,
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      const messageToSend = input;
      setInput('');
      await submitMessage(messageToSend);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const stopRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="chatbot-page">
      {/* Sidebar Toggle Button - Mobile only */}
      <button
        className={`sidebar-toggle-mobile ${showHistory ? 'hidden' : ''}`}
        onClick={() => setShowHistory(true)}
        title="Open chat history"
      >
        ☰
      </button>

      {/* History Sidebar - Always visible on desktop */}
      <div className={`chat-history-sidebar ${showHistory ? 'show-mobile' : ''}`}>
        <div className="history-header">
          <h2 className="history-title">📚 Chat History</h2>
          <button
            className="history-close-btn-mobile"
            onClick={() => setShowHistory(false)}
            title="Close sidebar"
          >
            ✕
          </button>
        </div>

        <button className="new-chat-btn" onClick={startNewChat}>
          ➕ New Chat
        </button>

        <div className="history-list">
          {chatHistory.chats.length === 0 ? (
            <div className="history-empty">No chat history yet</div>
          ) : (
            chatHistory.chats.map((chat) => (
              <div
                key={chat.id}
                className={`history-item ${chat.id === currentChatId ? 'active' : ''}`}
                onClick={() => loadChat(chat.id)}
              >
                <div className="history-item-content">
                  <div className="history-item-title">{chat.title}</div>
                  <div className="history-item-date">
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  className="history-delete-btn"
                  onClick={(e) => deleteChat(chat.id, e)}
                  title="Delete chat"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Overlay when sidebar is open - Mobile only */}
      {showHistory && (
        <div
          className="history-overlay-mobile"
          onClick={() => setShowHistory(false)}
        />
      )}

      {/* Main Chat Container */}
      <div className="chatbot-main">
        {/* Header */}
        <div className="chatbot-header">
          <div className="header-content">
            <h1 className="chatbot-title">AI Trade & Tariff Assistant</h1>
            <p className="chatbot-subtitle">
              Powered by GPT-5 with real-time trade analysis tools
            </p>
          </div>
          {messages.length > 1 && (
            <button className="new-chat-btn-header" onClick={startNewChat}>
              ➕ New Chat
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="chatbot-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}
            >
              <div className="message-avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-role">
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </div>
                <div className="message-text">
                  {message.isLoading ? (
                    <div className="loading-indicator">
                      <span className="loading-dot"></span>
                      <span className="loading-dot"></span>
                      <span className="loading-dot"></span>
                    </div>
                  ) : (
                    <ReactMarkdown
                      className="markdown-content"
                      remarkPlugins={[remarkGfm]}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chatbot-input-area">
          <form onSubmit={handleSubmit} className="chatbot-form">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about trade, tariffs, stocks, or policy impacts..."
              className="chatbot-input"
              rows={2}
              disabled={isLoading}
            />
            <div className="chatbot-actions-row">
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="chatbot-send-btn"
              >
                {isLoading ? 'Thinking...' : 'Send'}
              </button>
              {isLoading && (
                <button
                  type="button"
                  onClick={stopRequest}
                  className="chatbot-stop-btn"
                >
                  Stop
                </button>
              )}
            </div>
          </form>
          <div className="chatbot-hint">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
