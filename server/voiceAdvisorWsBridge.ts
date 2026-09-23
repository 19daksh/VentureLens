import { WebSocket, WebSocketServer } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { fetchVerifiedAnalysis, AnalysisContextData } from './advisorService.ts';
import { VOICE_ADVISOR_BASE_INSTRUCTION, buildVoiceContextSummary } from './voiceAdvisorService.ts';

export function setupVoiceAdvisorWebSocketServer(wss: WebSocketServer) {
  wss.on('connection', async (clientWs: WebSocket, req) => {
    console.log('[Voice Advisor WS] New incoming client connection');

    let geminiSession: any = null;
    let isConnected = true;

    clientWs.on('close', () => {
      isConnected = false;
      if (geminiSession) {
        try {
          geminiSession.close();
        } catch {
          // ignore
        }
        geminiSession = null;
      }
    });

    clientWs.on('error', (err) => {
      console.warn('[Voice Advisor WS] Client error:', err);
    });

    try {
      // Parse query params: token, analysisId, voice
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const userToken = url.searchParams.get('token');
      const analysisId = url.searchParams.get('analysisId');
      const voiceName = url.searchParams.get('voice') || 'Puck';

      let analysisContext: AnalysisContextData | null = null;
      const isDemo = userToken === 'demo-token';

      if (analysisId && userToken && userToken !== 'demo-token') {
        try {
          const { context, authorized } = await fetchVerifiedAnalysis(analysisId, userToken);
          if (authorized && context) {
            analysisContext = context;
          }
        } catch (err) {
          console.warn('[Voice Advisor WS] Could not verify analysis from Supabase:', err);
        }
      }

      // Build system instruction
      let systemInstruction = VOICE_ADVISOR_BASE_INSTRUCTION;
      if (analysisContext && analysisContext.title) {
        const summary = buildVoiceContextSummary(analysisContext);
        systemInstruction += `\n\n${summary}\nCRITICAL: The founder is discussing "${analysisContext.title}". Proactively refer to these findings, metrics, and risks. Greet them warmly and reference their startup in your first response.`;
      } else {
        systemInstruction += `\n\nNo specific startup analysis is currently selected. Ask the founder what idea or market they would like to explore today.`;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        clientWs.send(JSON.stringify({ type: 'error', error: 'Gemini API key is not configured on the server.' }));
        clientWs.close(4500, 'Server Config Error');
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { apiVersion: 'v1alpha' },
      });

      // Connect to Gemini Live
      geminiSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName || 'Puck',
              },
            },
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (msg: any) => {
            if (!isConnected || clientWs.readyState !== WebSocket.OPEN) return;
            try {
              // 1. Forward raw server message
              clientWs.send(JSON.stringify({ type: 'server_message', data: msg }));

              // 2. Extract and forward audio chunks
              const parts = msg.serverContent?.modelTurn?.parts;
              if (parts && Array.isArray(parts)) {
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'audio',
                        data: part.inlineData.data,
                      })
                    );
                  }
                }
              }

              // 3. Extract and forward output transcription (Advisor speech)
              const outputText = msg.serverContent?.outputTranscription?.text;
              if (outputText) {
                clientWs.send(
                  JSON.stringify({
                    type: 'output_transcription',
                    text: outputText,
                  })
                );
              }

              // 4. Extract and forward input transcription (User speech)
              const inputText = msg.serverContent?.inputTranscription?.text;
              if (inputText) {
                clientWs.send(
                  JSON.stringify({
                    type: 'input_transcription',
                    text: inputText,
                  })
                );
              }

              // 5. Interrupted notification (barge-in)
              if (msg.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ type: 'interrupted' }));
              }

              // 6. Turn completion
              if (msg.serverContent?.turnComplete || msg.serverContent?.generationComplete) {
                clientWs.send(JSON.stringify({ type: 'turn_complete' }));
              }
            } catch (err) {
              console.warn('[Voice Advisor WS] Error forwarding to client:', err);
            }
          },
          onclose: (e: any) => {
            console.log('[Voice Advisor WS] Gemini session closed');
            if (isConnected && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'session_closed', code: e?.code, reason: e?.reason }));
              clientWs.close();
            }
          },
          onerror: (err: any) => {
            console.error('[Voice Advisor WS] Gemini session error:', err);
            if (isConnected && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'error', error: err?.message || 'Voice session error.' }));
            }
          },
        },
      });

      // Send initial ready message to client
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'ready',
            activeTitle: analysisContext?.title || null,
            overallScore: analysisContext?.overall_score || null,
          })
        );
      }

      // Handle messages from client
      clientWs.on('message', (raw) => {
        if (!geminiSession) return;
        try {
          const parsed = JSON.parse(raw.toString());

          // Handle 16kHz audio input from microphone
          if (parsed.type === 'audio' && parsed.data) {
            geminiSession.sendRealtimeInput({
              audio: {
                data: parsed.data,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          }
          // Handle spoken text query (e.g. initial greeting or clickable suggestion chip)
          else if (parsed.type === 'text' && parsed.text) {
            geminiSession.sendRealtimeInput({
              text: parsed.text,
            });
          }
          // Handle legacy/alternate realtime_input payload
          else if (parsed.type === 'realtime_input') {
            if (parsed.audio) {
              geminiSession.sendRealtimeInput({ audio: parsed.audio });
            } else if (parsed.text) {
              geminiSession.sendRealtimeInput({ text: parsed.text });
            } else if (parsed.media) {
              geminiSession.sendRealtimeInput({
                audio: { data: parsed.media.data, mimeType: parsed.media.mimeType || 'audio/pcm;rate=16000' },
              });
            }
          }
          // Handle client content turns
          else if (parsed.type === 'client_content' && parsed.turns) {
            geminiSession.sendClientContent({
              turns: parsed.turns,
              turnComplete: parsed.turnComplete ?? true,
            });
          }
        } catch (err) {
          console.warn('[Voice Advisor WS] Message parsing error:', err);
        }
      });
    } catch (err: any) {
      console.error('[Voice Advisor WS] Connection setup error:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'error', error: err?.message || 'Failed to initialize voice session.' }));
        clientWs.close(4500, 'Init Failed');
      }
    }
  });
}
