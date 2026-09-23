import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Radio,
  RotateCcw,
  Sparkles,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Headphones,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  VoiceAdvisorClient,
  VoiceConnectionState,
  SpokenTranscriptTurn,
} from '../../services/voiceAdvisorClient';

interface VoiceAdvisorViewProps {
  analysisId?: string | null;
  userToken?: string | null;
  isDemo?: boolean;
  clientContext?: any;
  onSwitchToChat: () => void;
  onClose: () => void;
}

const AVAILABLE_VOICES = [
  { id: 'Puck', label: 'Puck', desc: 'Direct & Insightful' },
  { id: 'Charon', label: 'Charon', desc: 'Calm & Strategic' },
  { id: 'Kore', label: 'Kore', desc: 'Warm & Encouraging' },
  { id: 'Fenrir', label: 'Fenrir', desc: 'Crisp & Analytical' },
  { id: 'Aoede', label: 'Aoede', desc: 'Expressive & Creative' },
];

const SPOKEN_SUGGESTIONS = [
  'What is our biggest moat & advantage?',
  'How should we price this startup?',
  'What is the number one fatal risk?',
  'Critique my target customer assumptions',
];

export const VoiceAdvisorView: React.FC<VoiceAdvisorViewProps> = ({
  analysisId,
  userToken,
  isDemo,
  clientContext,
  onSwitchToChat,
  onClose,
}) => {
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>('idle');
  const [inputVolume, setInputVolume] = useState<number>(0);
  const [outputVolume, setOutputVolume] = useState<number>(0);
  const [liveUserTranscript, setLiveUserTranscript] = useState<string>('');
  const [liveAiTranscript, setLiveAiTranscript] = useState<string>('');
  const [transcriptHistory, setTranscriptHistory] = useState<SpokenTranscriptTurn[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('Puck');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const clientRef = useRef<VoiceAdvisorClient | null>(null);
  const historyScrollRef = useRef<HTMLDivElement | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);

  // Timer for session duration
  useEffect(() => {
    let interval: any = null;
    if (connectionState === 'listening' || connectionState === 'speaking' || connectionState === 'muted') {
      if (!sessionStartTime) {
        setSessionStartTime(Date.now());
      }
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - (sessionStartTime || Date.now())) / 1000));
      }, 1000);
    } else if (connectionState === 'idle' || connectionState === 'error') {
      setSessionStartTime(null);
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [connectionState, sessionStartTime]);

  // Auto-scroll transcript cards
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
    if (historyScrollRef.current) {
      historyScrollRef.current.scrollTop = historyScrollRef.current.scrollHeight;
    }
  }, [transcriptHistory, liveUserTranscript, liveAiTranscript, showHistory]);

  // Initialize client
  useEffect(() => {
    const client = new VoiceAdvisorClient({
      onStateChange: (newState) => {
        setConnectionState(newState);
        if (newState === 'error' || newState === 'idle') {
          setInputVolume(0);
          setOutputVolume(0);
        }
      },
      onVolumeChange: ({ input, output }) => {
        setInputVolume(input);
        setOutputVolume(output);
      },
      onLiveUserTranscript: (text) => {
        setLiveUserTranscript(text);
      },
      onLiveAiTranscript: (text) => {
        setLiveAiTranscript(text);
      },
      onTranscriptTurn: (turn) => {
        setTranscriptHistory((prev) => [...prev, turn]);
      },
      onError: (err) => {
        setErrorMessage(err);
      },
    });

    clientRef.current = client;

    return () => {
      client.disconnect();
    };
  }, []);

  const handleStartSession = async () => {
    setErrorMessage(null);
    setLiveUserTranscript('');
    setLiveAiTranscript('');
    if (!clientRef.current) return;

    await clientRef.current.startSession({
      analysisId,
      userToken,
      isDemo,
      clientContext,
      voiceName: selectedVoice,
    });
  };

  const handleEndSession = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    setConnectionState('idle');
    setInputVolume(0);
    setOutputVolume(0);
  };

  const handleToggleMute = () => {
    if (!clientRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    clientRef.current.setMute(next);
  };

  const handleToggleSpeaker = () => {
    if (!clientRef.current) return;
    const next = !isSpeakerMuted;
    setIsSpeakerMuted(next);
    clientRef.current.setSpeakerMute(next);
  };

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId);
    if (clientRef.current) {
      clientRef.current.setVoice(voiceId);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    if (connectionState === 'idle' || connectionState === 'error') {
      handleStartSession().then(() => {
        setTimeout(() => {
          clientRef.current?.sendSpokenPrompt(prompt);
        }, 1200);
      });
    } else {
      clientRef.current?.sendSpokenPrompt(prompt);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const isSessionActive =
    connectionState === 'connected' ||
    connectionState === 'listening' ||
    connectionState === 'speaking' ||
    connectionState === 'muted';

  const activeVolume = connectionState === 'speaking' ? outputVolume : inputVolume;
  const waveformLevel = Math.max(0.1, Math.min(1.0, activeVolume / 50));

  return (
    <div
      id="voice-advisor-container"
      className="flex flex-col h-full w-full min-h-0 bg-slate-950 text-slate-100 select-none overflow-hidden relative"
    >
      {/* 1. Live Status & Grounding Top Banner */}
      <div className="shrink-0 px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs z-10">
        <div className="flex items-center space-x-2 min-w-0 pr-2">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
            <Radio className="w-3 h-3 animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[10px]">Gemini 3.8 Live</span>
          </div>
          <span className="text-slate-300 font-medium truncate text-xs">
            {clientContext?.title ? `Grounded: ${clientContext.title}` : 'Grounded Startup Advisor'}
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {isSessionActive && (
            <span className="font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50 text-[11px]">
              {formatTime(elapsedSeconds)}
            </span>
          )}
          <button
            id="voice-mode-switch-chat"
            onClick={onSwitchToChat}
            className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors flex items-center space-x-1 text-xs"
            title="Switch to Text Mode"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Text Mode</span>
          </button>
        </div>
      </div>

      {/* 2. Middle Scrollable Stage */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 sm:py-4 flex flex-col items-center space-y-3 relative">
        {/* Subtle background gradient based on active state */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
            connectionState === 'speaking'
              ? 'opacity-35 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-cyan-500/10 to-transparent'
              : connectionState === 'listening'
              ? 'opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/20 via-teal-500/10 to-transparent'
              : connectionState === 'connecting' || connectionState === 'requesting_token'
              ? 'opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent'
              : 'opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-700/20 via-transparent to-transparent'
          }`}
        />

        {/* Central Audio Visualizer Orb */}
        <div className="relative my-1 flex items-center justify-center shrink-0">
          {/* Concentric Pulse Rings */}
          {isSessionActive && (
            <>
              <motion.div
                animate={{
                  scale: [1, 1.2 + waveformLevel * 0.35, 1],
                  opacity: [0.25, 0.55, 0.25],
                }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border ${
                  connectionState === 'speaking'
                    ? 'border-indigo-400/40 bg-indigo-500/10'
                    : connectionState === 'muted'
                    ? 'border-amber-400/40 bg-amber-500/10'
                    : 'border-emerald-400/40 bg-emerald-500/10'
                }`}
              />
              <motion.div
                animate={{
                  scale: [1, 1.45 + waveformLevel * 0.5, 1],
                  opacity: [0.12, 0.3, 0.12],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                className={`absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full border ${
                  connectionState === 'speaking' ? 'border-cyan-400/30' : 'border-teal-400/30'
                }`}
              />
            </>
          )}

          {/* Interactive Core Orb */}
          <motion.button
            id="voice-core-orb-button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={isSessionActive ? handleEndSession : handleStartSession}
            disabled={connectionState === 'connecting' || connectionState === 'requesting_token'}
            className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-xl flex flex-col items-center justify-center transition-all duration-300 border-2 ${
              connectionState === 'speaking'
                ? 'bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 border-cyan-300 text-white shadow-cyan-500/25'
                : connectionState === 'listening'
                ? 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 border-emerald-300 text-white shadow-emerald-500/25'
                : connectionState === 'muted'
                ? 'bg-gradient-to-tr from-amber-700 via-amber-600 to-yellow-600 border-amber-400 text-white shadow-amber-500/25'
                : connectionState === 'connecting' || connectionState === 'requesting_token'
                ? 'bg-slate-800 border-slate-600 text-slate-300 animate-pulse'
                : 'bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-700 border-slate-600 text-slate-200 hover:border-emerald-400/60 hover:text-white'
            }`}
          >
            {connectionState === 'speaking' ? (
              <>
                <Volume2 className="w-7 h-7 animate-bounce mb-0.5" />
                <span className="text-[9px] font-bold tracking-wider uppercase">Speaking</span>
              </>
            ) : connectionState === 'listening' ? (
              <>
                <Mic className="w-7 h-7 animate-pulse mb-0.5" />
                <span className="text-[9px] font-bold tracking-wider uppercase">Listening</span>
              </>
            ) : connectionState === 'muted' ? (
              <>
                <MicOff className="w-7 h-7 mb-0.5 text-amber-200" />
                <span className="text-[9px] font-bold tracking-wider uppercase">Muted</span>
              </>
            ) : connectionState === 'connecting' || connectionState === 'requesting_token' ? (
              <>
                <RotateCcw className="w-6 h-6 animate-spin mb-0.5 text-emerald-400" />
                <span className="text-[9px] font-bold tracking-wider uppercase">Connecting</span>
              </>
            ) : (
              <>
                <Mic className="w-7 h-7 mb-0.5 text-emerald-400" />
                <span className="text-[10px] font-bold tracking-wide uppercase">Start Voice</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Dynamic Equalizer Bar Visualizer */}
        <div className="h-5 flex items-center justify-center space-x-1 mb-0.5 shrink-0">
          {[0.25, 0.5, 0.8, 1, 0.65, 0.9, 0.45, 0.7, 0.35, 0.55].map((factor, idx) => {
            const barHeight = isSessionActive
              ? Math.max(5, Math.min(22, 5 + activeVolume * factor * 0.35))
              : 5;
            return (
              <motion.div
                key={idx}
                animate={{ height: `${barHeight}px` }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                className={`w-1 rounded-full transition-colors ${
                  connectionState === 'speaking'
                    ? 'bg-gradient-to-t from-indigo-500 to-cyan-400'
                    : connectionState === 'listening'
                    ? 'bg-gradient-to-t from-emerald-500 to-teal-300'
                    : connectionState === 'muted'
                    ? 'bg-amber-500/50'
                    : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>

        {/* Status Line */}
        <div className="min-h-[22px] text-center shrink-0 w-full px-2">
          {connectionState === 'idle' && (
            <p className="text-xs text-slate-400">
              Tap the orb to start live voice. Speak naturally, ask questions, or interrupt anytime.
            </p>
          )}
          {connectionState === 'requesting_token' && (
            <p className="text-xs text-emerald-400 animate-pulse flex items-center justify-center space-x-1.5">
              <span>Authenticating voice session...</span>
            </p>
          )}
          {connectionState === 'connecting' && (
            <p className="text-xs text-emerald-400 animate-pulse flex items-center justify-center space-x-1.5">
              <span>Establishing low-latency audio stream...</span>
            </p>
          )}
          {connectionState === 'listening' && (
            <p className="text-xs text-emerald-400 font-medium flex items-center justify-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" />
              <span>Listening to you... (speak freely)</span>
            </p>
          )}
          {connectionState === 'speaking' && (
            <p className="text-xs text-cyan-300 font-medium flex items-center justify-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Advisor speaking... (interrupt anytime)</span>
            </p>
          )}
          {connectionState === 'muted' && (
            <p className="text-xs text-amber-400 flex items-center justify-center space-x-1.5">
              <MicOff className="w-3 h-3 mr-1" />
              <span>Microphone muted — tap Mic to unmute</span>
            </p>
          )}
          {connectionState === 'error' && errorMessage && (
            <div className="flex flex-col items-center gap-1.5 text-xs text-rose-300 bg-rose-950/40 p-2 rounded-xl border border-rose-800/50 max-w-md mx-auto">
              <div className="flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span className="line-clamp-2">{errorMessage}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  onClick={handleStartSession}
                  className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-[11px] font-semibold transition-colors"
                >
                  Retry Voice
                </button>
                <button
                  onClick={onSwitchToChat}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                >
                  Switch to Text Mode
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Live Transcription Card & History */}
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800 p-3 shadow-inner flex flex-col shrink-0">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1.5 border-b border-slate-800 pb-1 shrink-0">
            <span className="flex items-center space-x-1">
              <Headphones className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Transcription</span>
            </span>
            <button
              id="voice-toggle-history-btn"
              onClick={() => setShowHistory(!showHistory)}
              className="text-slate-400 hover:text-emerald-400 flex items-center space-x-1 transition-colors px-1 py-0.5 rounded hover:bg-slate-800/60"
            >
              <span>{showHistory ? 'Hide Turns' : `History (${transcriptHistory.length})`}</span>
              {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Current Live Stream Text */}
          <div ref={transcriptScrollRef} className="max-h-24 sm:max-h-32 overflow-y-auto text-xs space-y-1.5 pr-1">
            {liveUserTranscript && (
              <div className="text-slate-300">
                <span className="text-emerald-400 font-semibold mr-1.5">You:</span>
                <span className="italic">{liveUserTranscript}</span>
              </div>
            )}
            {liveAiTranscript && (
              <div className="text-slate-200">
                <span className="text-cyan-400 font-semibold mr-1.5">Advisor:</span>
                <span>{liveAiTranscript}</span>
              </div>
            )}
            {!liveUserTranscript && !liveAiTranscript && (
              <p className="text-slate-500 italic text-center py-2 text-[11px]">
                {isSessionActive
                  ? 'Transcripts will appear live as either of you speak...'
                  : 'Start a session to begin live two-way spoken conversation.'}
              </p>
            )}
          </div>

          {/* Collapsible History Dropdown */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  ref={historyScrollRef}
                  className="max-h-36 overflow-y-auto mt-2 pt-2 border-t border-slate-800/80 space-y-1.5 text-xs pr-1"
                >
                  {transcriptHistory.length === 0 ? (
                    <p className="text-slate-500 text-center py-2 text-[11px]">No completed spoken turns yet.</p>
                  ) : (
                    transcriptHistory.map((turn) => (
                      <div
                        key={turn.id}
                        className={`p-2 rounded-lg ${
                          turn.speaker === 'user'
                            ? 'bg-slate-800/80 text-slate-200 border-l-2 border-emerald-500'
                            : 'bg-indigo-950/40 text-slate-100 border-l-2 border-cyan-500'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span className="font-semibold">{turn.speaker === 'user' ? 'Founder' : 'Advisor'}</span>
                          <span>{turn.timestamp}</span>
                        </div>
                        <p className="leading-snug">{turn.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Spoken Kickoff Suggestions (when idle or fresh) */}
        {!isSessionActive && (
          <div className="w-full max-w-md shrink-0 pt-1">
            <p className="text-[11px] text-slate-400 mb-1.5 font-medium flex items-center justify-center space-x-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Or click a question to ask aloud:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {SPOKEN_SUGGESTIONS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(prompt)}
                  className="text-left text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-emerald-500/30 transition-all truncate shadow-xs"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Sticky Bottom Control Dock */}
      <div className="shrink-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 p-3 space-y-2 z-10">
        {/* Voice Persona Selector */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-slate-400 text-[11px] font-medium shrink-0">Voice:</span>
          <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 shrink-0">
            {AVAILABLE_VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => handleVoiceSelect(v.id)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all shrink-0 ${
                  selectedVoice === v.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={v.desc}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Audio Control Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {/* Mute Microphone */}
            <button
              id="voice-mute-mic-btn"
              onClick={handleToggleMute}
              disabled={!isSessionActive}
              className={`p-2 rounded-xl border transition-all ${
                isMuted
                  ? 'bg-amber-600/30 text-amber-300 border-amber-500/50 hover:bg-amber-600/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white disabled:opacity-40'
              }`}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Mute Speaker */}
            <button
              id="voice-mute-speaker-btn"
              onClick={handleToggleSpeaker}
              disabled={!isSessionActive}
              className={`p-2 rounded-xl border transition-all ${
                isSpeakerMuted
                  ? 'bg-rose-600/30 text-rose-300 border-rose-500/50 hover:bg-rose-600/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white disabled:opacity-40'
              }`}
              title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
            >
              {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Reconnect Session */}
            <button
              id="voice-reconnect-btn"
              onClick={handleStartSession}
              disabled={connectionState === 'connecting' || connectionState === 'requesting_token'}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-40"
              title="Reconnect Session"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Main Action Button (Start / End Session) */}
          {isSessionActive ? (
            <button
              id="voice-end-session-btn"
              onClick={handleEndSession}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all active:scale-95"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Session</span>
            </button>
          ) : (
            <button
              id="voice-start-session-btn"
              onClick={handleStartSession}
              disabled={connectionState === 'connecting' || connectionState === 'requesting_token'}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 active:scale-95"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{connectionState === 'connecting' || connectionState === 'requesting_token' ? 'Connecting...' : 'Start Session'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
