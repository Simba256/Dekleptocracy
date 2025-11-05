import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import './ChatbotDebug.css';

const ChatbotDebug = () => {
  const location = useLocation();
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant with access to comprehensive trade and tariff analysis tools. This is the DEBUG version - you\'ll see detailed information about tool calls, parameters, and results.\n\nHow can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
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

      const startTime = Date.now();

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
        }),
        signal: abortControllerRef.current.signal,
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

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
                debugData: data,
              }
            : msg
        )
      );

      // Store debug information
      const newDebugInfo = {
        id: assistantMessage.id,
        timestamp: new Date(),
        totalTime: totalTime,
        userQuery: messageText.trim(),
        metadata: data.metadata || {},
        toolCalls: data.tool_calls || [],
        toolResults: data.tool_results || {},
        rawResponse: data,
      };

      setDebugInfo((prev) => [...prev, newDebugInfo]);

      // Log to console as well
      console.log('=== DEBUG INFO ===');
      console.log('Total request time:', totalTime, 'ms');
      console.log('Metadata:', data.metadata);
      console.log('Tool calls:', data.tool_calls);
      console.log('Tool results:', data.tool_results);

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

  const formatJSON = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="chatbot-debug-page">
      {/* Main Chat Section */}
      <div className="chatbot-debug-left">
        <div className="chatbot-debug-container">
          {/* Header */}
          <div className="chatbot-debug-header">
            <h1 className="chatbot-debug-title">
              🛠️ AI Assistant - DEBUG MODE
            </h1>
            <p className="chatbot-debug-subtitle">
              Development & Testing Interface with Tool Call Debugging
            </p>
          </div>

          {/* Messages Area */}
          <div className="chatbot-debug-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`debug-message ${message.role === 'user' ? 'debug-message-user' : 'debug-message-assistant'}`}
              >
                <div className="debug-message-avatar">
                  {message.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="debug-message-content">
                  <div className="debug-message-role">
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </div>
                  <div className="debug-message-text">
                    {message.isLoading ? (
                      <div className="debug-loading-indicator">
                        <span className="debug-loading-dot"></span>
                        <span className="debug-loading-dot"></span>
                        <span className="debug-loading-dot"></span>
                      </div>
                    ) : (
                      <ReactMarkdown className="markdown-content">
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                  <div className="debug-message-time">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chatbot-debug-input-area">
            <form onSubmit={handleSubmit} className="chatbot-debug-form">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about trade, tariffs, stocks, or policy impacts..."
                className="chatbot-debug-input"
                rows={2}
                disabled={isLoading}
              />
              <div className="chatbot-debug-actions-row">
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="chatbot-debug-send-btn"
                >
                  {isLoading ? 'Thinking...' : 'Send'}
                </button>
                {isLoading && (
                  <button
                    type="button"
                    onClick={stopRequest}
                    className="chatbot-debug-stop-btn"
                  >
                    Stop
                  </button>
                )}
              </div>
            </form>
            <div className="chatbot-debug-hint">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info Panel */}
      <div className="chatbot-debug-right">
        <div className="debug-panel">
          <h2 className="debug-panel-title">🔍 Debug Information</h2>

          {debugInfo.length === 0 ? (
            <div className="debug-empty">
              <p>Send a message to see debug information here.</p>
              <p className="debug-empty-hint">
                You'll see tool calls, parameters, results, and execution metadata.
              </p>
            </div>
          ) : (
            <div className="debug-entries">
              {debugInfo.slice().reverse().map((info, idx) => (
                <div key={info.id} className="debug-entry">
                  <div className="debug-entry-header">
                    <h3 className="debug-entry-title">
                      Query #{debugInfo.length - idx}
                    </h3>
                    <span className="debug-entry-time">
                      {info.timestamp.toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="debug-section">
                    <h4 className="debug-section-title">📝 User Query</h4>
                    <div className="debug-code">
                      {info.userQuery}
                    </div>
                  </div>

                  <div className="debug-section">
                    <h4 className="debug-section-title">⏱️ Performance</h4>
                    <div className="debug-stats">
                      <div className="debug-stat">
                        <span className="debug-stat-label">Total Time:</span>
                        <span className="debug-stat-value">{info.totalTime}ms</span>
                      </div>
                      <div className="debug-stat">
                        <span className="debug-stat-label">Iterations:</span>
                        <span className="debug-stat-value">
                          {info.metadata.iterations || 'N/A'}
                        </span>
                      </div>
                      <div className="debug-stat">
                        <span className="debug-stat-label">Tokens Used:</span>
                        <span className="debug-stat-value">
                          {info.metadata.tokens_used || 'N/A'}
                        </span>
                      </div>
                      <div className="debug-stat">
                        <span className="debug-stat-label">Tools Called:</span>
                        <span className="debug-stat-value">
                          {info.toolCalls.length}
                        </span>
                      </div>
                      {info.metadata.max_iterations_reached && (
                        <div className="debug-stat debug-stat-warning">
                          <span className="debug-stat-label">⚠️ Max Iterations:</span>
                          <span className="debug-stat-value">Reached</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {info.toolCalls.length > 0 && (
                    <div className="debug-section">
                      <h4 className="debug-section-title">
                        🔧 Tool Calls ({info.toolCalls.length})
                      </h4>
                      {info.toolCalls.map((call, callIdx) => (
                        <div key={callIdx} className="debug-tool-call">
                          <div className="debug-tool-header">
                            <span className="debug-tool-name">
                              {callIdx + 1}. {call.name}
                            </span>
                          </div>

                          <div className="debug-tool-section">
                            <h5 className="debug-tool-section-title">Parameters:</h5>
                            <pre className="debug-code">
                              {formatJSON(call.arguments)}
                            </pre>
                          </div>

                          {info.toolResults[call.name] && (
                            <div className="debug-tool-section">
                              <h5 className="debug-tool-section-title">Result:</h5>
                              <pre className="debug-code debug-result">
                                {formatJSON(info.toolResults[call.name])}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <details className="debug-raw-details">
                    <summary className="debug-raw-summary">
                      View Raw Response Data
                    </summary>
                    <pre className="debug-code debug-raw">
                      {formatJSON(info.rawResponse)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatbotDebug;
