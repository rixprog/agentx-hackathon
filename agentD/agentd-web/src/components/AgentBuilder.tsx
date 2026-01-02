import React, { useState, useEffect } from 'react';
import { Bot, Play, Loader2, Save, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';

interface SavedTask {
  id: string;
  name: string;
  description: string;
  task: string;
  created_at: string;
  status?: 'idle' | 'running' | 'completed' | 'failed';
  last_result?: string;
}

export const AgentBuilder: React.FC = () => {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [task, setTask] = useState('');
  const [savedTasks, setSavedTasks] = useState<SavedTask[]>([]);
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedTasks();
  }, []);

  const loadSavedTasks = async () => {
    try {
      const response = await fetch('/api/agent_tasks');
      if (response.ok) {
        const data = await response.json();
        setSavedTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTask = async () => {
    if (!taskName.trim() || !task.trim()) return;

    try {
      const response = await fetch('/api/agent_tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName,
          description: description,
          task: task,
        }),
      });

      if (response.ok) {
        const newTask = await response.json();
        setSavedTasks(prev => [newTask, ...prev]);
        setTaskName('');
        setDescription('');
        setTask('');
      }
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/agent_tasks/${taskId}`, { method: 'DELETE' });
      setSavedTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const runTask = async (taskData: SavedTask) => {
    setIsRunning(taskData.id);
    setSavedTasks(prev => prev.map(t =>
      t.id === taskData.id ? { ...t, status: 'running' } : t
    ));

    try {
      // Create a new chat session for the agent task
      const sessionResponse = await fetch('/api/chat_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `agent_${Date.now()}`,
          title: `Agent Task: ${taskData.name}`
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }

      const sessionData = await sessionResponse.json();
      const sessionId = sessionData.id;

      // Run the task
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: taskData.task }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      // Read the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResult = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'response') {
              finalResult = data.content;
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          }
        }
      }

      // Update task status
      setSavedTasks(prev => prev.map(t =>
        t.id === taskData.id
          ? { ...t, status: 'completed', last_result: finalResult }
          : t
      ));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setSavedTasks(prev => prev.map(t =>
        t.id === taskData.id
          ? { ...t, status: 'failed', last_result: errorMessage }
          : t
      ));
    } finally {
      setIsRunning(null);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'running':
        return 'Running...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-5f5ce5 to-f79cff backdrop-blur-xl border border-white/30 rounded-xl flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-anton text-white tracking-tight">
                AGENT BUILDER
              </h1>
              <p className="text-white/60 font-general-sans">
                Create, save, and run automated tasks with your AI agent
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Task Section */}
          <div className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-6">
            <h2 className="text-xl font-anton text-white mb-6">CREATE NEW TASK</h2>

            <div className="space-y-4">
              {/* Task Name */}
              <div>
                <label className="block text-sm font-anton text-white/80 mb-2">TASK NAME</label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Enter task name..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/50 font-general-sans focus:outline-none focus:border-white/40"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-anton text-white/80 mb-2">DESCRIPTION</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this task does..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/50 font-general-sans focus:outline-none focus:border-white/40"
                />
              </div>

              {/* Task Instructions */}
              <div>
                <label className="block text-sm font-anton text-white/80 mb-2">TASK INSTRUCTIONS</label>
                <textarea
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="Describe what the agent should do..."
                  className="w-full h-32 bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/50 font-general-sans resize-none focus:outline-none focus:border-white/40"
                />
              </div>

              <button
                onClick={saveTask}
                disabled={!taskName.trim() || !task.trim()}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-anton rounded-xl hover:from-green-500/80 hover:to-emerald-600/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                SAVE TASK
              </button>
            </div>
          </div>

          {/* Saved Tasks Section */}
          <div className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-6">
            <h2 className="text-xl font-anton text-white mb-6">SAVED TASKS</h2>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-white/60" />
              </div>
            ) : savedTasks.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-general-sans">No saved tasks yet</p>
                <p className="text-sm mt-1">Create your first task to get started</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {savedTasks.map((savedTask) => (
                  <div key={savedTask.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-anton text-white text-lg">{savedTask.name}</h3>
                        {savedTask.description && (
                          <p className="text-white/70 text-sm font-general-sans mt-1">
                            {savedTask.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusIcon(savedTask.status)}
                          <span className="text-xs text-white/60 font-general-sans">
                            {getStatusText(savedTask.status)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(savedTask.id)}
                        className="p-2 text-white/60 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => runTask(savedTask)}
                        disabled={isRunning === savedTask.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-5f5ce5 to-f79cff text-white font-anton text-sm rounded-lg hover:from-5f5ce5/80 hover:to-f79cff/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRunning === savedTask.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        {isRunning === savedTask.id ? 'RUNNING...' : 'RUN TASK'}
                      </button>
                    </div>

                    {savedTask.last_result && (
                      <div className="mt-3 p-3 bg-white/5 rounded-lg">
                        <p className="text-xs text-white/60 font-general-sans mb-1">Last Result:</p>
                        <p className="text-sm text-white/80 font-general-sans truncate">
                          {savedTask.last_result}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};