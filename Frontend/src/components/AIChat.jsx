import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import EmployeeProfileCard from "@/components/EmployeeProfileCard";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Brain,
  Loader2,
  Minimize2,
  Maximize2
} from "lucide-react";
import { useAI } from "@/contexts/AIContext";

const AIChat = ({ isFloating = false, isOpen = true, onToggle, suggestionTrigger, mode = 'workforce' }) => {
  const { messages, setMessages, sendMessage, isLoading, clearChat } = useAI();
  const [inputMessage, setInputMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const isCareerCoach = mode === 'career_coach';
  const chatTitle = isCareerCoach ? "AI Career Coach" : "AI Workforce Assistant";
  const chatSubtitle = isCareerCoach ? "Personalized career growth and development insights" : "Ask questions about your team and get AI-powered insights";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (suggestionTrigger) {
      setInputMessage(suggestionTrigger);
    }
  }, [suggestionTrigger]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper function to render employee data as text for floating chat
  const renderEmployeeAsText = (employee) => {
    return `${employee.name} (${employee.role}) – Fitment ${employee.fitment}%, Fatigue ${employee.fatigue}%, ${employee.risk} Risk`;
  };

  // Helper function to render message content based on mode
  const renderMessageContent = (message) => {
    if (isFloating) {
      // Text-only mode for floating chat
      let textContent = message.content;

      if (message.detectedEmployees && message.detectedEmployees.length > 0) {
        const employeeTexts = message.detectedEmployees.map(renderEmployeeAsText);
        textContent += "\n\n" + employeeTexts.join("\n");
      }

      return (
        <div className="text-sm whitespace-pre-wrap break-words overflow-hidden">{textContent}</div>
      );
    } else {
      // Rich UI mode for full page
      return (
        <div className="w-full max-w-full space-y-4">
          <div className="whitespace-pre-wrap break-words overflow-hidden">{message.content}</div>

          {/* Employee Profile Cards */}
          {message.type === "ai" && message.detectedEmployees && message.detectedEmployees.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {message.detectedEmployees.map((employee, index) => (
                <div key={index} className="max-w-full overflow-hidden">
                  <EmployeeProfileCard employee={employee} />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");

    // Send to AI
    await sendMessage(inputMessage, mode);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedPrompts = [
    "Who is at burnout risk?",
    "Who should be reskilled?",
    "Who is underutilized?",
    "Show me high-risk employees",
    "Who are our top performers?",
    "Tell me about Sarah Johnson",
    "What about Michael Chen?"
  ];

  if (isFloating) {
    return (
      <>
        {/* Floating Button */}
        {!isOpen && (
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={onToggle}
              className="ai-float-btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
            >
              <Brain size={22} />
            </button>
          </div>
        )}

        {/* Chat Window */}
        {isOpen && (
          <div className="ai-chat-window fixed bottom-6 right-6 z-50 w-96 h-[600px] flex flex-col">
            {/* Header */}
            <div className="ai-chat-header flex items-center justify-between p-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#6D8196', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={14} style={{ color: '#FFFFE3' }} />
                </div>
                <span className="chat-title" style={{ fontWeight: 600, fontSize: '14px', color: '#FFFFFF' }}>{chatTitle}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', borderRadius: '6px', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBCBCB', transition: 'background 0.15s' }}
                >
                  {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
                <button
                  onClick={onToggle}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', borderRadius: '6px', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBCBCB', transition: 'background 0.15s' }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 && (
                    <div className="space-y-3">
                      <div className="text-center text-gray-500 text-sm mb-4">
                        Ask me anything about your workforce intelligence
                      </div>
                      <div className="space-y-2">
                        {suggestedPrompts.map((prompt, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="w-full text-left justify-start text-xs"
                            onClick={() => setInputMessage(prompt)}
                          >
                            {prompt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.type === "ai" && (
                          <div className="flex-shrink-0">
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(136,189,242,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Bot size={13} style={{ color: '#6A89A7' }} />
                            </div>
                          </div>
                        )}
                        <div
                          className={message.type === "user" ? "ai-user-bubble" : "ai-bot-bubble"}
                          style={{ maxWidth: '80%', padding: '10px 14px' }}
                        >
                          <div className="w-full max-w-full overflow-y-auto space-y-4">
                            {renderMessageContent(message)}
                          </div>

                          <div className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                        {message.type === "user" && (
                          <div className="flex-shrink-0">
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#6A89A7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={13} style={{ color: '#BDDDFC' }} />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
                        <div style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(136,189,242,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Bot size={13} style={{ color: '#6A89A7' }} />
                        </div>
                        <div className="ai-bot-bubble" style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Loader2 size={13} style={{ color: '#6A89A7', animation: 'spin 0.8s linear infinite' }} />
                            <span style={{ fontSize: '13px', color: '#6A89A7' }}>Analyzing workforce data...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input */}
                <div style={{ padding: '12px 14px', borderTop: '1px solid #E6E6E6', background: '#FAFBFC' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about workforce intelligence..."
                      style={{ flex: 1, fontSize: '13px', borderColor: '#E6E6E6', borderRadius: '8px' }}
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      style={{ background: '#053259', color: 'white', border: 'none', borderRadius: '8px', padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!inputMessage.trim() || isLoading) ? 0.5 : 1, transition: 'opacity 0.15s, background 0.15s' }}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </>
    );
  }

  // Full Page Version (Embedded in Page Layout)
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{chatTitle}</h2>
            <p className="text-sm text-slate-600">{chatSubtitle}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={clearChat} className="border-slate-200">
          Clear Chat
        </Button>
      </div>

      {/* Scrollable Chat Messages */}
      <ScrollArea className="flex-1 p-6 overflow-y-auto">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                    <h3 className="text-lg font-medium mb-2">AI Workforce Assistant Ready</h3>
                    <p className="text-sm">Ask me anything about your workforce intelligence, employee performance, or optimization opportunities.</p>
                  </div>
                )}

                <div className="space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.type === "ai" && (
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Bot className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] p-4 rounded-lg shadow-sm ${
                          message.type === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-900 border border-slate-200"
                        } break-words overflow-hidden`}
                      >
                        {renderMessageContent(message)}
                        <div className={`text-[10px] mt-2 font-medium opacity-60 ${message.type === "user" ? "text-blue-100" : "text-slate-500"}`}>
                          {message.timestamp.toLocaleString()}
                        </div>
                      </div>
                      {message.type === "user" && (
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-4 justify-start">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bot className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-gray-600">Analyzing workforce data...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

      {/* Input */}
      <div className="p-6 border-t border-slate-200 bg-white">
        <div className="flex gap-3">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about workforce intelligence, employee performance, or optimization opportunities..."
            className="flex-1 border-slate-200"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;