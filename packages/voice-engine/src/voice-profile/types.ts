/**
 * TrautsLab OS — Voice Profiler & Speaker Cloning Types
 */

export interface VoiceProfile {
  id: string;
  name: string;
  speaker: string;
  isDefaultFallback: boolean;
  embeddingDimensions: number;
  embeddingVector?: number[];
  pitchAdjustment: number;
  speedRate: number;
  sampleAudioPath?: string;
  createdAt: string;
  updatedAt: string;
  description: string;
}

export interface CalibrationOptions {
  name: string;
  speaker: string;
  audioBase64?: string;
  audioFilePath?: string;
  pitchAdjustment?: number;
  speedRate?: number;
  description?: string;
}

export interface CalibrationResult {
  success: boolean;
  profile: VoiceProfile;
  message: string;
  calibrationDurationMs: number;
  sampleDurationSeconds?: number;
}
