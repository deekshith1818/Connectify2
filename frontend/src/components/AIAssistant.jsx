import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, MessageCircle, Sparkles, Minimize2, Maximize2 } from 'lucide-react';

const AIAssistant = ({ meetingId, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! I\'m your Connectify AI Assistant. How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: conversation.length + 1,
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString()
    };

    setConversation(prev => [...prev, userMessage]);
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
          message: message,
          context: conversation
            .filter(msg => msg.sender === 'user' || msg.sender === 'ai')
            .map(msg => ({
              sender: msg.sender === 'user' ? 'user' : 'assistant',
              text: msg.text
            }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Remove asterisks and clean up the response text
      const cleanedText = data.response.replace(/\*\*/g, '').replace(/\*/g, '');
      
      const aiResponse = {
        id: conversation.length + 2,
        sender: 'ai',
        text: cleanedText,
        timestamp: new Date().toISOString()
      };

      setConversation(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message to AI:', error);
      const errorMessage = {
        id: conversation.length + 2,
        sender: 'ai',
        text: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={toggleAssistant}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 rounded-full w-14 h-14 sm:w-16 sm:h-16 p-0 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-2xl z-50 transition-all duration-300 hover:scale-110 group"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
        <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 relative z-10" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
      </button>
    );
  }

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 ease-in-out ${
        isExpanded 
          ? 'inset-4 sm:inset-8' 
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100%-2rem)] sm:w-96 h-[calc(100vh-2rem)] sm:h-[600px] max-h-[600px]'
      }`}
    >
      <div className="w-full h-full flex flex-col bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white p-4 flex flex-row justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 animate-pulse"></div>
          <div className="flex items-center space-x-3 relative z-10">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
              <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">AI Assistant</h3>
              <div className="flex items-center space-x-1 text-xs opacity-90">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 relative z-10">
            <button 
              className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20 rounded-lg transition-all duration-200 flex items-center justify-center backdrop-blur-sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button 
              className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20 rounded-lg transition-all duration-200 flex items-center justify-center backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="space-y-4">
            {conversation.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} opacity-0 animate-fadeIn`}
                style={{ animation: 'fadeIn 0.3s ease-out forwards' }}
              >
                {msg.sender === 'ai' && (
                  <div className="flex-shrink-0 mr-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
                <div 
                  className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-sm' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm sm:text-base leading-relaxed">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-indigo-100' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.sender === 'user' && (
                  <div className="flex-shrink-0 ml-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                      U
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start opacity-0 animate-fadeIn" style={{ animation: 'fadeIn 0.3s ease-out forwards' }}>
                <div className="flex-shrink-0 mr-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                    <Sparkles className="h-4 w-4 text-white animate-pulse" />
                  </div>
                </div>
                <div className="flex space-x-2 items-center bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base bg-gray-50 hover:bg-white"
              disabled={isLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg disabled:hover:shadow-md flex items-center justify-center min-w-[3rem]"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
            <Sparkles className="h-3 w-3" />
            <span>AI may produce inaccurate information</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AIAssistant;