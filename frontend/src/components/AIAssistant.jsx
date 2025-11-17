import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, MessageCircle, Sparkles, Minimize2, Maximize2, RotateCcw, Copy, Check } from 'lucide-react';

const AIAssistant = ({ meetingId, onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [conversation, setConversation] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! I\'m your Connectify AI Assistant. I can help you with meeting tasks, answer questions, and provide assistance. How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString()
    };

    setConversation(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage('');
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_DEV_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: currentMessage,
          context: conversation
            .filter(msg => msg.sender === 'user' || msg.sender === 'ai')
            .map(msg => ({
              sender: msg.sender === 'user' ? 'user' : 'assistant',
              text: msg.text
            }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      // Clean up the response text (remove markdown asterisks if needed)
      const cleanedText = data.response?.replace(/\*\*/g, '').replace(/\*/g, '') || data.response;
      
      const aiResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: cleanedText,
        timestamp: new Date().toISOString()
      };

      setConversation(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message to AI:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: error.message === 'Failed to fetch' 
          ? 'Unable to connect to the server. Please check your connection and try again.'
          : `Sorry, I encountered an error: ${error.message}. Please try again later.`,
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setConversation([
      {
        id: 1,
        sender: 'ai',
        text: 'Hello! I\'m your Connectify AI Assistant. I can help you with meeting tasks, answer questions, and provide assistance. How can I help you today?',
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={toggleAssistant}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-2xl z-50 transition-all duration-300 hover:scale-110 group animate-float"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-pink-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></div>
        <MessageCircle className="h-7 w-7 relative z-10" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg">
          <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
        </div>
      </button>
    );
  }

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 ease-in-out ${
        isExpanded 
          ? 'inset-4 sm:inset-8' 
          : 'bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[440px] h-screen sm:h-[85vh] sm:max-h-[700px] sm:rounded-2xl'
      }`}
    >
      <div className="w-full h-full flex flex-col bg-white shadow-2xl sm:rounded-2xl overflow-hidden border-t sm:border border-gray-200/50 backdrop-blur-xl">
        {/* Premium Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-5 py-4">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-300/20 rounded-full blur-2xl"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 blur-lg rounded-2xl"></div>
                <div className="relative p-2.5 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
                  <Bot className="h-6 w-6" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-lg">
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  AI Assistant
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </h3>
                <div className="flex items-center space-x-1.5 text-xs opacity-90 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse shadow-lg shadow-green-300/50"></div>
                  <span className="font-medium">Always available</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5">
              <button 
                className="h-9 w-9 text-white hover:bg-white/20 rounded-xl transition-all duration-200 flex items-center justify-center backdrop-blur-sm border border-white/20 hover:border-white/40 group"
                onClick={clearConversation}
                title="Clear conversation"
              >
                <RotateCcw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <button 
                className="h-9 w-9 text-white hover:bg-white/20 rounded-xl transition-all duration-200 flex items-center justify-center backdrop-blur-sm border border-white/20 hover:border-white/40"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Minimize" : "Maximize"}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button 
                className="h-9 w-9 text-white hover:bg-white/20 rounded-xl transition-all duration-200 flex items-center justify-center backdrop-blur-sm border border-white/20 hover:border-white/40"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Messages Area - ChatGPT Style */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-3xl mx-auto">
            {conversation.map((msg, index) => (
              <div 
                key={msg.id} 
                className={`group border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200 ${
                  msg.sender === 'ai' ? 'bg-gray-50/30' : ''
                }`}
              >
                <div className="px-4 sm:px-6 py-6 sm:py-8 flex gap-4 sm:gap-6 max-w-full">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {msg.sender === 'ai' ? (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-sm font-bold shadow-md">
                        U
                      </div>
                    )}
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {msg.sender === 'ai' ? 'AI Assistant' : 'You'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words text-sm sm:text-base">
                        {msg.text}
                      </p>
                    </div>
                    
                    {/* Action buttons - ChatGPT style */}
                    {msg.sender === 'ai' && (
                      <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded-lg transition-all duration-200"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-green-600" />
                              <span className="text-green-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="bg-gray-50/30 border-b border-gray-100">
                <div className="px-4 sm:px-6 py-6 sm:py-8 flex gap-4 sm:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <span className="text-sm font-semibold text-gray-900">AI Assistant</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Premium Input Area */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
            <div className="relative">
              {/* Textarea container */}
              <div className="relative rounded-2xl border border-gray-300 hover:border-gray-400 focus-within:border-indigo-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md focus-within:shadow-lg overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message AI Assistant..."
                  rows={1}
                  className="w-full px-4 py-3.5 pr-12 resize-none focus:outline-none text-sm sm:text-base bg-transparent max-h-[120px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                  disabled={isLoading}
                  style={{ minHeight: '52px' }}
                />
                
                {/* Send button */}
                <button 
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-2.5 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-indigo-600 disabled:hover:via-purple-600 disabled:hover:to-pink-600 shadow-md hover:shadow-lg disabled:shadow-md group"
                >
                  <Send className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                </button>
              </div>
              
              {/* Footer text */}
              <div className="flex items-center justify-center mt-3 text-xs text-gray-500 gap-1.5">
                <Sparkles className="h-3 w-3 opacity-50" />
                <span>AI can make mistakes. Check important info.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: rgb(209 213 219);
          border-radius: 3px;
        }
        
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default AIAssistant;