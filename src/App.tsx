import React, { useState, useEffect, useCallback } from 'react';
import { Task, AuditLog, TaskStatus, STATUS_ORDER, STATUS_LABELS } from './types';
import { api } from './api';
import './App.css';

// ─── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`status-badge status-${status.replace('_', '-')}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Audit Log Modal ─────────────────────────────────────────────────────────
function AuditModal({
  task,
  onClose,
}: {
  task: Task;
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs(task.id).then((l) => {
      setLogs(l);
      setLoading(false);
    });
  }, [task.id]);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Audit Log</h2>
            <p className="modal-subtitle">{task.title}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {loading && <p className="empty-state">Loading logs…</p>}

          {!loading && logs.length === 0 && (
            <p className="empty-state">No status changes recorded yet.</p>
          )}

          {!loading && logs.length > 0 && (
            <ol className="audit-list">
              {logs.map((log, idx) => (
                <li key={log.id} className="audit-entry">
                  <div className="audit-index">{idx + 1}</div>
                  <div className="audit-content">
                    <p className="audit-text">
                      User{' '}
                      <span className="audit-actor">"{log.actor}"</span>{' '}
                      changed{' '}
                      <span className="audit-task">"{log.taskTitle}"</span>{' '}
                      status from{' '}
                      <StatusBadge status={log.fromStatus} />{' '}
                      to{' '}
                      <StatusBadge status={log.toStatus} />
                    </p>
                    <p className="audit-time">{formatTime(log.timestamp)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create Task Form ─────────────────────────────────────────────────────────
function CreateTaskForm({ onCreated }: { onCreated: (task: Task) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const task = await api.createTask(title.trim(), description.trim() || undefined);
      onCreated(task);
      setTitle('');
      setDescription('');
      setOpen(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button className="btn btn-primary create-btn" onClick={() => setOpen(true)}>
        <span>+</span> New Task
      </button>
    );
  }

  return (
    <div className="create-form">
      <div className="create-form-header">
        <h3>New Task</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); setError(''); }}>
          Cancel
        </button>
      </div>
      <div className="form-group">
        <label htmlFor="task-title">Title *</label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
      </div>
      <div className="form-group">
        <label htmlFor="task-desc">Description</label>
        <textarea
          id="task-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details…"
          rows={2}
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Creating…' : 'Create Task'}
      </button>
    </div>
  );
}

// ─── Status Advance Control ───────────────────────────────────────────────────
function AdvanceStatus({
  task,
  actors,
  onUpdated,
}: {
  task: Task;
  actors: string[];
  onUpdated: (task: Task) => void;
}) {
  const [actor, setActor] = useState(actors[0] ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const currentIdx = STATUS_ORDER.indexOf(task.status);
  const nextStatus = currentIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIdx + 1] : null;

  const handleAdvance = async () => {
    if (!nextStatus) return;
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const result = await api.updateStatus(task.id, nextStatus, actor);
      onUpdated(result.task);
      if (!result.log) setNotice(result.message);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!nextStatus) {
    return <span className="done-label">✓ Complete</span>;
  }

  return (
    <div className="advance-status">
      <select
        value={actor}
        onChange={(e) => setActor(e.target.value)}
        className="actor-select"
        title="Select who's making this change"
      >
        {actors.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
      <button
        className="btn btn-advance"
        onClick={handleAdvance}
        disabled={loading}
        title={`Advance to "${STATUS_LABELS[nextStatus]}"`}
      >
        {loading ? '…' : `→ ${STATUS_LABELS[nextStatus]}`}
      </button>
      {error && <span className="inline-error">{error}</span>}
      {notice && <span className="inline-notice">{notice}</span>}
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  actors,
  onUpdated,
  onDeleted,
  onViewLogs,
}: {
  task: Task;
  actors: string[];
  onUpdated: (task: Task) => void;
  onDeleted: (id: string) => void;
  onViewLogs: (task: Task) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    setDeleting(true);
    try {
      await api.deleteTask(task.id);
      onDeleted(task.id);
    } catch {
      setDeleting(false);
    }
  };

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className={`task-card status-border-${task.status.replace('_', '-')}`}>
      <div className="task-card-top">
        <div className="task-info">
          <div className="task-title-row">
            <h3 className="task-title">{task.title}</h3>
            <StatusBadge status={task.status} />
          </div>
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}
          <p className="task-meta">Created {formatDate(task.createdAt)}</p>
        </div>
      </div>

      <div className="task-card-bottom">
        <AdvanceStatus task={task} actors={actors} onUpdated={onUpdated} />

        <div className="task-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onViewLogs(task)}
            title="View audit log"
          >
            📋 Audit Log
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete task"
          >
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
const ALL_STATUSES = ['all', ...STATUS_ORDER] as const;
type FilterStatus = typeof ALL_STATUSES[number];

function FilterBar({
  active,
  onChange,
  counts,
}: {
  active: FilterStatus;
  onChange: (s: FilterStatus) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="filter-bar">
      {ALL_STATUSES.map((s) => (
        <button
          key={s}
          className={`filter-btn ${active === s ? 'active' : ''}`}
          onClick={() => onChange(s)}
        >
          {s === 'all' ? 'All' : STATUS_LABELS[s as TaskStatus]}
          <span className="filter-count">{counts[s] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [actors, setActors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditTask, setAuditTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [taskList, meta] = await Promise.all([api.getTasks(), api.getMeta()]);
      setTasks(taskList);
      setActors(meta.actors);
    } catch (e: any) {
      setError('Could not connect to the backend. Is the server running on port 3001?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const handleUpdated = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleDeleted = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (auditTask?.id === id) setAuditTask(null);
  };

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const counts = {
    all: tasks.length,
    ...Object.fromEntries(STATUS_ORDER.map((s) => [s, tasks.filter((t) => t.status === s).length])),
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="brand-icon">⬡</span>
            <h1 className="brand-name">TaskFlow</h1>
          </div>
          <CreateTaskForm onCreated={handleCreated} />
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <strong>Connection error:</strong> {error}
          </div>
        )}

        <div className="main-inner">
          <div className="section-header">
            <h2 className="section-title">Tasks</h2>
            <span className="task-count">{tasks.length} total</span>
          </div>

          <FilterBar active={filter} onChange={setFilter} counts={counts} />

          {loading && <p className="empty-state">Loading tasks…</p>}

          {!loading && filtered.length === 0 && (
            <div className="empty-state-box">
              <p className="empty-icon">📭</p>
              <p>{filter === 'all' ? 'No tasks yet. Create one to get started.' : `No tasks with status "${STATUS_LABELS[filter as TaskStatus]}".`}</p>
            </div>
          )}

          <div className="task-grid">
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                actors={actors}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
                onViewLogs={setAuditTask}
              />
            ))}
          </div>
        </div>
      </main>

      {auditTask && (
        <AuditModal
          task={auditTask}
          onClose={() => setAuditTask(null)}
        />
      )}
    </div>
  );
}
