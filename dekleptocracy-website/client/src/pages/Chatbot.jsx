import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isAuthenticated, verifyToken } from '../utils/auth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SEO from '../components/common/SEO';
import { STORAGE_KEYS } from '../utils/constants';
import './Chatbot.css';

// localStorage utilities for chat history
const STORAGE_KEY = STORAGE_KEYS.CHAT_HISTORY;

const getChatHistory = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { chats: [], currentChatId: null };
  } catch {
    return { chats: [], currentChatId: null };
  }
};

const saveChatHistory = (history) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Silent fail for localStorage issues
  }
};

// Fallback title generation using keyword extraction (used if LLM fails)
const generateChatTitleFallback = (messages) => {
  const firstUserMessage = messages.find((msg) => msg.role === 'user');
  if (!firstUserMessage) return 'New Chat';

  const content = firstUserMessage.content;

  // Remove common question words and filler words
  const fillerWords = [
    'what',
    'how',
    'why',
    'when',
    'where',
    'who',
    'which',
    'is',
    'are',
    'was',
    'were',
    'the',
    'a',
    'an',
    'can',
    'could',
    'would',
    'should',
    'do',
    'does',
    'did',
    'have',
    'has',
    'had',
    'be',
    'been',
    'being',
    'me',
    'you',
    'please',
    'tell',
    'show',
    'give',
    'explain',
    'about',
    'for',
    'of',
    'to',
    'in',
    'on',
    'at',
  ];

  // Extract sentences (split by question marks or periods)
  const sentences = content.split(/[.?!]+/).filter((s) => s.trim().length > 0);
  const firstSentence = sentences[0].trim();

  // Split into words and filter
  const words = firstSentence
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => {
      // Remove punctuation
      const cleanWord = word.replace(/[^\w\s]/g, '');
      // Keep words that are not filler words and are at least 3 chars
      return cleanWord.length >= 3 && !fillerWords.includes(cleanWord);
    })
    .map((word) => word.replace(/[^\w\s]/g, '')); // Clean punctuation

  // If we extracted meaningful words, create a title from them
  if (words.length > 0) {
    // Capitalize first letter of each word
    const titleWords = words
      .slice(0, 6)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

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
  const firstUserMessage = messages.find((msg) => msg.role === 'user');
  if (!firstUserMessage) return 'New Chat';

  try {
    // Call the backend API for LLM-generated title
    const response = await fetch(`${mcpServerUrl}/generate-title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: firstUserMessage.content,
      }),
      signal: AbortSignal.timeout(5000), // 5 second timeout
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
  } catch {
    // Fallback to keyword extraction if LLM fails
    return generateChatTitleFallback(messages);
  }
};

const Chatbot = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm your AI assistant with access to comprehensive trade and tariff analysis tools. I can help you with:\n\n• Trade statistics and economic data\n• Tariff rates and policy impacts\n• Stock market and financial information\n• News and trade policy updates\n• General questions about policy impacts on your budget\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState(() => getChatHistory());
  const [showHistory, setShowHistory] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userLocation, setUserLocation] = useState(null); // null = uninitialized, only set when user selects
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [, setLoadingStatus] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const hasSubmittedInitialQuery = useRef(false);
  const recognitionRef = useRef(null);

  // MCP Server URL - uses environment variable in production, localhost in development
  const MCP_SERVER_URL = import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:8000';
  // Import API_URL from shared utility for consistent production/development handling
  const API_URL =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? import.meta.env.VITE_API_URL_PRODUCTION ||
        'https://node-server-production-7f39.up.railway.app'
      : import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Check authentication on mount - optimized for speed
  useEffect(() => {
    const checkAuth = async () => {
      // Quick check: just verify token exists in localStorage
      if (!isAuthenticated()) {
        navigate('/chatbot/login', { state: { from: { pathname: '/chatbot' } } });
        return;
      }

      // Set auth as checked immediately (optimistic)
      setAuthChecked(true);

      // Verify token with backend in background (non-blocking)
      // Only redirect if token is actually invalid
      try {
        const isValid = await verifyToken();
        if (!isValid) {
          navigate('/chatbot/login', { state: { from: { pathname: '/chatbot' } } });
        }
      } catch {
        // Don't redirect on network error
      }
    };

    checkAuth();
  }, [navigate]);

  // Load user location preference from backend - with caching
  useEffect(() => {
    const loadUserLocation = async () => {
      try {
        const token = localStorage.getItem('token');

        // Load from cache first (instant)
        const cachedPrefs = localStorage.getItem('user_preferences');
        if (cachedPrefs) {
          try {
            const prefs = JSON.parse(cachedPrefs);
            if (prefs.selectedState) {
              setUserLocation(prefs.selectedState);
            }
          } catch {
            // Silent fail for corrupt cached preferences
          }
        }

        if (!token) return;

        // Fetch fresh data in background
        const response = await fetch(`${API_URL}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user.preferences?.selectedState) {
            // Update cache
            localStorage.setItem('user_preferences', JSON.stringify(data.user.preferences));
            // Update state if different from cache
            setUserLocation(data.user.preferences.selectedState);
          }
        }
      } catch {
        // Silent fail for user location loading
      }
    };

    if (authChecked) {
      loadUserLocation();
    }
  }, [authChecked, API_URL]);

  // Update welcome message when userLocation is loaded
  useEffect(() => {
    if (userLocation && messages.length === 1 && messages[0].id === '1') {
      // Update the initial welcome message with location context
      const locationDisplay = userLocation === 'nationwide' ? 'All States' : userLocation;
      const locationContext =
        userLocation === 'nationwide' ? 'nationwide' : `${userLocation}-specific`;

      const updatedWelcomeMessage = `Hello! I'm your AI assistant with access to comprehensive trade and tariff analysis tools. I can help you with:

• Trade statistics and economic data
• Tariff rates and policy impacts
• Stock market and financial information
• News and trade policy updates
• General questions about policy impacts on your budget

I see you're looking at **${locationDisplay}** data. When you ask about prices or impacts without specifying a location, I'll provide ${locationContext} information by default.

How can I help you today?`;

      setMessages([
        {
          ...messages[0],
          content: updatedWelcomeMessage,
        },
      ]);
    }
  }, [userLocation]); // Only run when userLocation changes

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle initial query from navigation state
  useEffect(() => {
    if (location.state?.initialQuery && !hasSubmittedInitialQuery.current) {
      hasSubmittedInitialQuery.current = true;
      const query = location.state.initialQuery;
      // Clear the location state to prevent resubmission on page reload
      navigate(location.pathname, { replace: true, state: {} });
      submitMessage(query);
    }
  }, [location.state, navigate, location.pathname]);

  // Save current chat to history after messages change
  useEffect(() => {
    if (messages.length > 1) {
      // More than just the welcome message
      saveCurrentChat();
    }
  }, [messages]);

  const saveCurrentChat = async () => {
    const history = getChatHistory();
    const chatId = currentChatId || Date.now().toString();

    // Generate title using LLM (with fallback to keyword extraction)
    const title = await generateChatTitle(messages, MCP_SERVER_URL);

    const existingChatIndex = history.chats.findIndex((chat) => chat.id === chatId);
    const chatData = {
      id: chatId,
      title: title,
      messages: messages,
      createdAt:
        existingChatIndex >= 0
          ? history.chats[existingChatIndex].createdAt
          : new Date().toISOString(),
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
    const chat = history.chats.find((c) => c.id === chatId);

    if (chat) {
      setMessages(
        chat.messages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      );
      setCurrentChatId(chatId);
      setShowHistory(false);
    }
  };

  const startNewChat = () => {
    const locationDisplay = userLocation === 'nationwide' ? 'All States' : userLocation;
    const locationContext =
      userLocation === 'nationwide' ? 'nationwide' : `${userLocation}-specific`;

    const welcomeMessage = userLocation
      ? `Hello! I'm your AI assistant with access to comprehensive trade and tariff analysis tools. I can help you with:

• Trade statistics and economic data
• Tariff rates and policy impacts
• Stock market and financial information
• News and trade policy updates
• General questions about policy impacts on your budget

I see you're looking at **${locationDisplay}** data. When you ask about prices or impacts without specifying a location, I'll provide ${locationContext} information by default.

How can I help you today?`
      : "Hello! I'm your AI assistant with access to comprehensive trade and tariff analysis tools. I can help you with:\n\n• Trade statistics and economic data\n• Tariff rates and policy impacts\n• Stock market and financial information\n• News and trade policy updates\n• General questions about policy impacts on your budget\n\nHow can I help you today?";

    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: welcomeMessage,
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
    history.chats = history.chats.filter((chat) => chat.id !== chatId);

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

    // Set initial loading status
    const statusMessages = [
      'Analyzing your question...',
      'Searching trade data...',
      'Processing information...',
      'Generating response...',
    ];
    let statusIndex = 0;
    setLoadingStatus(statusMessages[0]);

    // Rotate status messages during loading
    const statusInterval = setInterval(() => {
      statusIndex = (statusIndex + 1) % statusMessages.length;
      setLoadingStatus(statusMessages[statusIndex]);
    }, 2000);

    try {
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Prepare messages with location context as system instruction
      const conversationMessages = [...messages, userMessage].map(({ role, content }) => ({
        role,
        content,
      }));

      // Add system message with location handling instructions at the start
      const systemMessage = {
        role: 'system',
        content: `You are an AI assistant helping users understand how government policies, tariffs, and economic decisions impact their budget and daily expenses.

LOCATION CONTEXT HANDLING:
${
  userLocation
    ? `- User's selected location: ${userLocation}
- When the user asks about prices, costs, or impacts WITHOUT specifying a location, use ${userLocation} as the default context
- PRIORITY ORDER for location context:
  1. HIGHEST: Locations explicitly mentioned in the user's question (e.g., "in Texas", "California prices")
  2. SECOND: User's saved location (${userLocation}) when no location is mentioned
  3. Use nationwide/general data only when appropriate or when comparing multiple states`
    : `- User has not selected a specific location yet
- When asked about prices or impacts, provide nationwide/general information
- If specific location data would be helpful, politely suggest that they can set their location in their profile for more personalized insights
- PRIORITY: Always use locations explicitly mentioned in the user's question first`
}

IMPORTANT GUIDELINES:
- When analyzing prices, tariffs, or policy impacts, always consider the location context
- If you find state-specific data that's relevant to the user's location, prioritize showing it
- Be clear about which location your data refers to in your responses
- If data for the user's location is not available, mention this and provide the closest relevant data`,
      };

      const messagesWithContext = [systemMessage, ...conversationMessages];

      const response = await fetch(`${MCP_SERVER_URL}/chat/intelligent/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesWithContext,
          use_mcp_tools: true,
          // Context window management parameters (optional)
          max_iterations: 10, // Maximum tool calling iterations
          max_total_tools: 8, // Maximum total tools to call
          preserve_recent_messages: 3, // Number of recent messages to preserve when truncating
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
            : msg,
        ),
      );
    } catch (error) {
      clearInterval(statusInterval);
      if (error.name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: `Error: ${error.message || 'Failed to get response. Make sure the MCP server is running on ' + MCP_SERVER_URL}`,
                  isLoading: false,
                }
              : msg,
          ),
        );
      }
    } finally {
      clearInterval(statusInterval);
      setIsLoading(false);
      setLoadingStatus('');
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

  const copyMessageToClipboard = (content) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setShowCopyNotification(true);
        setTimeout(() => setShowCopyNotification(false), 3000);
      })
      .catch(() => {
        // Silent fail for clipboard errors
      });
  };

  const regenerateResponse = async (messageId) => {
    // Find the user message that triggered this response
    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex <= 0) return;

    const userMessage = messages[messageIndex - 1];
    if (userMessage.role !== 'user') return;

    // Remove the assistant message and regenerate
    setMessages((prev) => prev.slice(0, messageIndex));
    await submitMessage(userMessage.content);
  };

  const clearConversation = () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      startNewChat();
    }
  };

  const exportChat = () => {
    const chatContent = messages
      .filter((msg) => msg.id !== '1') // Exclude welcome message
      .map((msg) => `${msg.role === 'user' ? 'You' : 'AI Assistant'}: ${msg.content}`)
      .join('\n\n');

    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleVoiceInput = () => {
    if (!speechSupported) {
      alert('Voice input is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const welcomeCards = [
    {
      icon: '📊',
      title: 'Tariff Analysis',
      description: 'Understand how tariffs affect prices in your state',
      query: 'How do tariffs impact prices in my state?',
    },
    {
      icon: '💰',
      title: 'Price Comparisons',
      description: 'Compare local vs national average costs',
      query: 'Compare prices in my state with national average',
    },
    {
      icon: '📈',
      title: 'Market Trends',
      description: 'Track stock market and economic indicators',
      query: 'What are the current market trends?',
    },
    {
      icon: '🏛️',
      title: 'Policy Impact',
      description: 'See how government decisions affect your budget',
      query: 'How do recent policies affect my household budget?',
    },
  ];

  // Generate contextual follow-up questions based on the conversation
  const generateFollowUps = (lastMessage) => {
    const content = lastMessage.content.toLowerCase();

    if (content.includes('tariff') || content.includes('tax')) {
      return [
        'How will this affect grocery prices?',
        "Compare with last year's data",
        'Show me state-by-state differences',
      ];
    } else if (content.includes('price') || content.includes('cost')) {
      return [
        "What's driving these price changes?",
        'Show me historical trends',
        'How does this compare nationally?',
      ];
    } else if (content.includes('stock') || content.includes('market')) {
      return [
        'What sectors are most affected?',
        'Show me related companies',
        "What's the outlook for next quarter?",
      ];
    } else if (content.includes('budget') || content.includes('impact')) {
      return [
        'Break down the cost increases',
        'What can I do to reduce impact?',
        'Show me similar cases',
      ];
    }

    // Default follow-ups
    return ['Tell me more about this', 'Show me related data', 'How does this affect my state?'];
  };

  // Memoized function to group chats by date
  const groupChatsByDate = useCallback((chats) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups = {
      Today: [],
      Yesterday: [],
      'Last 7 Days': [],
      Older: [],
    };

    chats.forEach((chat) => {
      const chatDate = new Date(chat.updatedAt);
      const chatDay = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());

      if (chatDay.getTime() === today.getTime()) {
        groups['Today'].push(chat);
      } else if (chatDay.getTime() === yesterday.getTime()) {
        groups['Yesterday'].push(chat);
      } else if (chatDate >= lastWeek) {
        groups['Last 7 Days'].push(chat);
      } else {
        groups['Older'].push(chat);
      }
    });

    return groups;
  }, []);

  // Memoize grouped chat history to prevent recalculation on every render
  const groupedChatHistory = useMemo(() => {
    return groupChatsByDate(chatHistory.chats);
  }, [chatHistory.chats, groupChatsByDate]);

  // Show loading state while checking authentication
  if (!authChecked) {
    return (
      <div className="chatbot-page">
        <div className="auth-loading-spinner">
          <div className="spinner"></div>
          <p className="spinner-text">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbot-page">
      <SEO
        title="AI Policy Assistant"
        description="Ask our AI chatbot about policy impacts, price changes, and budget effects. Get instant, data-driven answers tailored to your location."
        url="/chatbot"
        noindex={true}
      />

      {/* Sidebar Toggle — Mobile only, SVG hamburger */}
      <button
        className={`sidebar-toggle-mobile ${showHistory ? 'hidden' : ''}`}
        onClick={() => setShowHistory(true)}
        title="Open chat history"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* History Sidebar */}
      <div className={`chat-history-sidebar ${showHistory ? 'show-mobile' : ''}`}>
        <div className="history-header">
          <h2 className="history-title">History</h2>
          <button
            className="history-close-btn-mobile"
            onClick={() => setShowHistory(false)}
            title="Close sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <button className="new-chat-btn" onClick={startNewChat}>
          New Chat
        </button>

        <div className="history-list">
          {chatHistory.chats.length === 0 ? (
            <div className="history-empty">No chat history yet</div>
          ) : (
            (() => {
              return Object.entries(groupedChatHistory).map(([groupName, chats]) => {
                if (chats.length === 0) return null;

                return (
                  <div key={groupName} className="history-date-group">
                    <div className="history-date-header">{groupName}</div>
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`history-item ${chat.id === currentChatId ? 'active' : ''}`}
                        onClick={() => loadChat(chat.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            loadChat(chat.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Load chat: ${chat.title}`}
                      >
                        <div className="history-item-content">
                          <div className="history-item-title">{chat.title}</div>
                        </div>
                        <button
                          className="history-delete-btn"
                          onClick={(e) => deleteChat(chat.id, e)}
                          title="Delete chat"
                          aria-label={`Delete chat: ${chat.title}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                );
              });
            })()
          )}
        </div>
      </div>

      {/* Overlay — Mobile only */}
      {showHistory && (
        <div className="history-overlay-mobile" onClick={() => setShowHistory(false)} />
      )}

      {/* Copy Notification */}
      {showCopyNotification && <div className="copy-notification">Copied to clipboard</div>}

      {/* Main Chat Container */}
      <div className="chatbot-main">
        {/* Header — location only */}
        {userLocation && (
          <div className="chatbot-header">
            <div className="header-inner">
              <span className="header-badge">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="14"
                  height="14"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {userLocation === 'nationwide' ? 'All States' : userLocation}
              </span>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="chatbot-messages">
          <div className="chatbot-messages-inner">
            {messages.length <= 1 ? (
              /* Welcome State */
              <div className="welcome-state">
                <h2 className="welcome-greeting">What can I help you with?</h2>
                {userLocation && (
                  <p className="welcome-subtitle">
                    Analyzing data for {userLocation === 'nationwide' ? 'all states' : userLocation}
                  </p>
                )}
                <div className="welcome-pills">
                  {welcomeCards.map((card, index) => (
                    <button
                      key={index}
                      className="welcome-pill"
                      type="button"
                      onClick={() => {
                        setInput(card.query);
                        setTimeout(() => handleSubmit(new Event('submit')), 100);
                      }}
                    >
                      <span className="welcome-pill-icon">{card.icon}</span>
                      {card.title}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message List — filter out welcome message */
              messages
                .filter((msg) => msg.id !== '1')
                .map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}
                  >
                    <div className="message-avatar">{message.role === 'user' ? '👤' : '🤖'}</div>
                    <div className="message-content">
                      <div className="message-text">
                        {message.isLoading ? (
                          <div className="loading-indicator">
                            <div className="loading-dots">
                              <span className="loading-dot"></span>
                              <span className="loading-dot"></span>
                              <span className="loading-dot"></span>
                            </div>
                          </div>
                        ) : (
                          <ReactMarkdown className="markdown-content" remarkPlugins={[remarkGfm]}>
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
                      {!message.isLoading && (
                        <>
                          <div className="message-actions">
                            <button
                              className="action-btn"
                              onClick={() => copyMessageToClipboard(message.content)}
                              title="Copy message"
                              aria-label="Copy message"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                            </button>
                            {message.role === 'assistant' && (
                              <button
                                className="action-btn"
                                onClick={() => regenerateResponse(message.id)}
                                title="Regenerate response"
                                aria-label="Regenerate response"
                                disabled={isLoading}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <polyline points="23 4 23 10 17 10"></polyline>
                                  <polyline points="1 20 1 14 7 14"></polyline>
                                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                </svg>
                              </button>
                            )}
                          </div>
                          {/* Follow-up suggestions — coral text links */}
                          {message.role === 'assistant' && !isLoading && (
                            <div className="follow-up-suggestions">
                              <div className="follow-up-chips">
                                {generateFollowUps(message)
                                  .slice(0, 3)
                                  .map((followUp, idx) => (
                                    <button
                                      key={idx}
                                      className="follow-up-chip"
                                      onClick={() => {
                                        setInput(followUp);
                                        setTimeout(() => handleSubmit(new Event('submit')), 100);
                                      }}
                                    >
                                      {followUp}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="chatbot-input-area">
          <form onSubmit={handleSubmit} className="chatbot-form">
            <div className="input-wrapper">
              {speechSupported && (
                <button
                  type="button"
                  className={`input-tool-btn ${isListening ? 'listening' : ''}`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                  aria-label={isListening ? 'Stop listening' : 'Voice input'}
                  onClick={toggleVoiceInput}
                  disabled={isLoading}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                  </svg>
                </button>
              )}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className="chatbot-input"
                rows={1}
                disabled={isLoading}
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={stopRequest}
                  className="chatbot-stop-btn"
                  aria-label="Stop generating"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="chatbot-send-btn"
                  aria-label="Send message"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              )}
            </div>

            {messages.length > 1 && (
              <div className="chatbot-actions-row">
                <div className="quick-actions-row">
                  <button
                    type="button"
                    className="quick-action-btn danger"
                    onClick={clearConversation}
                    aria-label="Clear conversation"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="quick-action-btn"
                    onClick={exportChat}
                    aria-label="Export chat"
                  >
                    Export
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
