import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  HelpCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Zap,
  Radio,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ExtractedPitchData {
  title: string;
  industry: string;
  custom_industry?: string;
  target_audience: string;
  description: string;
  additional_info?: string;
  raw_transcript: string;
  key_highlights: string[];
}

interface VoiceIdeaRecorderProps {
  onApplyAll: (data: {
    title: string;
    industry: string;
    customIndustry?: string;
    targetAudience: string;
    description: string;
    additionalInfo?: string;
  }) => void;
  onApplyDescriptionOnly: (text: string) => void;
  currentDescription?: string;
}

type RecordingState = 'idle' | 'requesting' | 'recording' | 'paused' | 'processing' | 'reviewed';

const SAMPLE_SPOKEN_PITCHES = [
  {
    name: 'CarePath AI (HealthTech)',
    transcript:
      "Hi, I'm building CarePath AI. We noticed outpatient clinics waste 3 hours every evening on manual clinical notes and prior-authorization insurance battles. CarePath AI listens ambiently to doctor-patient conversations, automatically generates ICD-10 compliant SOAP notes directly into Epic, and pre-fills prior authorization justifications with clinical evidence. We have LOIs from 3 orthopedic clinics ready to pilot at $400 a month per provider.",
  },
  {
    name: 'VoltRoute (CleanTech)',
    transcript:
      "Our startup VoltRoute tackles charging depot bottlenecks for commercial delivery van fleets. Fleet managers with 20 to 200 electric vans are getting slapped with massive peak demand utility surcharges and battery degradation from uncoordinated fast-charging. VoltRoute connects to charger APIs and vehicle telematics to balance charging schedules overnight during cheapest off-peak rates. Competing against basic GPS trackers like Samsara that don't model battery chemistry.",
  },
  {
    name: 'TrustGuard (CyberSecurity)',
    transcript:
      "I'm an ex-DevOps lead creating TrustGuard. Developers are blindly pasting AI-generated code snippets and installing npm packages that contain stealth prompt-injection backdoors or typosquatted malware. TrustGuard sits inside GitHub Actions CI/CD to sandbox every package pull and verify dependency reputations before code merges. Aiming at mid-market engineering teams with a $50/seat monthly subscription.",
  },
];

export const VoiceIdeaRecorder: React.FC<VoiceIdeaRecorderProps> = ({
  onApplyAll,
  onApplyDescriptionOnly,
  currentDescription = '',
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioTotalDuration, setAudioTotalDuration] = useState<number>(0);
  const [audioVolumeLevel, setAudioVolumeLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedPitchData | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);
  const [showTranscriptEditor, setShowTranscriptEditor] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // References for MediaRecorder and Web Audio API
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupAudioSession();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const cleanupAudioSession = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // Ignore
      }
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  // Start recording
  const startRecording = async () => {
    setErrorMessage(null);
    setRecordingState('requesting');
    setLiveTranscript('');
    setExtractedData(null);
    audioChunksRef.current = [];

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser environment. You can use speech dictation or try a sample pitch.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      // Initialize Web Audio API Analyser for live visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyserRef.current = analyser;
        drawVisualizer();
      }

      // Initialize MediaRecorder
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        setAudioBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);
      };

      recorder.start(250); // Collect data chunks every 250ms
      setRecordingState('recording');
      setRecordingDuration(0);

      // Start duration timer
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(elapsed);

        // Auto-stop at 5 minutes (300 seconds)
        if (elapsed >= 300) {
          stopRecording();
        }
      }, 1000);

      // Start Web Speech Recognition if available for real-time live transcription
      initSpeechRecognition();
    } catch (err: any) {
      console.error('[VoiceIdeaRecorder] Microphone access error:', err);
      cleanupAudioSession();
      setRecordingState('idle');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser bar, or click "Try Sample Pitch" below.');
      } else if (err.name === 'NotFoundError') {
        setErrorMessage('No microphone device was detected on your system. Please connect a microphone or use a sample pitch.');
      } else {
        setErrorMessage(err.message || 'Could not initialize microphone recording.');
      }
    }
  };

  // Live Speech Recognition initializer
  const initSpeechRecognition = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.log('[VoiceIdeaRecorder] Web Speech API not natively available, relying on MediaRecorder audio processing.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        setLiveTranscript(fullTranscript.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn('[VoiceIdeaRecorder] Speech recognition notice:', event?.error);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (e) {
      console.warn('[VoiceIdeaRecorder] Speech recognition start notice:', e);
    }
  };

  // Canvas visualizer rendering loop
  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      // Calculate average volume level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      setAudioVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));

      // Render sleek modern waveform bars
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = 4;
      const gap = 3;
      const totalBars = Math.floor(canvas.width / (barWidth + gap));
      const step = Math.floor(bufferLength / totalBars) || 1;

      for (let i = 0; i < totalBars; i++) {
        const val = dataArray[i * step] || 0;
        const percent = val / 255;
        const barHeight = Math.max(3, percent * (canvas.height - 4));
        const x = i * (barWidth + gap);
        const y = (canvas.height - barHeight) / 2;

        // Gradient color based on intensity
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#6366f1'); // Indigo
        gradient.addColorStop(1, '#a855f7'); // Purple

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    render();
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      const resumeTime = Date.now() - recordingDuration * 1000;
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - resumeTime) / 1000));
      }, 1000);
    }
  };

  // Stop recording
  const stopRecording = () => {
    cleanupAudioSession();
    setRecordingState('reviewed');
  };

  // Cancel recording and reset
  const cancelRecording = () => {
    cleanupAudioSession();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
    setLiveTranscript('');
    setRecordingDuration(0);
    setExtractedData(null);
    setRecordingState('idle');
    setErrorMessage(null);
  };

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // Play / Pause audio playback
  const toggleAudioPlayback = () => {
    if (!audioElementRef.current) return;
    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch((e) => console.warn('Playback error:', e));
    }
  };

  // Process pitch with server-side Gemini
  const handleProcessWithGemini = async (overrideTranscript?: string) => {
    const transcriptToProcess = overrideTranscript || liveTranscript;

    if (!transcriptToProcess.trim() && !audioBlob) {
      setErrorMessage('Please speak your idea into the microphone or enter a spoken description before analyzing.');
      return;
    }

    setIsAiProcessing(true);
    setErrorMessage(null);

    try {
      let audioBase64: string | undefined;
      let mimeType: string | undefined;

      // Convert audioBlob to base64 if available
      if (audioBlob && (!transcriptToProcess || transcriptToProcess.length < 30)) {
        try {
          const buffer = await audioBlob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          audioBase64 = btoa(binary);
          mimeType = audioBlob.type || 'audio/webm';
        } catch (convErr) {
          console.warn('[VoiceIdeaRecorder] Base64 conversion fallback notice:', convErr);
        }
      }

      const res = await fetch('/api/voice/process-pitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcriptToProcess,
          audioBase64,
          mimeType,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to structure spoken idea.');
      }

      setExtractedData(json.data);
      if (json.data.raw_transcript && !liveTranscript) {
        setLiveTranscript(json.data.raw_transcript);
      }
    } catch (err: any) {
      console.error('[VoiceIdeaRecorder] Processing error:', err);
      setErrorMessage(err.message || 'An error occurred while analyzing your voice recording with Gemini.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Load a sample pitch
  const handleApplySamplePitch = (sample: (typeof SAMPLE_SPOKEN_PITCHES)[0]) => {
    cancelRecording();
    setLiveTranscript(sample.transcript);
    setRecordingState('reviewed');
    handleProcessWithGemini(sample.transcript);
  };

  // Apply all extracted data to parent form
  const handleApplyToForm = () => {
    if (!extractedData) return;

    onApplyAll({
      title: extractedData.title,
      industry: extractedData.industry,
      customIndustry: extractedData.custom_industry,
      targetAudience: extractedData.target_audience,
      description: extractedData.description,
      additionalInfo: extractedData.additional_info,
    });

    setAppliedToast('All fields applied! Check your startup concept below.');
    setTimeout(() => setAppliedToast(null), 4000);
  };

  // Apply description only
  const handleApplyDescriptionOnly = () => {
    const textToInsert = extractedData?.description || liveTranscript;
    if (!textToInsert) return;

    onApplyDescriptionOnly(textToInsert);
    setAppliedToast('Inserted into Concept Description!');
    setTimeout(() => setAppliedToast(null), 4000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm overflow-hidden mb-8 transition-colors">
      {/* Hidden Audio Element for playback */}
      {audioUrl && (
        <audio
          ref={audioElementRef}
          src={audioUrl}
          onTimeUpdate={() => {
            if (audioElementRef.current) {
              setAudioCurrentTime(audioElementRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (audioElementRef.current) {
              setAudioTotalDuration(audioElementRef.current.duration);
            }
          }}
          onEnded={() => {
            setIsPlayingAudio(false);
            setAudioCurrentTime(0);
          }}
        />
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-slate-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900/80 px-5 py-4 border-b border-indigo-100/80 dark:border-indigo-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white font-['Space_Grotesk',sans-serif]">
                Voice Pitch Recorder
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-2.5 h-2.5" />
                Gemini Voice-to-Idea
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Speak naturally about your problem, customer, and solution. Gemini structures it into a due-diligence memo.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
          aria-label={isExpanded ? 'Collapse voice recorder' : 'Expand voice recorder'}
        >
          <span>{isExpanded ? 'Minimize' : 'Open'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="p-5 sm:p-6"
          >
            {/* Applied Feedback Toast */}
            {appliedToast && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{appliedToast}</span>
              </motion.div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div className="flex-1">
                  <p className="font-bold">Microphone Notice</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* STATE 1: IDLE */}
            {recordingState === 'idle' && (
              <div className="text-center py-6 px-4">
                <div className="max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={startRecording}
                    id="voice-recorder-start-btn"
                    className="relative group w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center justify-center mx-auto shadow-md transition-all transform hover:scale-105 active:scale-95 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/30"
                  >
                    <span className="absolute -inset-1 rounded-full bg-indigo-500/20 group-hover:bg-indigo-500/30 animate-ping opacity-75" />
                    <Mic className="w-8 h-8 relative z-10" />
                  </button>

                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-4">
                    Tap to Describe Your Startup Idea
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Talk for 30–90 seconds like you're pitching an angel investor. Mention who your customer is, why existing tools fail, and how your solution works.
                  </p>

                  {/* Pitching prompt guidelines */}
                  <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 text-left grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">1. The Friction:</span> What painful problem or cost does the customer face?
                    </div>
                    <div>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">2. The Solution:</span> What does your product do differently?
                    </div>
                    <div>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">3. Business Angle:</span> Who will pay and what is the pricing model?
                    </div>
                  </div>

                  {/* Sample pitch buttons */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>Or test with a sample voice pitch:</span>
                    </span>
                    {SAMPLE_SPOKEN_PITCHES.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplySamplePitch(sample)}
                        className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-300 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        {sample.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STATE 2: REQUESTING PERMISSION */}
            {recordingState === 'requesting' && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Requesting microphone access...
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Please click "Allow" in your browser prompt to enable voice recording.
                </p>
              </div>
            )}

            {/* STATE 3 & 4: RECORDING / PAUSED */}
            {(recordingState === 'recording' || recordingState === 'paused') && (
              <div className="py-4">
                <div className="flex flex-col items-center">
                  {/* Status & Timer badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-4">
                    <span className="relative flex h-2 w-2">
                      {recordingState === 'recording' ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                      )}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatTime(recordingDuration)} / 05:00
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {recordingState === 'recording' ? 'Recording' : 'Paused'}
                    </span>
                  </div>

                  {/* Real-time Frequency Visualizer Canvas */}
                  <div className="w-full max-w-md h-16 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-2 flex items-center justify-center overflow-hidden mb-4">
                    <canvas
                      ref={canvasRef}
                      width={380}
                      height={50}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Live Streaming Speech Transcript */}
                  <div className="w-full max-w-lg bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-3 mb-5 min-h-[60px] text-left">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      <span className="flex items-center gap-1">
                        <Radio className="w-3 h-3 text-indigo-500 animate-pulse" />
                        Live Spoken Dictation
                      </span>
                      <span>{liveTranscript.split(/\s+/).filter(Boolean).length} words</span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 italic leading-relaxed min-h-[32px]">
                      {liveTranscript ? (
                        <span>"{liveTranscript}"</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 not-italic">
                          Listening... Start speaking naturally into your microphone.
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Controls Toolbar */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Discard</span>
                    </button>

                    {recordingState === 'recording' ? (
                      <button
                        type="button"
                        onClick={pauseRecording}
                        className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={resumeRecording}
                        className="px-4 py-2 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={stopRecording}
                      id="voice-recorder-stop-btn"
                      className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5 transform hover:scale-[1.02]"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>Done Speaking</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STATE 5: REVIEWED / STRUCTURING */}
            {recordingState === 'reviewed' && (
              <div className="space-y-4">
                {/* Audio Playback Bar & Transcript Summary */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {audioUrl && (
                        <button
                          type="button"
                          onClick={toggleAudioPlayback}
                          className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95"
                          aria-label={isPlayingAudio ? 'Pause audio' : 'Play recorded pitch'}
                        >
                          {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {audioUrl ? 'Spoken Voice Note Captured' : 'Dictated Idea Speech'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {audioUrl
                            ? `${formatTime(Math.floor(audioCurrentTime))} / ${formatTime(Math.floor(audioTotalDuration || recordingDuration))}`
                            : `${liveTranscript.split(/\s+/).filter(Boolean).length} words spoken`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowTranscriptEditor(!showTranscriptEditor)}
                        className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>{showTranscriptEditor ? 'Hide Transcript' : 'Edit Transcript'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={startRecording}
                        className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Re-record</span>
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Transcript Editor */}
                  {showTranscriptEditor && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Spoken Speech Transcript (You can refine text before Gemini structures it):
                      </label>
                      <textarea
                        rows={3}
                        value={liveTranscript}
                        onChange={(e) => setLiveTranscript(e.target.value)}
                        placeholder="Spoken words will appear here..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* AI Structuring CTA or Loading */}
                {!extractedData && (
                  <div className="p-5 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-center">
                    {isAiProcessing ? (
                      <div className="py-4">
                        <Loader2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Gemini is structuring your spoken pitch...
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Synthesizing venture title, sector, ICP persona, problem-solution narrative, and unfair advantages.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                          Ready to Structure into Due Diligence Form
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 max-w-md mx-auto">
                          Our Gemini engine will translate your natural voice pitch into an institutional analysis submission.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleProcessWithGemini()}
                            id="voice-structure-gemini-btn"
                            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Structure Concept with Gemini</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleApplyDescriptionOnly}
                            className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                          >
                            Paste Directly into Description Only
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* EXTRACTED STRUCTURED PREVIEW CARD */}
                {extractedData && (
                  <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/80 shadow-xs animate-in fade-in transition-colors">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/80 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Structured Startup Concept Extracted
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Ready to Apply
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          Suggested Title
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                          {extractedData.title}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          Industry / Sector
                        </span>
                        <p className="font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {extractedData.industry} {extractedData.custom_industry ? `(${extractedData.custom_industry})` : ''}
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          Target Customer Persona
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                          {extractedData.target_audience}
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          Synthesized Description & Value Proposition
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed text-[11px]">
                          {extractedData.description}
                        </p>
                      </div>

                      {extractedData.additional_info && (
                        <div className="sm:col-span-2">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            Additional Context / Pilots / Pricing
                          </span>
                          <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-[11px]">
                            {extractedData.additional_info}
                          </p>
                        </div>
                      )}

                      {extractedData.key_highlights && extractedData.key_highlights.length > 0 && (
                        <div className="sm:col-span-2">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                            Key Pitch Takeaways
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {extractedData.key_highlights.map((h, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md"
                              >
                                • {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Application Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/80">
                      <button
                        type="button"
                        onClick={handleApplyToForm}
                        id="voice-apply-all-btn"
                        className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 hover:scale-[1.01]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Populate Entire Analysis Form</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleApplyDescriptionOnly}
                        className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors"
                      >
                        Description Only
                      </button>

                      <button
                        type="button"
                        onClick={() => handleProcessWithGemini()}
                        className="px-3 py-2 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors flex items-center gap-1"
                        title="Re-extract with Gemini"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Re-structure</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
