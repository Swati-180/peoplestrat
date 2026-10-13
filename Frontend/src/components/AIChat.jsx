import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import EmployeeProfileCard from "@/components/EmployeeProfileCard";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Brain,
  Loader2,
  Minimize2,
  Maximize2,
  Minus,
  ChevronUp,
  ArrowLeftRight
} from "lucide-react";
import { useAI } from "@/contexts/AIContext";

const AIChat = ({ isFloating = false, isOpen = true, onToggle, suggestionTrigger, mode = 'workforce' }) => {
  const {
    messages,
    setMessages,
    sendMessage,
    isLoading,
    clearChat,
    workforceData,
    isChatDocked: contextIsDocked,
    setIsChatDocked: contextSetIsDocked,
    dockPosition: contextDockPosition,
    setDockPosition: contextSetDockPosition
  } = useAI();
  const [localIsDocked, setLocalIsDocked] = useState(false);
  const [localDockPosition, setLocalDockPosition] = useState("right");

  const isDocked = contextIsDocked !== undefined ? contextIsDocked : localIsDocked;
  const setIsDocked = contextSetIsDocked || setLocalIsDocked;
  const dockPosition = contextDockPosition || localDockPosition;
  const setDockPosition = contextSetDockPosition || setLocalDockPosition;

  const [inputMessage, setInputMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef(null);

  const isCareerCoach = mode === 'career_coach';
  const chatTitle = isCareerCoach ? "AI Career Coach" : "AI Workforce Assistant";
  const chatSubtitle = isCareerCoach ? "Personalized career growth and development insights" : "Ask questions about your team and get AI-powered insights";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    if (suggestionTrigger) {
      setInputMessage(suggestionTrigger);
    }
  }, [suggestionTrigger]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setIsDocked(false);
    }
  }, [isOpen]);

  // Helper function to render employee data as text for floating chat
  const renderEmployeeAsText = (employee) => {
    return `${employee.name} (${employee.role}) – Fitment ${employee.fitment}%, Fatigue ${employee.fatigue}%, ${employee.risk} Risk`;
  };

  // Helper function to render message content based on mode
  const renderMessageContent = (message) => {
    if (isCareerCoach && message.type === 'ai') {
      // State C: Genuine Groq/API failure — isFallback explicitly true
      if (message.isFallback) {
        return (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">Career insights temporarily unavailable</p>
                <p className="text-xs text-amber-700 mt-0.5">The AI service is experiencing issues. Please try again in a moment.</p>
              </div>
            </div>
          </div>
        );
      }

      // States A & B: Real Groq response — parse the JSON
      try {
        const parsed = JSON.parse(message.content);
        const hasFitment = parsed.fitmentScore !== null && parsed.fitmentScore !== undefined
                           && parsed.fitmentLabel && parsed.fitmentLabel !== 'Unavailable';

        return (
          <div className="w-full space-y-4">
            {/* Summary — always shown from real AI */}
            <div className="text-sm text-slate-800 leading-relaxed">
              {parsed.summary}
            </div>

            {/* State B: Real fitment score present */}
            {hasFitment && (
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-900">Fitment</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded">
                    {parsed.fitmentLabel}
                  </span>
                  <span className="text-sm font-bold text-blue-700">{parsed.fitmentScore}%</span>
                </div>
              </div>
            )}

            {/* State A: Real AI response but no fitment data — small factual note only */}
            {!hasFitment && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
                <span className="text-slate-400 shrink-0 text-base">ℹ</span>
                <p className="text-xs text-slate-500">
                  Fitment score not yet available. Complete your{' '}
                  <span className="font-semibold text-slate-600">Behavioral Assessment</span>{' '}
                  to unlock your personalized fitment insights.
                </p>
              </div>
            )}

            {/* Focus Areas */}
            {parsed.focusAreas && parsed.focusAreas.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Key Focus Areas</h4>
                {parsed.focusAreas.map((area, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-bold text-slate-800">{area.title}</span>
                      {area.potential && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          +{area.potential}% potential
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{area.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Recommended Skills */}
            {parsed.recommendedSkills && parsed.recommendedSkills.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recommended Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {parsed.recommendedSkills.map((skill, idx) => (
                    <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Career Actions */}
            {parsed.careerActions && parsed.careerActions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Next Steps</h4>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                  {parsed.careerActions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      } catch (e) {
        // JSON parse failed — treat as fallback
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Career insights temporarily unavailable</p>
              <p className="text-xs text-amber-700 mt-0.5">The AI service is experiencing issues. Please try again in a moment.</p>
            </div>
          </div>
        );
      }
    }

    if (message.type === "user") {
      return (
        <div className={`whitespace-pre-wrap break-words min-w-0 overflow-hidden [overflow-wrap:anywhere] ${isFloating ? "text-sm" : ""}`}>
          {message.content}
        </div>
      );
    }

    if (isFloating) {
      // If expanded to fullscreen and employee cards detected, show card grid
      if (isFullscreen && message.type === "ai" && message.detectedEmployees && message.detectedEmployees.length > 0) {
        return (
          <div className="w-full max-w-full min-w-0 space-y-4">
            <MarkdownRenderer content={message.content} className="text-sm" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {message.detectedEmployees.map((employee, index) => (
                <div key={index} className="max-w-full min-w-0 overflow-hidden">
                  <EmployeeProfileCard employee={employee} />
                </div>
              ))}
            </div>
          </div>
        );
      }

      // Compact floating mode: append text summary of employees to avoid card overflow
      let textContent = message.content;
      if (message.detectedEmployees && message.detectedEmployees.length > 0) {
        const employeeTexts = message.detectedEmployees.map(renderEmployeeAsText);
        textContent += "\n\n" + employeeTexts.join("\n");
      }

      return (
        <div className="w-full max-w-full min-w-0">
          <MarkdownRenderer content={textContent} className="text-sm" />
        </div>
      );
    } else {
      // Rich UI mode for full page
      return (
        <div className="w-full max-w-full min-w-0 space-y-4">
          <MarkdownRenderer content={message.content} />

          {/* Employee Profile Cards */}
          {message.type === "ai" && message.detectedEmployees && message.detectedEmployees.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {message.detectedEmployees.map((employee, index) => (
                <div key={index} className="max-w-full min-w-0 overflow-hidden">
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

  const knownEmployeeNames = Object.keys(workforceData || {});
  const sampleEmployeePrompt = knownEmployeeNames.length > 0 ? `Tell me about ${knownEmployeeNames[0]}` : null;

  const suggestedPrompts = [
    "Who is at burnout risk?",
    "Who should be reskilled?",
    "Who is underutilized?",
    "Show me high-risk employees",
    "Who are our top performers?",
    ...(sampleEmployeePrompt ? [sampleEmployeePrompt] : ["How to optimize team productivity?"])
  ];

  if (isFloating) {
    return (
      <>
        {/* Floating Button */}
        {!isOpen && (
          <div className={`fixed z-50 transition-all duration-300 ${
            dockPosition === 'left' ? 'bottom-6 left-6 lg:left-72' : 'bottom-6 right-6'
          }`}>
            <button
              onClick={onToggle}
              className="ai-float-btn"
              title="Open AI Assistant"
              aria-label="Open AI Assistant"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
            >
              <Brain size={22} />
            </button>
          </div>
        )}

        {/* Docked Pill Bar when minimized */}
        {isOpen && isDocked && !isFullscreen && (
          <div className={`fixed z-50 transition-all duration-300 ${
            dockPosition === 'left'
              ? 'bottom-4 left-4 sm:bottom-6 sm:left-6 lg:left-72'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6'
          }`}>
            <div className="flex items-center gap-2 bg-[#053259] text-white pl-3.5 pr-2 py-2 rounded-full shadow-xl border border-slate-700/50 hover:bg-[#073b68] transition-colors">
              <div className="w-6 h-6 rounded-md bg-[#6D8196] flex items-center justify-center shrink-0">
                <Brain size={13} className="text-[#FFFFE3]" />
              </div>
              <button
                type="button"
                onClick={() => setIsDocked(false)}
                className="text-xs font-semibold text-white/95 hover:text-white flex items-center gap-1.5 focus:outline-none cursor-pointer"
                title="Restore AI Assistant"
              >
                <span>{chatTitle}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>
              <div className="h-4 w-px bg-white/20 mx-0.5" />
              <button
                type="button"
                onClick={() => setDockPosition(dockPosition === 'right' ? 'left' : 'right')}
                title={dockPosition === 'right' ? "Move to left side" : "Move to right side"}
                aria-label={dockPosition === 'right' ? "Move to left side" : "Move to right side"}
                className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ArrowLeftRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => setIsDocked(false)}
                title="Restore window"
                aria-label="Restore window"
                className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDocked(false);
                  onToggle();
                }}
                title="Close assistant"
                aria-label="Close assistant"
                className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Backdrop for Expanded Fullscreen Mode */}
        {isOpen && isFullscreen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setIsFullscreen(false)}
            aria-hidden="true"
          />
        )}

        {/* Chat Window */}
        {isOpen && !isDocked && (
          <div
            className={`ai-chat-window fixed z-50 flex flex-col transition-all duration-300 ease-in-out bg-white ${
              isFullscreen
                ? "inset-3 sm:inset-6 md:inset-8 max-w-5xl mx-auto h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-3rem)] md:h-[calc(100vh-4rem)] rounded-2xl shadow-2xl"
                : dockPosition === 'left'
                  ? "bottom-3 left-3 sm:bottom-6 sm:left-6 lg:left-72 w-[calc(100vw-1.5rem)] sm:w-[370px] h-[520px] max-h-[calc(100vh-4.5rem)] rounded-2xl shadow-xl"
                  : "bottom-3 right-3 sm:bottom-6 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[370px] h-[520px] max-h-[calc(100vh-4.5rem)] rounded-2xl shadow-xl"
            }`}
          >
            {/* Header */}
            <div className="ai-chat-header flex items-center justify-between p-4 flex-shrink-0">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#6D8196', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={14} style={{ color: '#FFFFE3' }} />
                </div>
                <div className="min-w-0">
                  <span className="chat-title block truncate" style={{ fontWeight: 600, fontSize: '14px', color: '#FFFFFF' }}>{chatTitle}</span>
                  {isFullscreen && (
                    <span className="text-[11px] text-blue-200/90 block truncate">Expanded View</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {!isFullscreen && (
                  <button
                    type="button"
                    onClick={() => setDockPosition(dockPosition === 'right' ? 'left' : 'right')}
                    title={dockPosition === 'right' ? "Move assistant to left side" : "Move assistant to right side"}
                    aria-label={dockPosition === 'right' ? "Move assistant to left side" : "Move assistant to right side"}
                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', borderRadius: '6px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBCBCB', transition: 'background 0.15s' }}
                  >
                    <ArrowLeftRight size={14} />
                  </button>
                )}
                {!isFullscreen && (
                  <button
                    type="button"
                    onClick={() => setIsDocked(true)}
                    title="Minimize to dock"
                    aria-label="Minimize to dock"
                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', borderRadius: '6px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBCBCB', transition: 'background 0.15s' }}
                  >
                    <Minus size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? "Exit full screen" : "Expand to full screen"}
                  aria-label={isFullscreen ? "Exit full screen" : "Expand to full screen"}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', borderRadius: '6px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBCBCB', transition: 'background 0.15s' }}
                >
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDocked(false);
                    onToggle();
                  }}
                  title="Close assistant"
                  aria-label="Close assistant"
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', borderRadius: '6px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBCBCB', transition: 'background 0.15s' }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            <ScrollArea className="flex-1 min-h-0 w-full p-3 sm:p-4">
              {messages.length === 0 && (
                <div className="space-y-3 py-2">
                  <div className="text-center text-gray-500 text-sm mb-4">
                    Ask me anything about your workforce intelligence
                  </div>
                  <div className={`space-y-2 ${isFullscreen ? 'max-w-md mx-auto' : ''}`}>
                    {suggestedPrompts.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full text-left justify-start text-xs h-auto py-2 px-3 break-words whitespace-normal"
                        onClick={() => setInputMessage(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 w-full min-w-0">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2.5 sm:gap-3 w-full min-w-0 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.type === "ai" && (
                      <div className="flex-shrink-0">
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(136,189,242,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Bot size={13} style={{ color: '#6A89A7' }} />
                        </div>
                      </div>
                    )}
                    <div
                      className={
                        message.type === "user"
                          ? "ai-user-bubble max-w-[85%] sm:max-w-[80%] min-w-0"
                          : `ai-bot-bubble min-w-0 ${isFullscreen ? "max-w-[85%] sm:max-w-[85%]" : "flex-1 max-w-[calc(100%-38px)]"}`
                      }
                      style={{ padding: '10px 14px' }}
                    >
                      <div className="w-full max-w-full min-w-0 space-y-4">
                        {renderMessageContent(message)}
                      </div>

                      <div className="text-xs opacity-70 mt-1 flex items-center gap-2">
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        {message.isFallback && !isCareerCoach && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-medium border border-amber-200">
                            Rule-Based Fallback
                          </span>
                        )}
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
            <div className="flex-shrink-0" style={{ padding: '12px 14px', borderTop: '1px solid #E6E6E6', background: '#FAFBFC' }}>
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
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  style={{ background: '#053259', color: 'white', border: 'none', borderRadius: '8px', padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!inputMessage.trim() || isLoading) ? 0.5 : 1, transition: 'opacity 0.15s, background 0.15s' }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
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
                        } break-words overflow-hidden min-w-0`}
                      >
                        {renderMessageContent(message)}
                        <div className={`text-[10px] mt-2 font-medium opacity-60 flex items-center gap-2 ${message.type === "user" ? "text-blue-100" : "text-slate-500"}`}>
                          <span>{message.timestamp.toLocaleString()}</span>
                          {message.isFallback && !isCareerCoach && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-medium border border-amber-200">
                              Rule-Based Fallback
                            </span>
                          )}
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