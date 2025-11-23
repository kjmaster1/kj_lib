// web/src/typings/progress.ts
export type ProgressPosition = 'bottom' | 'middle';

export interface ProgressState {
  visible: boolean;
  type: 'linear' | 'circular';
  label: string;
  duration: number;
  position: ProgressPosition;
  showPercentage?: boolean; // For circular
}

// Payloads from Lua
export interface ProgressPayload {
  label: string;
  duration: number;
  position?: ProgressPosition;
}

export interface CircleProgressPayload extends ProgressPayload {
  percent?: boolean;
}
