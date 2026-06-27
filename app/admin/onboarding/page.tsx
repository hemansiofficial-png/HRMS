'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import {
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  FileText,
  UserPlus,
  BarChart3,
} from 'lucide-react';

interface OnboardingTask {
  id: string;
  employeeId: string;
  employeeName: string;
  taskType: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  assignedTo?: string;
}

export default function OnboardingPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<OnboardingTask[]>([
    {
      id: '1',
      employeeId: 'EML001',
      employeeName: 'John Doe',
      taskType: 'IT Setup',
      description: 'Provide laptop, email, and access credentials',
      dueDate: '2024-03-15',
      status: 'COMPLETED',
      assignedTo: 'IT Manager',
    },
    {
      id: '2',
      employeeId: 'EML002',
      employeeName: 'Jane Smith',
      taskType: 'HR Orientation',
      description: 'Complete company orientation and policies training',
      dueDate: '2024-03-20',
      status: 'PENDING',
      assignedTo: 'HR Manager',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<OnboardingTask | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    taskType: '',
    description: '',
    dueDate: '',
    status: 'PENDING' as 'PENDING' | 'COMPLETED' | 'OVERDUE',
    assignedTo: '',
  });

  useEffect(() => {
    // Tasks loaded from initial state
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'status') {
      setFormData(prev => ({ ...prev, [name]: value as any }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: OnboardingTask = {
      id: String(Date.now()),
      employeeId: formData.employeeId,
      employeeName: formData.employeeName,
      taskType: formData.taskType,
      description: formData.description,
      dueDate: formData.dueDate,
      status: formData.status,
      assignedTo: formData.assignedTo,
    };
    setTasks([...tasks, newTask]);
    resetForm();
  };

  const handleEditTask = (task: OnboardingTask) => {
    setEditingTask(task);
    setFormData({
      employeeId: task.employeeId,
      employeeName: task.employeeName,
      taskType: task.taskType,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status,
      assignedTo: task.assignedTo || '',
    });
    setShowForm(true);
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...formData } : t));
    resetForm();
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Delete this onboarding task?')) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      taskType: '',
      description: '',
      dueDate: '',
      status: 'PENDING',
      assignedTo: '',
    });
    setEditingTask(null);
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'OVERDUE':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const filteredTasks = tasks.filter((t) =>
    filterStatus === 'all' ? true : t.status === filterStatus
  );

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    pending: tasks.filter((t) => t.status === 'PENDING').length,
    overdue: tasks.filter((t) => t.status === 'OVERDUE').length,
  };

  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <AppShell title="Onboarding">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Employee Onboarding
            </h1>
            <p className="text-gray-600 mt-1">
              Track and manage new employee onboarding tasks
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              {editingTask ? 'Edit Onboarding Task' : 'Create New Onboarding Task'}
            </h3>
            <form onSubmit={editingTask ? handleUpdateTask : handleAddTask} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name *</label>
                  <input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Type *</label>
                  <input
                    type="text"
                    name="taskType"
                    value={formData.taskType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., IT Setup, HR Orientation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                  <input
                    type="text"
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Manager/Department name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">
                  Total Tasks
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.total}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">
                  Completed
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.completed}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">
                  Pending
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.pending}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">
                  Overdue
                </p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.overdue}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">
                  Completion Rate
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {completionRate}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['all', 'PENDING', 'COMPLETED', 'OVERDUE'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === status ? 'text-white bg-blue-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All Tasks' : status}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <Card className="p-6">
          {filteredTasks.length > 0 ? (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-b-0"
                >
                  <div className="mt-1">{getStatusIcon(task.status)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {task.employeeName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {task.taskType}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <div
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {task.status}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {task.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                        {task.assignedTo && ` • Assigned to: ${task.assignedTo}`}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="p-1 hover:bg-blue-100 rounded text-blue-600 transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No onboarding tasks found</p>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
