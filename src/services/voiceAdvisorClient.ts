export type VoiceConnectionState =
  | 'idle'
  | 'requesting_token'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'muted'
  | 'error';

export interface SpokenTranscriptTurn {
  id: string;
  speaker: 'user' | 'advisor';
  text: string;
  timestamp: string;
}

export interface VoiceAdvisorClientCallbacks {
  onStateChange: (state: VoiceConnectionState) => void;
  onVolumeChange: (volumes: { input: number; output: number }) => void;
  onLiveUserTranscript: (text: string) => void;
  onLiveAiTranscript: (text: string) => void;
  onTranscriptTurn: (turn: SpokenTranscriptTurn) => void;
  onError: (errorMessage: string) => void;
}

/**
 * Resamples Float32 audio to 16,000 Hz Int16 PCM (mono) for Gemini Live API input
 */
function downsampleTo16kPcm(inputBuffer: Float32Array, inputSampleRate: number): Int16Array {
  if (inputSampleRate === 16000) {
    const result = new Int16Array(inputBuffer.length);
    for (let i = 0; i < inputBuffer.length; i++) {
      const s = Math.max(-1, Math.min(1, inputBuffer[i]));
      result[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return result;
  }

  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(inputBuffer.length / ratio);
  const result = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < inputBuffer.length; i++) {
      accum += inputBuffer[i];
      count++;
    }
    const avg = count > 0 ? accum / count : 0;
    const s = Math.max(-1, Math.min(1, avg));
    result[offsetResult] = s < 0 ? s * 0x8000 : s * 0x7fff;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

/**
 * Converts Int16Array PCM to standard Base64 string
 */
function int16ToBase64(int16: Int16Array): string {
  const uint8 = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  let binary = '';
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return window.btoa(binary);
}

/**
 * Converts Base64 24kHz raw PCM string from Gemini Live to Float32Array for Web Audio playback
 */
function base64PcmToFloat32(base64: string): Float32Array {
  try {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }
    return float32;
  } catch (err) {
    console.warn('[Voice Advisor] Failed to parse PCM chunk:', err);
    return new Float32Array(0);
  }
}

export class VoiceAdvisorClient {
  private callbacks: VoiceAdvisorClientCallbacks;
  private state: VoiceConnectionState = 'idle';

  // WebSocket connection to server-side Gemini Live bridge
  private ws: WebSocket | null = null;

  // Audio Contexts & Streams
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private micMediaStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private micProcessorNode: ScriptProcessorNode | null = null;
  private outputGainNode: GainNode | null = null;

  // Playback Queue & Scheduling
  private nextPlayTime: number = 0;
  private activeAudioSources: AudioBufferSourceNode[] = [];
  private isAiSpeaking: boolean = false;

  // Live Transcripts
  private currentLiveUserText: string = '';
  private currentLiveAiText: string = '';

  // Settings & Flags
  private isMuted: boolean = false;
  private isSpeakerMuted: boolean = false;
  private isDestroyed: boolean = false;
  private activeVoice: string = 'Puck';

  constructor(callbacks: VoiceAdvisorClientCallbacks) {
    this.callbacks = callbacks;
  }

  public getState(): VoiceConnectionState {
    return this.state;
  }

  private setState(newState: VoiceConnectionState) {
    if (this.isDestroyed && newState !== 'idle') return;
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.micMediaStream) {
      this.micMediaStream.getAudioTracks().forEach((t) => {
        t.enabled = !muted;
      });
    }
    if (this.state === 'connected' || this.state === 'listening' || this.state === 'muted') {
      this.setState(muted ? 'muted' : 'listening');
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setSpeakerMute(muted: boolean) {
    this.isSpeakerMuted = muted;
    if (this.outputGainNode) {
      this.outputGainNode.gain.value = muted ? 0 : 1;
    }
    if (muted) {
      this.stopAudioPlayback();
    }
  }

  public getIsSpeakerMuted(): boolean {
    return this.isSpeakerMuted;
  }

  public setVoice(voice: string) {
    this.activeVoice = voice;
  }

  public getVoice(): string {
    return this.activeVoice;
  }

  /**
   * Immediately stops all currently playing output audio (for barge-in / interruption)
   */
  public stopAudioPlayback() {
    for (const source of this.activeAudioSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // already stopped
      }
    }
    this.activeAudioSources = [];
    this.isAiSpeaking = false;

    if (this.outputAudioContext) {
      this.nextPlayTime = this.outputAudioContext.currentTime;
    }
    this.callbacks.onVolumeChange({ input: 0, output: 0 });
    if (this.state === 'speaking') {
      this.setState(this.isMuted ? 'muted' : 'listening');
    }
  }

  /**
   * Starts the live voice session: initializes audio, opens WebSocket to server Gemini Live bridge
   */
  public async startSession(options: {
    analysisId?: string | null;
    userToken?: string | null;
    isDemo?: boolean;
    clientContext?: any;
    voiceName?: string;
  }) {
    if (this.state !== 'idle' && this.state !== 'error') {
      this.disconnect();
    }

    this.isDestroyed = false;
    this.activeVoice = options.voiceName || this.activeVoice || 'Puck';
    this.currentLiveUserText = '';
    this.currentLiveAiText = '';

    this.setState('requesting_token');

    try {
      // 1. Initialize microphone stream
      await this.initMicrophone();

      // 2. Initialize output audio playback
      this.initAudioPlayback();

      this.setState('connecting');

      // 3. Construct WebSocket URL to VentureLens backend bridge
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const params = new URLSearchParams();

      if (options.analysisId) params.set('analysisId', options.analysisId);
      if (options.userToken) params.set('token', options.userToken);
      if (options.isDemo) params.set('demo', 'true');
      params.set('voice', this.activeVoice);

      const wsUrl = `${protocol}//${host}/api/advisor/voice-ws?${params.toString()}`;
      console.log('[Voice Advisor] Connecting to Live Advisor WebSocket bridge:', wsUrl);

      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        console.log('[Voice Advisor] WebSocket connected to server.');
        this.setState('connected');
        // If clientContext has specific details (e.g. title before save), send it
        if (options.clientContext) {
          try {
            ws.send(
              JSON.stringify({
                type: 'client_context',
                context: options.clientContext,
              })
            );
          } catch {
            // ignore
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleServerMessage(message);
        } catch (err) {
          console.warn('[Voice Advisor] Error parsing server message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('[Voice Advisor] WebSocket error:', err);
        if (!this.isDestroyed) {
          this.setState('error');
          this.callbacks.onError('Could not connect to Voice Advisor service. Please try again.');
        }
      };

      ws.onclose = (event) => {
        console.log('[Voice Advisor] WebSocket closed:', event.code, event.reason);
        if (!this.isDestroyed && this.state !== 'idle') {
          this.setState('idle');
        }
      };
    } catch (err: any) {
      console.error('[Voice Advisor Client] Session initialization error:', err);
      this.disconnect();
      this.setState('error');

      let userFriendlyError = err?.message || 'Could not start voice advisor session.';
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
        userFriendlyError =
          'Microphone permission was denied. Please allow microphone access in your browser to talk with Voice Advisor.';
      } else if (err?.name === 'NotFoundError' || err?.message?.includes('DevicesNotFoundError')) {
        userFriendlyError = 'No microphone device was found. Please connect a microphone and try again.';
      }

      this.callbacks.onError(userFriendlyError);
    }
  }

  /**
   * Handles incoming message from backend Gemini Live bridge
   */
  private handleServerMessage(msg: any) {
    if (this.isDestroyed) return;

    // 1. Ready notification from server
    if (msg.type === 'ready') {
      console.log('[Voice Advisor] Session ready on server.');
      this.setState('listening');
      return;
    }

    // 2. Interruption notice (barge-in from model or server)
    if (msg.type === 'interrupted') {
      console.log('[Voice Advisor] Interrupted by speech.');
      this.stopAudioPlayback();
      return;
    }

    // 3. Real-time Output Audio chunk (Advisor speaking)
    if (msg.type === 'audio' && msg.data && !this.isSpeakerMuted) {
      const float32Pcm = base64PcmToFloat32(msg.data);
      if (float32Pcm.length > 0) {
        this.queueAudioPlayback(float32Pcm);
      }
      return;
    }

    // 4. Real-time Output Transcription (Advisor speaking text)
    if (msg.type === 'output_transcription' && msg.text) {
      this.currentLiveAiText += msg.text;
      this.callbacks.onLiveAiTranscript(this.currentLiveAiText);
      return;
    }

    // 5. Real-time Input Transcription (User speaking text)
    if (msg.type === 'input_transcription' && msg.text) {
      this.currentLiveUserText += msg.text;
      this.callbacks.onLiveUserTranscript(this.currentLiveUserText);
      return;
    }

    // 6. Turn completion
    if (msg.type === 'turn_complete') {
      // Commit User turn if any
      if (this.currentLiveUserText.trim()) {
        this.callbacks.onTranscriptTurn({
          id: `user-${Date.now()}`,
          speaker: 'user',
          text: this.currentLiveUserText.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        this.currentLiveUserText = '';
        this.callbacks.onLiveUserTranscript('');
      }

      // Commit Advisor turn if any
      if (this.currentLiveAiText.trim()) {
        this.callbacks.onTranscriptTurn({
          id: `advisor-${Date.now()}`,
          speaker: 'advisor',
          text: this.currentLiveAiText.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        this.currentLiveAiText = '';
        this.callbacks.onLiveAiTranscript('');
      }
      return;
    }

    // 7. Error from server
    if (msg.type === 'error') {
      console.error('[Voice Advisor] Server error:', msg.error);
      this.setState('error');
      this.callbacks.onError(msg.error || 'Voice session encountered an error.');
    }
  }

  /**
   * Initializes microphone capture and real-time audio chunk streaming
   */
  private async initMicrophone(): Promise<void> {
    if (this.micMediaStream) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
      video: false,
    });

    this.micMediaStream = stream;

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      this.inputAudioContext = new AudioCtx();
      if (this.inputAudioContext.state === 'suspended') {
        await this.inputAudioContext.resume();
      }

      this.micSourceNode = this.inputAudioContext.createMediaStreamSource(stream);

      // ScriptProcessorNode to process 16kHz audio buffer & measure volume RMS
      this.micProcessorNode = this.inputAudioContext.createScriptProcessor(2048, 1, 1);
      const sampleRate = this.inputAudioContext.sampleRate;

      this.micProcessorNode.onaudioprocess = (e) => {
        if (this.isMuted || this.isDestroyed) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate RMS for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const volume = Math.min(100, Math.round(rms * 400));

        if (volume > 2) {
          this.callbacks.onVolumeChange({ input: volume, output: this.isAiSpeaking ? 40 : 0 });

          // Natural Barge-In: if user begins speaking aloud while AI is talking, stop audio playback
          if (this.state === 'speaking' && volume > 16) {
            this.stopAudioPlayback();
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              try {
                this.ws.send(JSON.stringify({ type: 'interrupt' }));
              } catch {
                // ignore
              }
            }
          }
        }

        // Stream real-time 16kHz audio to server WebSocket bridge
        if (this.ws && this.ws.readyState === WebSocket.OPEN && (this.state === 'listening' || this.state === 'speaking')) {
          try {
            const pcm16 = downsampleTo16kPcm(inputData, sampleRate);
            if (pcm16.length > 0) {
              const base64Audio = int16ToBase64(pcm16);
              this.ws.send(
                JSON.stringify({
                  type: 'audio',
                  data: base64Audio,
                })
              );
            }
          } catch {
            // ignore streaming glitches
          }
        }
      };

      this.micSourceNode.connect(this.micProcessorNode);
      this.micProcessorNode.connect(this.inputAudioContext.destination);
    }
  }

  /**
   * Initializes AudioContext for output audio playback
   */
  private initAudioPlayback() {
    if (this.outputAudioContext) {
      if (this.outputAudioContext.state === 'suspended') {
        this.outputAudioContext.resume().catch(() => {});
      }
      return;
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    this.outputAudioContext = new AudioCtx({ sampleRate: 24000 });
    this.nextPlayTime = this.outputAudioContext.currentTime;

    this.outputGainNode = this.outputAudioContext.createGain();
    this.outputGainNode.gain.value = this.isSpeakerMuted ? 0 : 1;
    this.outputGainNode.connect(this.outputAudioContext.destination);
  }

  /**
   * Queues and plays 24kHz raw PCM Float32 audio chunk
   */
  private queueAudioPlayback(float32Data: Float32Array) {
    if (!this.outputAudioContext || !this.outputGainNode || this.isDestroyed || this.isSpeakerMuted) return;

    if (this.outputAudioContext.state === 'suspended') {
      this.outputAudioContext.resume().catch(() => {});
    }

    const buffer = this.outputAudioContext.createBuffer(1, float32Data.length, 24000);
    buffer.getChannelData(0).set(float32Data);

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputGainNode);

    const currentTime = this.outputAudioContext.currentTime;
    const startTime = Math.max(currentTime, this.nextPlayTime);
    source.start(startTime);
    this.nextPlayTime = startTime + buffer.duration;
    this.activeAudioSources.push(source);

    this.isAiSpeaking = true;
    this.setState('speaking');

    source.onended = () => {
      const idx = this.activeAudioSources.indexOf(source);
      if (idx !== -1) {
        this.activeAudioSources.splice(idx, 1);
      }
      if (this.activeAudioSources.length === 0) {
        this.isAiSpeaking = false;
        this.callbacks.onVolumeChange({ input: 0, output: 0 });
        if (this.state === 'speaking') {
          this.setState(this.isMuted ? 'muted' : 'listening');
        }
      }
    };
  }

  /**
   * Sends explicit text prompt over live connection (e.g. from quick suggestion click)
   */
  public sendSpokenPrompt(prompt: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.callbacks.onTranscriptTurn({
        id: `user-${Date.now()}`,
        speaker: 'user',
        text: prompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      try {
        this.ws.send(
          JSON.stringify({
            type: 'text',
            text: prompt,
          })
        );
      } catch (err) {
        console.warn('[Voice Advisor] Failed to send spoken prompt:', err);
      }
    }
  }

  /**
   * Disconnects current session and cleans up resources
   */
  public disconnect() {
    this.isDestroyed = true;

    // Close WebSocket
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    // Stop audio output
    this.stopAudioPlayback();

    // Release microphone
    if (this.micMediaStream) {
      this.micMediaStream.getTracks().forEach((track) => track.stop());
      this.micMediaStream = null;
    }

    if (this.micProcessorNode) {
      try {
        this.micProcessorNode.disconnect();
      } catch {}
      this.micProcessorNode = null;
    }

    if (this.micSourceNode) {
      try {
        this.micSourceNode.disconnect();
      } catch {}
      this.micSourceNode = null;
    }

    if (this.inputAudioContext) {
      try {
        this.inputAudioContext.close();
      } catch {}
      this.inputAudioContext = null;
    }

    if (this.outputAudioContext) {
      try {
        this.outputAudioContext.close();
      } catch {}
      this.outputAudioContext = null;
    }

    this.setState('idle');
    this.callbacks.onVolumeChange({ input: 0, output: 0 });
  }
}
