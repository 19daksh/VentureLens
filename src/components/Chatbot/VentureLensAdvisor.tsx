import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Bot,
  X,
  Send,
  Trash2,
  Minimize2,
  Maximize2,
  AlertCircle,
  RefreshCw,
  Square,
  ArrowRight,
  Info,
  ChevronDown,
  Layers,
  Mic,
  MessageSquare,
} from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage } from '../../types/chat';
import { VoiceAdvisorView } from './VoiceAdvisorView';
import { Z_INDEX } from '../../constants/zIndex';

export const VentureLensAdvisor: React.FC = () => {
  const location = useLocation();
  const { user, session } = useAuth();
  const { getIdeaById, ideas } = useAnalysis();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [advisorMode, setAdvisorMode] = useState<'chat' | 'voice'>('chat');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [showContextDetails, setShowContextDetails] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Extract active idea context based on current route
  const activeIdeaId = useMemo(() => {
    const path = location.pathname;
    const matchAnalysis = path.match(/^\/analysis\/([^/]+)/);
    if (matchAnalysis) return matchAnalysis[1];

    const matchReport = path.match(/^\/report\/([^/]+)/);
    if (matchReport) return matchReport[1];

    return null;
  }, [location.pathname]);

  const activeIdea = useMemo(() => {
    if (!activeIdeaId) return null;
    return getIdeaById(activeIdeaId) || ideas.find((i) => i.id === activeIdeaId) || null;
  }, [activeIdeaId, getIdeaById, ideas]);

  // Initial greeting tailored to current context
  const defaultGreeting = useMemo<ChatMessage>(() => {
    if (activeIdea) {
      return {
        id: 'initial-greeting',
        role: 'assistant',
        content: `👋 **Hello! I'm VentureLens AI Advisor.**\n\nI have loaded the evaluation for **${activeIdea.title}** (Overall Score: **${activeIdea.analysis?.overall_score ?? 'N/A'}/100** — Verdict: **${activeIdea.analysis?.verdict_type ?? 'Under Review'}**).\n\nAsk me about your competitive moat, pricing model, customer acquisition, or why specific scores were awarded.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }
    return {
      id: 'initial-greeting',
      role: 'assistant',
      content: `👋 **Welcome to VentureLens AI Advisor.**\n\nI'm your startup strategy and venture diligence assistant. I can help you validate ideas, size addressable markets (TAM/SAM/SOM), assess defensibility, or structure an MVP.\n\nOpen any saved analysis to discuss specific scores, or ask a general startup question below.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }, [activeIdea?.id, activeIdea?.title, activeIdea?.analysis?.overall_score, activeIdea?.analysis?.verdict_type]);

  // Initialize or update default message if chat is fresh
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([defaultGreeting]);
    }
  }, [defaultGreeting, messages.length]);

  // Scroll to bottom smoothly on message updates
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Support global custom events to open the advisor (e.g. from navbar or analysis buttons)
  useEffect(() => {
    const handleOpenAdvisor = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: 'chat' | 'voice' }>;
      setIsOpen(true);
      if (customEvent.detail?.mode) {
        setAdvisorMode(customEvent.detail.mode);
      }
    };

    window.addEventListener('open-advisor' as any, handleOpenAdvisor);
    return () => {
      window.removeEventListener('open-advisor' as any, handleOpenAdvisor);
    };
  }, []);

  const handleClearConversation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    setErrorMessage(null);
    setLastFailedMessage(null);
    setMessages([defaultGreeting]);
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend !== undefined ? textToSend : inputMessage).trim();
    if (!query || isLoading) return;

    // Reset input
    setInputMessage('');
    setErrorMessage(null);
    setLastFailedMessage(null);

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    // Update conversation with user message and streaming placeholder
    const updatedMessages = [...messages, userMsg, assistantPlaceholder];
    setMessages(updatedMessages);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Build conversational history for API (filter placeholder)
      const apiHistory = messages
        .filter((m) => m.id !== 'initial-greeting' && !m.error)
        .map((m) => ({
          role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
          text: m.content,
        }));

      // Prepare payload
      const payload: any = {
        message: query,
        history: apiHistory,
        stream: true,
      };

      if (activeIdea) {
        payload.analysisId = activeIdea.id;
        // Pass verified client context fallback in case of demo account or local storage sync
        payload.clientContext = {
          isDemo: user?.id === '00000000-0000-4000-8000-000000000001' || !session?.access_token,
          title: activeIdea.title,
          industry: activeIdea.industry,
          target_audience: activeIdea.target_audience,
          description: activeIdea.description,
          additional_info: activeIdea.additional_info,
          overall_score: activeIdea.analysis?.overall_score,
          verdict: activeIdea.analysis?.verdict,
          verdict_type: activeIdea.analysis?.verdict_type,
          confidence_indicator: activeIdea.analysis?.confidence_indicator,
          executive_summary: activeIdea.analysis?.executive_summary,
          problem_score: activeIdea.analysis?.problem_score,
          market_score: activeIdea.analysis?.market_score,
          competition_score: activeIdea.analysis?.competition_score,
          revenue_score: activeIdea.analysis?.revenue_score,
          technical_score: activeIdea.analysis?.technical_score,
          customer_pain_points: activeIdea.analysis?.problem_validation?.customer_pain_points,
          tam: activeIdea.analysis?.market_analysis?.tam,
          sam: activeIdea.analysis?.market_analysis?.sam,
          som: activeIdea.analysis?.market_analysis?.som,
          demand_score: activeIdea.analysis?.market_analysis?.demand_score,
          growth_potential: activeIdea.analysis?.market_analysis?.growth_potential,
          market_trends: activeIdea.analysis?.market_analysis?.market_trends,
          key_insights: activeIdea.analysis?.market_analysis?.key_insights,
          competitors: activeIdea.analysis?.competitor_analysis?.competitors,
          recommended_business_model: activeIdea.analysis?.business_model?.recommended_business_model,
          customer_segment: activeIdea.analysis?.business_model?.customer_segment,
          pricing_strategy: activeIdea.analysis?.business_model?.pricing_strategy,
          revenue_streams: activeIdea.analysis?.business_model?.revenue_streams,
          monetization_strategy: activeIdea.analysis?.business_model?.monetization_strategy,
          unit_economics: activeIdea.analysis?.business_model?.unit_economics_considerations,
          technical_feasibility: activeIdea.analysis?.technical_feasibility,
          risks: activeIdea.analysis?.risks,
          mvp_phases: activeIdea.analysis?.mvp_roadmap?.phases,
          recommendations: activeIdea.analysis?.recommendations,
          go_to_market: activeIdea.analysis?.go_to_market,
          market_research: activeIdea.market_research?.research_data || activeIdea.analysis?.market_research?.research_data,
          financial_projection: activeIdea.financial_projection || activeIdea.analysis?.financial_projection,
          competitor_intelligence: activeIdea.competitor_intelligence?.research_data || activeIdea.analysis?.competitor_intelligence?.research_data,
        };
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else if (user?.id === '00000000-0000-4000-8000-000000000001') {
        headers['Authorization'] = 'Bearer demo-token';
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errDesc = 'VentureLens AI is temporarily unavailable. Please try again.';
        try {
          const errData = await response.json();
          if (errData?.error) errDesc = errData.error;
        } catch {
          // ignore non-json
        }
        throw new Error(errDesc);
      }

      // Check if SSE stream
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, content: accumulatedText, isStreaming: true }
                        : msg
                    )
                  );
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (parseErr: any) {
                if (dataStr !== '[DONE]') {
                  console.warn('Could not parse SSE chunk:', dataStr);
                }
              }
            }
          }
        }

        // Finalize completed streaming message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
          )
        );
      } else {
        // Standard JSON fallback
        const result = await response.json();
        const fullContent = result.text || result.data || 'No response provided.';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: fullContent, isStreaming: false }
              : msg
          )
        );
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[Advisor] Request aborted by user.');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: msg.content + '\n\n*(Response stopped)*', isStreaming: false }
              : msg
          )
        );
      } else {
        console.error('[Advisor] Error sending message:', err);
        const errorText = err?.message || 'VentureLens AI is temporarily unavailable. Please try again.';
        setErrorMessage(errorText);
        setLastFailedMessage(query);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: `⚠️ **Error**: ${errorText}`,
                  error: true,
                  isStreaming: false,
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

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage);
    }
  };

  // Quick Action Buttons
  const quickPrompts = useMemo(() => {
    if (activeIdea) {
      return [
        { label: '📊 Explain my score', prompt: 'Explain in detail why I received this score and where the primary deductions occurred.' },
        { label: '🕵️ Who are my biggest competitors?', prompt: 'Who are my direct and indirect competitors based on the latest competitor intelligence, and how is the market structured?' },
        { label: '💰 How does competitor pricing compare?', prompt: 'Compare my proposed pricing with current competitor pricing tiers from the research. Where are the pricing gaps?' },
        { label: '🧩 What features am I missing?', prompt: 'Looking at the competitor feature matrix, what capabilities do competitors have that I should consider or avoid?' },
        { label: '⚡ What changed recently in market?', prompt: 'What recent developments, funding rounds, or product launches occurred among competitors in the past 12 months?' },
        { label: '⚠️ Biggest weakness', prompt: 'Based on my saved evaluation, what is the single biggest weakness of this startup concept?' },
        { label: '💡 Improve business model', prompt: 'How can I improve my business model, pricing strategy, and unit economics?' },
        { label: '🚀 What should I build first?', prompt: 'Looking at the MVP roadmap, what specific features must I build first, and what should I delay?' },
        { label: '👥 How do I get first 100 users?', prompt: 'Given my target audience and go-to-market strategy, how can I acquire my first 100 users with minimal budget?' },
        { label: '📅 Create 30-day action plan', prompt: 'Create a structured, weekly 30-day action plan for me based on the top recommendations.' },
      ];
    }
    return [
      { label: '❓ What to check before launch?', prompt: 'What are the top 5 critical things every founder should check before launching a startup?' },
      { label: '🎯 How do I validate demand?', prompt: 'How can I validate real customer demand before writing any code or spending capital?' },
      { label: '📐 What is TAM vs SAM vs SOM?', prompt: 'Explain the difference between TAM, SAM, and SOM with a concrete early-stage example.' },
      { label: '👥 How to find first customers?', prompt: 'What are the most effective, low-cost ways for a B2B or B2C founder to find their first 10 paying customers?' },
      { label: '💵 How should I price my SaaS?', prompt: 'What framework should I use to set initial pricing for a new software product?' },
      { label: '📦 What should an MVP contain?', prompt: 'How do I decide what belongs in a Minimum Viable Product versus what to cut?' },
    ];
  }, [activeIdea]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className={`fixed bottom-6 right-6 ${Z_INDEX.ADVISOR_FAB} print:hidden flex flex-col items-end`}>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open VentureLens AI Advisor"
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white font-semibold text-sm rounded-full shadow-xl hover:shadow-2xl hover:shadow-indigo-500/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 cursor-pointer"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-indigo-700" />
            </div>
            <span className="tracking-tight">Ask AI Advisor</span>
            {activeIdea && (
              <span className="ml-1 px-2 py-0.5 text-[10px] font-bold bg-white/20 rounded-full text-white backdrop-blur-xs truncate max-w-[110px]">
                {activeIdea.title}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Floating / Responsive Chat Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-labelledby="advisor-title"
          className={`fixed ${Z_INDEX.ADVISOR_PANEL} print:hidden transition-all duration-200 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden ${
            isExpanded
              ? 'top-16 inset-x-2 bottom-2 sm:top-20 sm:bottom-6 sm:left-6 sm:right-6 sm:w-auto sm:max-h-[calc(100dvh-6.5rem)] rounded-2xl'
              : 'top-16 inset-x-0 bottom-0 sm:inset-auto sm:top-20 sm:bottom-auto sm:right-6 sm:w-[440px] sm:h-[calc(100dvh-6rem)] sm:max-h-[660px] sm:rounded-2xl'
          }`}
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 sm:px-4 sm:py-2.5 bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 pr-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-500/30">
                {advisorMode === 'voice' ? <Mic className="w-4 h-4 text-emerald-300" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 id="advisor-title" className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
                    VentureLens AI Advisor
                  </h3>
                  <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded border shrink-0 ${
                    advisorMode === 'voice'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}>
                    {advisorMode === 'voice' ? 'VOICE LIVE' : 'PRO'}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                  {advisorMode === 'voice' ? 'Spoken venture partner (Gemini 3.8 Live)' : 'Your startup strategy assistant'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              {/* Mode Toggle: [ Chat ] [ Voice ] */}
              <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700/80">
                <button
                  id="advisor-mode-chat-tab"
                  onClick={() => setAdvisorMode('chat')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    advisorMode === 'chat'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Chat</span>
                </button>
                <button
                  id="advisor-mode-voice-tab"
                  onClick={() => setAdvisorMode('voice')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    advisorMode === 'voice'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden xs:inline">Voice</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                </button>
              </div>

              {advisorMode === 'chat' && (
                <button
                  onClick={handleClearConversation}
                  title="Clear conversation"
                  aria-label="Clear conversation"
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore size' : 'Expand panel'}
                aria-label={isExpanded ? 'Restore size' : 'Expand panel'}
                className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close advisor"
                aria-label="Close advisor"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body: Voice View or Chat View */}
          {advisorMode === 'voice' ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <VoiceAdvisorView
                analysisId={activeIdeaId || (activeIdea ? activeIdea.id : null)}
                userToken={session?.access_token || 'demo-token'}
                isDemo={!session?.access_token || user?.id === '00000000-0000-4000-8000-000000000001'}
                clientContext={
                  activeIdea
                    ? {
                        isDemo: !session?.access_token || user?.id === '00000000-0000-4000-8000-000000000001',
                        title: activeIdea.title,
                        description: activeIdea.description,
                        industry: activeIdea.industry,
                        target_audience: activeIdea.target_audience,
                        overall_score: activeIdea.analysis?.overall_score,
                        verdict_type: activeIdea.analysis?.verdict_type,
                        tam: activeIdea.analysis?.market_analysis?.tam,
                        sam: activeIdea.analysis?.market_analysis?.sam,
                        som: activeIdea.analysis?.market_analysis?.som,
                        problem_score: activeIdea.analysis?.problem_score,
                        market_score: activeIdea.analysis?.market_score,
                        competition_score: activeIdea.analysis?.competition_score,
                        revenue_score: activeIdea.analysis?.revenue_score,
                        technical_score: activeIdea.analysis?.technical_score,
                        recommended_business_model: activeIdea.analysis?.business_model?.recommended_business_model,
                        pricing_strategy: activeIdea.analysis?.business_model?.pricing_strategy,
                        competitors: activeIdea.analysis?.competitor_analysis?.competitors,
                        risks: activeIdea.analysis?.risks,
                        recommendations: activeIdea.analysis?.recommendations,
                        market_research: activeIdea.market_research,
                      }
                    : null
                }
                onSwitchToChat={() => setAdvisorMode('chat')}
                onClose={() => setIsOpen(false)}
              />
            </div>
          ) : (
            <>
              {/* Active Context Banner */}
          <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
              {activeIdea ? (
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                    {activeIdea.title}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                      (activeIdea.analysis?.overall_score ?? 0) >= 75
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : (activeIdea.analysis?.overall_score ?? 0) >= 50
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    Score: {activeIdea.analysis?.overall_score ?? 'N/A'}/100
                  </span>
                </div>
              ) : (
                <span className="text-slate-500 dark:text-slate-400 text-xs">
                  General Advisory Mode (No analysis selected)
                </span>
              )}
            </div>

            {activeIdea && (
              <button
                onClick={() => setShowContextDetails(!showContextDetails)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0 ml-2 font-medium"
              >
                <Info className="w-3 h-3" />
                {showContextDetails ? 'Hide' : 'Details'}
              </button>
            )}
          </div>

          {/* Collapsible Context Inspection Card */}
          {showContextDetails && activeIdea && (
            <div className="px-3.5 py-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in duration-150">
              <div className="flex justify-between items-start mb-1.5">
                <span className="font-bold text-indigo-900 dark:text-indigo-200">Grounded Analysis Context</span>
                <span className="text-[10px] text-indigo-700 dark:text-indigo-300">
                  Verdict: {activeIdea.analysis?.verdict_type}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mb-1.5">
                {activeIdea.description}
              </p>
              <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-indigo-100 dark:border-indigo-900">
                <div>Problem: {activeIdea.analysis?.problem_score ?? 'N/A'}%</div>
                <div>Market: {activeIdea.analysis?.market_score ?? 'N/A'}%</div>
                <div>Moat: {activeIdea.analysis?.competition_score ?? 'N/A'}%</div>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xs'
                    }`}
                  >
                    {isUser ? 'You' : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`relative max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : msg.error
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900 rounded-tl-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap font-normal text-xs sm:text-sm">{msg.content}</div>
                    ) : (
                      <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-code:bg-slate-200/60 dark:prose-code:bg-slate-900/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                        <Markdown>{msg.content}</Markdown>
                        {msg.isStreaming && (
                          <span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-600 dark:bg-indigo-400 animate-pulse align-middle" />
                        )}
                      </div>
                    )}

                    <div
                      className={`text-[9px] mt-1.5 text-right font-medium opacity-60 ${
                        isUser ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Error Message banner with retry */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>VentureLens AI is temporarily unavailable. Please try again.</span>
                </div>
                <button
                  onClick={handleRetry}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 pt-2 pb-1.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-0.5">
              Quick Prompts:
            </span>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => handleSendMessage(qp.prompt)}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-full text-[11px] font-medium whitespace-nowrap transition-all shrink-0 active:scale-95 disabled:opacity-50"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-end gap-2"
            >
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeIdea
                    ? `Ask about "${activeIdea.title}"...`
                    : 'Ask any startup strategy or validation question...'
                }
                rows={1}
                disabled={isLoading}
                maxLength={2500}
                className="w-full resize-none max-h-24 min-h-[42px] px-3.5 py-2.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all placeholder:text-slate-400 disabled:opacity-60"
              />

              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStopStreaming}
                  title="Stop generating"
                  className="h-[42px] px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-xs"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  aria-label="Send message"
                  className="h-[42px] px-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-xs active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </form>
            <div className="flex justify-between items-center mt-1.5 px-1 text-[10px] text-slate-400">
              <span>Enter to send, Shift+Enter for new line</span>
              <span>{inputMessage.length}/2500</span>
            </div>
          </div>
        </>
      )}
    </div>
  )}
</>
);
};
