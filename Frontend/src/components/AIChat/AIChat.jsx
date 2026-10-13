import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CloseIcon from '@mui/icons-material/Close';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { Rnd } from 'react-rnd';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ForumIcon from '@mui/icons-material/Forum';
import './AIChat.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const welcomeText = (user) =>
  `Hi ${user?.firstname || 'there'}! I can explain algorithms, review or debug your code, and help you prepare for interviews.

Ask a question below or pick a starter.`;

const MOBILE_BREAKPOINT = 600;
const EDGE = 16; // gap kept between the window and the viewport edge

// Size/position that always fits the current viewport.
const defaultLayout = () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(520, vw - EDGE * 2);
  const height = Math.min(Math.round(vh * 0.8), 680, vh - EDGE * 2);
  return { size: { width, height }, position: { x: vw - width - EDGE, y: vh - height - EDGE } };
};

const clampLayout = (size, position) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.max(Math.min(size.width, vw - EDGE), Math.min(320, vw - EDGE));
  const height = Math.max(Math.min(size.height, vh - EDGE), Math.min(320, vh - EDGE));
  return {
    size: { width, height },
    position: {
      x: Math.min(Math.max(0, position.x), Math.max(0, vw - width)),
      y: Math.min(Math.max(0, position.y), Math.max(0, vh - height)),
    },
  };
};

const AIChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [size, setSize] = useState(() => defaultLayout().size);
  const [position, setPosition] = useState(() => defaultLayout().position);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);
  const { pathname } = useLocation();
  const messagesEndRef = useRef(null);
  const prevSize = useRef(size);
  const prevPosition = useRef(position);
  const sizeRef = useRef(size);
  const positionRef = useRef(position);
  sizeRef.current = size;
  positionRef.current = position;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Keep the window inside the viewport when the browser is resized / rotated.
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
      const next = clampLayout(sizeRef.current, positionRef.current);
      setSize(next.size);
      setPosition(next.position);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Scroll to the newest message whenever the conversation changes.
  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, isLoading, open]);

  // Helper to get user-specific key
  const getUserKey = (base) => {
    return user && user._id ? `${base}_${user._id}` : base;
  };

  // Initialize with welcome message or load from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem(getUserKey('aiChatMessages'));
    const savedHistory = localStorage.getItem(getUserKey('aiChatHistory'));
    
    if (savedMessages && savedHistory) {
      try {
        // Parse and revive timestamps as Date objects
        const parsedMessages = JSON.parse(savedMessages).map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
        setChatHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading chat history:', error);
        initializeWelcomeMessage();
      }
    } else {
      initializeWelcomeMessage();
    }
  }, [user]);

  const initializeWelcomeMessage = () => {
    setMessages([
      {
        id: 1,
        type: 'ai',
        content: welcomeText(user),
        timestamp: new Date()
      }
    ]);
  };

  const MAX_HISTORY = 30;
  const chatFull = messages.length >= MAX_HISTORY;

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    // Prepare new messages/history arrays, keeping only the last MAX_HISTORY
    const updatedMessages = [...messages, userMessage].slice(-MAX_HISTORY);
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/ai/chat`, {
        message: inputMessage,
        chatHistory: [...chatHistory, { role: 'user', content: inputMessage }].slice(-MAX_HISTORY)
      }, { withCredentials: true });

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.response,
        timestamp: new Date()
      };

      // Add AI message and trim to last MAX_HISTORY
      const finalMessages = [...updatedMessages, aiMessage].slice(-MAX_HISTORY);
      setMessages(finalMessages);
      const finalHistory = [...chatHistory, { role: 'user', content: inputMessage }, { role: 'assistant', content: response.data.response }].slice(-MAX_HISTORY);
      setChatHistory(finalHistory);

      // Save to user-specific localStorage
      localStorage.setItem(getUserKey('aiChatMessages'), JSON.stringify(finalMessages));
      localStorage.setItem(getUserKey('aiChatHistory'), JSON.stringify(finalHistory));
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      const finalMessages = [...updatedMessages, errorMessage].slice(-MAX_HISTORY);
      setMessages(finalMessages);
      localStorage.setItem(getUserKey('aiChatMessages'), JSON.stringify(finalMessages));
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content) => {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  };

  const clearChat = () => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: welcomeText(user),
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    setChatHistory([]);
    
    // Clear user-specific localStorage
    localStorage.setItem(getUserKey('aiChatMessages'), JSON.stringify([welcomeMessage]));
    localStorage.setItem(getUserKey('aiChatHistory'), JSON.stringify([]));
  };

  const quickActions = [
    "Give me a Big-O cheat sheet for common data structures",
    "When should I use BFS vs DFS?",
    "How do I recognise a dynamic programming problem?",
    "Two pointers vs sliding window: when to use which?",
    "Make me a 4-week coding interview study plan",
    "What edge cases should I always test?",
  ];

  const handleQuickAction = (action) => {
    setInputMessage(action);
  };

  const exportChat = () => {
    const chatText = messages
      .filter(msg => msg.type !== 'ai' || !msg.content.includes('Hello') || !msg.content.includes('👋'))
      .map(msg => {
        const time = msg.timestamp.toLocaleString();
        const sender = msg.type === 'ai' ? 'AI Assistant' : 'You';
        return `[${time}] ${sender}: ${msg.content}`;
      })
      .join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExpand = () => {
    prevSize.current = size;
    prevPosition.current = position;
    setExpanded(true);
    // "Expanded" is a larger chat window, not full screen: capped width, centred.
    const width = Math.min(Math.round(window.innerWidth * 0.9), 760);
    const height = Math.round(window.innerHeight * 0.9);
    setSize({ width, height });
    setPosition({ x: Math.round((window.innerWidth - width) / 2), y: Math.round((window.innerHeight - height) / 2) });
  };

  const handleCompress = () => {
    setExpanded(false);
    setSize(prevSize.current);
    setPosition(prevPosition.current);
  };

  // Floating button. On problem pages the problem-specific AI Tutor tab replaces it
  // (and it used to sit on top of the Run / Submit buttons).
  if (!open) {
    if (pathname.startsWith('/problem/')) return null;
    return (
      <button className="ai-chat-fab" onClick={() => setOpen(true)} title="Open AI Chat">
        <ForumIcon style={{ fontSize: 32 }} />
      </button>
    );
  }

  // Floating chat window
  return (
    <div className="ai-chat-bounds">
    <Rnd
      size={isMobile ? { width: window.innerWidth, height: window.innerHeight } : size}
      position={isMobile ? { x: 0, y: 0 } : position}
      minWidth={Math.min(340, window.innerWidth - EDGE)}
      minHeight={Math.min(320, window.innerHeight - EDGE)}
      bounds="parent"
      dragHandleClassName="ai-chat-header"
      disableDragging={isMobile}
      enableResizing={!isMobile}
      onResizeStop={(e, direction, ref, delta, pos) => {
        setSize({ width: ref.offsetWidth, height: ref.offsetHeight });
        setPosition(pos);
      }}
      onDragStop={(e, d) => {
        setPosition({ x: d.x, y: d.y });
      }}
      className={`ai-chat-float-overlay${expanded ? ' expanded' : ''}`}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="ai-chat-header">
          <ForumIcon style={{ marginRight: 8, color: 'var(--tx-1976d2)' }} />
          <span style={{ fontWeight: 600 }}>AI Chat</span>
          <div className="ai-chat-float-controls">
            {!expanded ? (
              <button onClick={handleExpand} title="Expand">
                <CropSquareIcon />
              </button>
            ) : (
              <button onClick={handleCompress} title="Restore">
                <FullscreenExitIcon />
              </button>
            )}
            <button onClick={clearChat} title="Clear Chat">
              <DeleteOutlineIcon />
            </button>
            <button onClick={() => setOpen(false)} title="Close">
              <CloseIcon />
            </button>
          </div>
        </div>
        <div className="ai-chat-widget-body">
          <div className="ai-chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-avatar">
                  {message.type === 'ai' ? (
                    <ForumIcon className="ai-avatar" />
                  ) : (
                    <PersonIcon className="user-avatar" />
                  )}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {message.type === 'ai' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    ) : (
                      message.content.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)
                    )}
                  </div>
                  <div className="message-timestamp">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {messages.length === 1 && (
              <div className="quick-actions">
                <h4>Quick Actions:</h4>
                <div className="quick-actions-grid">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action)}
                      className="quick-action-btn"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {isLoading && (
              <div className="message ai">
                <div className="message-avatar">
                  <ForumIcon className="ai-avatar" />
                </div>
                <div className="message-content">
                  <div className="message-text">
                    <CircularProgress size={20} style={{ color: 'var(--tx-1976d2)' }} />
                    <span style={{ marginLeft: '10px' }}>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-chat-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={chatFull ? "You've reached the maximum chat length. Please clear the chat to continue." : "Ask me anything about programming..."}
              disabled={isLoading || chatFull}
              rows={1}
            />
            <button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isLoading || chatFull}
              className="send-button"
            >
              <SendIcon />
            </button>
          </div>
          {chatFull && (
            <div className="chat-full-warning">
              You've reached the maximum chat length (30 messages).<br />
              Please clear the chat to continue.
            </div>
          )}
        </div>
      </div>
    </Rnd>
    </div>
  );
};

export default AIChat; 