import { Task, AuditLog, TaskStatus, Meta } from './types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

export const api = {
  getMeta: () => request<Meta>('/meta'),

  getTasks: () => request<Task[]>('/tasks'),

  createTask: (title: string, description?: string) =>
    request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }),

  deleteTask: (id: string) =>
    request<{ message: string }>(`/tasks/${id}`, { method: 'DELETE' }),

  updateStatus: (id: string, status: TaskStatus, actor: string) =>
    request<{ task: Task; log: AuditLog | null; message: string }>(`/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, actor }),
    }),

  getAuditLogs: (id: string) => request<AuditLog[]>(`/tasks/${id}/audit-logs`),
};
