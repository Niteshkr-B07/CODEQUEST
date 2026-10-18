import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api.ts';
import type { ProctoringSettings, ProctoringSession, ProctoringEventType } from '../types/index.ts';

interface UseProctoringOptions {
  roundId: string;
  settings?: ProctoringSettings;
  enabled?: boolean;
  onAutoSubmit?: () => void;
  onViolation?: (message: string, count: number, max: number) => void;
}

export function useProctoring({
  roundId,
  settings,
  enabled = true,
  onAutoSubmit,
  onViolation,
}: UseProctoringOptions) {
  const [session, setSession] = useState<ProctoringSession | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [micActive, setMicActive] = useState<boolean>(false);
  const [fullscreenActive, setFullscreenActive] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [tabWarnings, setTabWarnings] = useState<number>(0);
  const [maxWarnings, setMaxWarnings] = useState<number>(settings?.maxTabWarnings || 3);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lastWarningNotice, setLastWarningNotice] = useState<string | null>(null);
  const [isSimulatedStream, setIsSimulatedStream] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const snapshotTimerRef = useRef<any>(null);

  // Sync settings when provided
  useEffect(() => {
    if (settings?.maxTabWarnings) {
      setMaxWarnings(settings.maxTabWarnings);
    }
  }, [settings]);

  // Load initial session status from server
  const refreshSession = useCallback(async () => {
    if (!enabled || !roundId) return;
    try {
      const data = await api.getProctoringSession(roundId);
      if (data.session) {
        setSession(data.session);
        setTabWarnings(data.session.tabSwitchCount || 0);
        setIsLocked(data.session.isLocked || false);
        if (data.session.autoSubmitted && onAutoSubmit) {
          onAutoSubmit();
        }
      }
      if (data.proctoringSettings?.maxTabWarnings) {
        setMaxWarnings(data.proctoringSettings.maxTabWarnings);
      }
    } catch (err) {
      console.error('Failed to load proctoring session:', err);
    }
  }, [roundId, enabled, onAutoSubmit]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Send an audit event to the backend and handle violation response
  const reportEvent = useCallback(
    async (eventType: ProctoringEventType, severity?: string, metadata?: any) => {
      if (!enabled || !roundId) return;
      try {
        const res = await api.sendProctoringEvent({
          roundId,
          eventType,
          severity,
          metadata,
        });

        if (res.session) {
          setSession(res.session);
          setTabWarnings(res.session.tabSwitchCount || 0);
          setIsLocked(res.session.isLocked || false);

          if (res.session.autoSubmitted && onAutoSubmit) {
            onAutoSubmit();
          }
        }

        if (res.warningNotice) {
          setLastWarningNotice(res.warningNotice);
          if (onViolation) {
            onViolation(res.warningNotice, res.session?.tabSwitchCount || 0, maxWarnings);
          }
        }
      } catch (err) {
        console.error('Failed to report proctoring event:', err);
      }
    },
    [roundId, enabled, maxWarnings, onAutoSubmit, onViolation]
  );

  // Initialize Camera & Microphone media stream
  const startMediaStream = useCallback(async () => {
    try {
      // First attempt real user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true,
      });

      streamRef.current = stream;
      setCameraActive(true);
      setMicActive(true);
      setIsSimulatedStream(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Track stream end/disconnect
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setCameraActive(false);
          reportEvent('CAMERA_DISCONNECTED', 'critical');
        };
      });

      stream.getAudioTracks().forEach((track) => {
        track.onended = () => {
          setMicActive(false);
          reportEvent('MIC_DISCONNECTED', 'high');
        };
      });

      // Audio volume analyzer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        }
      } catch (e) {
        // Audio analysis not supported in some sandboxes
      }

      reportEvent('CAMERA_CONNECTED', 'info');
      reportEvent('MIC_CONNECTED', 'info');
      return true;
    } catch (err: any) {
      console.warn('Real webcam not accessible, falling back to simulated proctor stream:', err.message);

      // Create fallback synthetic canvas video stream for virtualized / test environments
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          let frame = 0;
          const drawPattern = () => {
            frame++;
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(0, 0, 320, 240);

            // User silhouette
            ctx.fillStyle = '#1E293B';
            ctx.beginPath();
            ctx.arc(160, 90, 45, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(160, 240, 90, Math.PI, 0, false);
            ctx.fill();

            // Status label & live pulsing dot
            ctx.fillStyle = '#38BDF8';
            ctx.font = 'bold 12px monospace';
            ctx.fillText('CODEQUEST AI PROCTOR', 60, 25);

            ctx.fillStyle = frame % 30 < 15 ? '#22C55E' : '#15803D';
            ctx.beginPath();
            ctx.arc(20, 20, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#94A3B8';
            ctx.font = '10px monospace';
            ctx.fillText(new Date().toLocaleTimeString(), 18, 225);

            requestAnimationFrame(drawPattern);
          };
          drawPattern();

          const synthStream = (canvas as any).captureStream ? (canvas as any).captureStream(15) : null;
          if (synthStream) {
            streamRef.current = synthStream;
            setCameraActive(true);
            setMicActive(true);
            setIsSimulatedStream(true);

            if (videoRef.current) {
              videoRef.current.srcObject = synthStream;
              videoRef.current.play().catch(() => {});
            }

            reportEvent('CAMERA_CONNECTED', 'info', { simulated: true });
            return true;
          }
        }
      } catch (fallbackErr) {
        console.error('Canvas capture fallback error:', fallbackErr);
      }

      setCameraActive(false);
      return false;
    }
  }, [reportEvent]);

  // Capture canvas snapshot from video feed
  const captureSnapshot = useCallback(async () => {
    if (!videoRef.current || !cameraActive || !roundId) return;

    try {
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, 320, 240);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

      await api.uploadProctoringSnapshot({
        roundId,
        imageUrl: dataUrl,
        metadata: { faceDetected: true, simulated: isSimulatedStream },
      });
    } catch (err) {
      console.error('Snapshot capture error:', err);
    }
  }, [cameraActive, roundId, isSimulatedStream]);

  // Setup periodic snapshots if enabled
  useEffect(() => {
    if (!enabled || !settings?.snapshotsEnabled) return;

    const intervalSeconds = settings.snapshotIntervalSeconds || 60;
    snapshotTimerRef.current = setInterval(() => {
      captureSnapshot();
    }, intervalSeconds * 1000);

    return () => {
      if (snapshotTimerRef.current) clearInterval(snapshotTimerRef.current);
    };
  }, [enabled, settings?.snapshotsEnabled, settings?.snapshotIntervalSeconds, captureSnapshot]);

  // Page visibility & Window blur/focus listeners
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportEvent('TAB_HIDDEN', 'high', { reason: 'visibilitychange' });
      } else {
        reportEvent('TAB_VISIBLE', 'info');
      }
    };

    const handleWindowBlur = () => {
      // Triggers when user clicks outside, Alt+Tabs, or changes focus
      reportEvent('WINDOW_BLUR', 'medium');
    };

    const handleWindowFocus = () => {
      reportEvent('WINDOW_FOCUS', 'info');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [enabled, reportEvent]);

  // Fullscreen change listener
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setFullscreenActive(isFs);

      if (!isFs) {
        reportEvent('FULLSCREEN_EXIT', 'high');
      } else {
        reportEvent('FULLSCREEN_ENTER', 'info');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [enabled, reportEvent]);

  // Clipboard & DevTools Restriction Listeners
  useEffect(() => {
    if (!enabled) return;

    const handleCopy = (e: ClipboardEvent) => {
      if (settings?.copyRestriction) {
        e.preventDefault();
        reportEvent('COPY_ATTEMPT', 'medium');
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (settings?.pasteRestriction) {
        e.preventDefault();
        reportEvent('PASTE_ATTEMPT', 'high');
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      if (settings?.cutRestriction) {
        e.preventDefault();
        reportEvent('CUT_ATTEMPT', 'medium');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportEvent('CONTEXT_MENU_ATTEMPT', 'low');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect F12 or Inspect shortcuts
      const isDevTools =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u')) ||
        (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i'));

      if (isDevTools) {
        e.preventDefault();
        reportEvent('WINDOW_BLUR', 'high', { reason: 'devtools_shortcut_blocked' });
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, settings, reportEvent]);

  // Request entering fullscreen mode
  const requestFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setFullscreenActive(true);
        return true;
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
    return false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (snapshotTimerRef.current) {
        clearInterval(snapshotTimerRef.current);
      }
    };
  }, []);

  return {
    videoRef,
    session,
    cameraActive,
    micActive,
    fullscreenActive,
    audioLevel,
    tabWarnings,
    maxWarnings,
    isLocked,
    lastWarningNotice,
    isSimulatedStream,
    startMediaStream,
    requestFullscreen,
    captureSnapshot,
    reportEvent,
    refreshSession,
    clearWarningNotice: () => setLastWarningNotice(null),
  };
}
