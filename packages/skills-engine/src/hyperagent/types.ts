/**
 * TrautsLab OS — HyperAgent Type Definitions
 * Roles: Planner, Navigator, Editor, Executor
 */

export type HyperAgentRole = 'PLANNER' | 'NAVIGATOR' | 'EDITOR' | 'EXECUTOR';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';

export interface HyperSubTask {
  id: string;
  stepNumber: number;
  role: HyperAgentRole;
  title: string;
  instruction: string;
  status: TaskStatus;
  result?: string;
  error?: string;
  retries?: number;
}

export interface HyperPlan {
  goal: string;
  createdAt: string;
  tasks: HyperSubTask[];
}

export interface HyperNavigatorResult {
  query: string;
  matchedFiles: Array<{
    path: string;
    score: number;
    summary: string;
  }>;
  contextSummary: string;
}

export interface HyperEditorResult {
  filePath: string;
  action: 'CREATE' | 'MODIFY' | 'APPEND';
  contentSnippet: string;
  bytesWritten: number;
}

export interface HyperExecutorResult {
  subTaskId: string;
  success: boolean;
  message: string;
  executionTimeMs: number;
  artifacts?: string[];
  repaired?: boolean;
}

export interface HyperOrchestrationResult {
  taskId: string;
  goal: string;
  success: boolean;
  totalTimeMs: number;
  plan: HyperPlan;
  finalSummary: string;
  artifactsCreated: string[];
}
