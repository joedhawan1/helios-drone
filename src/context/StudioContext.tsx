import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  StudioMode,
  StudioContextValue,
  LightshowState,
  LightshowConfig,
  GestureAimState,
  GestureAimConfig,
  LightPaintState,
  LightPaintConfig,
  LightPaintCanvas,
  PaintPoint,
  AudioAnalysis,
  AimVector,
  DeviceOrientation,
} from '../types/drone';
import { audioReactiveService } from '../services/AudioReactiveService';
import { gestureAimService } from '../services/GestureAimService';
import { lightPaintService } from '../services/LightPaintService';

const DEFAULT_LIGHTSHOW_STATE: LightshowState = {
  active: false,
  config: null,
  currentAnalysis: null,
  droneOutputs: {},
};

const DEFAULT_GESTURE_STATE: GestureAimState = {
  active: false,
  config: null,
  currentOrientation: null,
  currentAim: null,
  calibrationOffset: null,
};

const DEFAULT_PAINT_CONFIG: LightPaintConfig = {
  exposureTimeSec: 10,
  droneSpeedMs: 200,
  repeatCount: 1,
  fadeTrail: false,
  assignedDroneIds: [],
};

const DEFAULT_PAINT_STATE: LightPaintState = {
  mode: 'idle',
  canvas: null,
  config: DEFAULT_PAINT_CONFIG,
  executionProgress: 0,
  activeStrokeIndex: 0,
  activePointIndex: 0,
};

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [activeMode, setActiveModeState] = useState<StudioMode>(null);
  const [lightshow, setLightshow] = useState<LightshowState>(DEFAULT_LIGHTSHOW_STATE);
  const [gestureAim, setGestureAim] = useState<GestureAimState>(DEFAULT_GESTURE_STATE);
  const [lightPaint, setLightPaint] = useState<LightPaintState>(DEFAULT_PAINT_STATE);

  const activeModeRef = useRef<StudioMode>(null);

  // Subscribe to audioReactiveService events
  useEffect(() => {
    const unsubBeat = audioReactiveService.on('beat', (analysis: AudioAnalysis) => {
      setLightshow((prev) => ({ ...prev, currentAnalysis: analysis }));
    });
    const unsubOutputs = audioReactiveService.on('outputs', (outputs: Record<string, number>) => {
      setLightshow((prev) => ({ ...prev, droneOutputs: outputs }));
    });
    const unsubStarted = audioReactiveService.on('started', (config: LightshowConfig) => {
      setLightshow((prev) => ({ ...prev, active: true, config }));
    });
    const unsubStopped = audioReactiveService.on('stopped', () => {
      setLightshow(DEFAULT_LIGHTSHOW_STATE);
    });
    return () => {
      unsubBeat();
      unsubOutputs();
      unsubStarted();
      unsubStopped();
    };
  }, []);

  // Subscribe to gestureAimService events
  useEffect(() => {
    const unsubAim = gestureAimService.on('aim', (aim: AimVector) => {
      setGestureAim((prev) => ({ ...prev, currentAim: aim }));
    });
    const unsubOrientation = gestureAimService.on('orientation', (orientation: DeviceOrientation) => {
      setGestureAim((prev) => ({ ...prev, currentOrientation: orientation }));
    });
    const unsubCalibrated = gestureAimService.on('calibrated', (offset: DeviceOrientation) => {
      setGestureAim((prev) => ({ ...prev, calibrationOffset: offset }));
    });
    const unsubStarted = gestureAimService.on('started', (config: GestureAimConfig) => {
      setGestureAim((prev) => ({ ...prev, active: true, config }));
    });
    const unsubStopped = gestureAimService.on('stopped', () => {
      setGestureAim(DEFAULT_GESTURE_STATE);
    });
    return () => {
      unsubAim();
      unsubOrientation();
      unsubCalibrated();
      unsubStarted();
      unsubStopped();
    };
  }, []);

  // Subscribe to lightPaintService events
  useEffect(() => {
    const unsubMode = lightPaintService.on('mode', (mode: LightPaintState['mode']) => {
      setLightPaint((prev) => ({ ...prev, mode }));
    });
    const unsubCanvas = lightPaintService.on('canvas', (canvas: LightPaintCanvas | null) => {
      setLightPaint((prev) => ({ ...prev, canvas }));
    });
    const unsubProgress = lightPaintService.on('progress', (data: {
      executionProgress: number;
      activeStrokeIndex: number;
      activePointIndex: number;
    }) => {
      setLightPaint((prev) => ({ ...prev, ...data }));
    });
    return () => {
      unsubMode();
      unsubCanvas();
      unsubProgress();
    };
  }, []);

  const setActiveMode = useCallback((mode: StudioMode) => {
    const prev = activeModeRef.current;
    activeModeRef.current = mode;
    setActiveModeState(mode);
    // Stop whichever mode is being deactivated
    if (prev === 'lightshow' && mode !== 'lightshow') {
      audioReactiveService.stop();
    }
    if (prev === 'gesture' && mode !== 'gesture') {
      gestureAimService.stop();
    }
    if (prev === 'paint' && mode !== 'paint') {
      lightPaintService.stopExecution();
    }
  }, []);

  // Lightshow methods
  const startLightshow = useCallback((config: LightshowConfig) => {
    audioReactiveService.start(config);
  }, []);

  const stopLightshow = useCallback(() => {
    audioReactiveService.stop();
  }, []);

  const tapBPM = useCallback(() => {
    audioReactiveService.tapBPM();
  }, []);

  const simulateBeat = useCallback(() => {
    audioReactiveService.simulateBeat();
  }, []);

  // Gesture methods
  const startGestureAim = useCallback((config: GestureAimConfig) => {
    gestureAimService.start(config);
  }, []);

  const stopGestureAim = useCallback(() => {
    gestureAimService.stop();
  }, []);

  const calibrateGesture = useCallback(() => {
    gestureAimService.calibrate();
  }, []);

  const updateOrientation = useCallback((orientation: DeviceOrientation) => {
    gestureAimService.updateOrientation(orientation);
  }, []);

  // Paint methods
  const startDrawing = useCallback(() => {
    lightPaintService.startDrawing();
  }, []);

  const addPaintPoint = useCallback((point: PaintPoint) => {
    lightPaintService.addPoint(point);
  }, []);

  const endStroke = useCallback((brightness: number, speed: number) => {
    lightPaintService.endStroke(brightness, speed);
  }, []);

  const clearCanvas = useCallback(() => {
    lightPaintService.clearCanvas();
  }, []);

  const executeCanvas = useCallback((config: LightPaintConfig) => {
    lightPaintService.execute(config);
  }, []);

  const stopExecution = useCallback(() => {
    lightPaintService.stopExecution();
  }, []);

  const loadPreset = useCallback((name: string) => {
    lightPaintService.loadPreset(name);
  }, []);

  const saveCanvas = useCallback((name: string) => {
    lightPaintService.saveCanvas(name);
  }, []);

  const loadSavedCanvases = useCallback(() => {
    return lightPaintService.loadSavedCanvases();
  }, []);

  // Cleanup all services on unmount
  useEffect(() => {
    return () => {
      audioReactiveService.stop();
      gestureAimService.stop();
      lightPaintService.stopExecution();
    };
  }, []);

  return (
    <StudioContext.Provider
      value={{
        activeMode,
        setActiveMode,
        lightshow,
        gestureAim,
        lightPaint,
        startLightshow,
        stopLightshow,
        tapBPM,
        simulateBeat,
        startGestureAim,
        stopGestureAim,
        calibrateGesture,
        updateOrientation,
        startDrawing,
        addPaintPoint,
        endStroke,
        clearCanvas,
        executeCanvas,
        stopExecution,
        loadPreset,
        saveCanvas,
        loadSavedCanvases,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within StudioProvider');
  return ctx;
}
