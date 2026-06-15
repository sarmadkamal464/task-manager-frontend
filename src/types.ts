export type TaskStatus = 'to_do' | 'pending' | 'in_progress' | 'done';

export const STATUS_ORDER: TaskStatus[] = ['to_do', 'pending', 'in_progress', 'done'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  to_do: 'To Do',
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
};

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  taskId: string;
  taskTitle: string;
  actor: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  timestamp: string;
}

export interface Meta {
  actors: string[];
  statusOrder: TaskStatus[];
}
