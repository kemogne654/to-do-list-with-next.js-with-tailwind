'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useTodos } from '../lib/useTodos';
import { apiClient } from '../lib/api';
import LoginForm from '../components/LoginForm';

const categories = ['Personal', 'Work', 'Shopping', 'Health', 'Other'];
const priorities = ['low', 'medium', 'high'];

export default function TodoDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { 
    todos, 
    stats, 
    loading, 
    error, 
    createTodo, 
    updateTodo, 
    deleteTodo, 
    completeTodo, 
    bulkDeleteTodos,
    fetchTodos 
  } = useTodos();

  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'create' : 'list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTodos, setSelectedTodos] = useState<string[]>([]);
  const [editingTodo, setEditingTodo] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [completionNote, setCompletionNote] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<any>(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Personal',
    priority: 'medium',
    dueDate: '',
    assignedTo: ''
  });

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (categoryFilter !== 'all') filters.category = categoryFilter;
      fetchTodos(filters);
      
      // Fetch users for assignment dropdown (admin only)
      if (user?.role === 'admin') {
        apiClient.getAllUsers().then(setUsers).catch(console.error);
      }
    }
  }, [statusFilter, categoryFilter, isAuthenticated, fetchTodos, user?.role]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      await createTodo({
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        assignedTo: form.assignedTo || undefined
      });
      
      setForm({
        title: '',
        description: '',
        category: 'Personal',
        priority: 'medium',
        dueDate: '',
        assignedTo: ''
      });
      setActiveTab('list');
    } catch (err) {
      console.error('Failed to create todo:', err);
    }
  };

  const handleComplete = async () => {
    if (!selectedTodo) return;
    
    try {
      await updateTodo(selectedTodo.id, {
        status: 'completed',
        completionNote,
        completedAt: new Date().toISOString()
      });
      setShowCompleteModal(false);
      setSelectedTodo(null);
      setCompletionNote('');
    } catch (err) {
      console.error('Failed to complete todo:', err);
    }
  };

  const handleEdit = (todo: any) => {
    setEditingTodo(todo.id);
    setEditForm({
      title: todo.title,
      description: todo.description || ''
    });
  };

  const saveEdit = async () => {
    if (!editingTodo) return;
    
    try {
      await updateTodo(editingTodo, editForm);
      setEditingTodo(null);
      setEditForm({});
    } catch (err) {
      console.error('Failed to update todo:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTodos.length === 0) return;
    
    try {
      await bulkDeleteTodos(selectedTodos);
      setSelectedTodos([]);
    } catch (err) {
      console.error('Failed to delete todos:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-process': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRemainingDays = (dueDate?: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate user-specific stats
  const getUserStats = () => {
    if (!todos.length) return { total: 0, completed: 0, pending: 0, inProcess: 0, overdue: 0, categories: {}, priorities: {} };
    
    // Filter todos for current user
    const userTodos = todos.filter(todo => {
      if (user?.role === 'admin') {
        return true; // Admin sees all stats
      } else {
        return !todo.assignedTo || todo.assignedTo === user?.email; // User sees only their todos
      }
    });
    
    const now = new Date();
    const userStats = {
      total: userTodos.length,
      completed: userTodos.filter(t => t.status === 'completed').length,
      pending: userTodos.filter(t => t.status === 'pending').length,
      inProcess: userTodos.filter(t => t.status === 'in-process').length,
      overdue: userTodos.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed').length,
      categories: {} as any,
      priorities: {} as any
    };
    
    // Calculate category breakdown
    categories.forEach(cat => {
      userStats.categories[cat] = userTodos.filter(t => t.category === cat).length;
    });
    
    // Calculate priority breakdown
    priorities.forEach(p => {
      userStats.priorities[p] = userTodos.filter(t => t.priority === p).length;
    });
    
    return userStats;
  };

  const userStats = getUserStats();

  const filteredTodos = todos.filter(todo => {
    if (statusFilter !== 'all' && todo.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && todo.category !== categoryFilter) return false;
    
    // For list tab (users), show only pending todos
    if (activeTab === 'list' && user?.role === 'user') {
      return (todo.status === 'pending') && (!todo.assignedTo || todo.assignedTo === user.email);
    }
    
    // For in-progress tab, show only in-progress todos
    if (activeTab === 'in-progress' && user?.role === 'user') {
      return (todo.status === 'in-process') && (!todo.assignedTo || todo.assignedTo === user.email);
    }
    
    // For completed tab, show only completed todos
    if (activeTab === 'completed' && user?.role === 'user') {
      return (todo.status === 'completed') && (!todo.assignedTo || todo.assignedTo === user.email);
    }
    
    // For admin list tab, show only personal todos (not assigned)
    if (activeTab === 'list' && user?.role === 'admin') {
      return !todo.assignedTo || todo.assignedTo === user.email;
    }
    
    // For assignments tab, show only assigned todos
    if (activeTab === 'assignments' && user?.role === 'admin') {
      return todo.assignedTo && todo.assignedTo !== user.email;
    }
    
    // For regular users, show their assigned todos and personal todos
    if (user?.role === 'user') {
      return !todo.assignedTo || todo.assignedTo === user.email;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Todo Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 overflow-x-auto">
          {(user?.role === 'admin' ? ['create', 'list', 'assignments', 'analytics'] : ['list', 'in-progress', 'completed', 'analytics']).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'assignments' ? 'Assigned Tasks' : 
               tab === 'in-progress' ? 'In Progress' : tab}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Something went wrong</span>
            </div>
            <p className="mt-1 text-sm">Please check your connection and try again.</p>
          </div>
        )}

        {/* Create Tab - Admin Only */}
        {activeTab === 'create' && user?.role === 'admin' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Create New Todo</h2>
            <form onSubmit={handleCreateTodo} className="space-y-4">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                placeholder="Todo title *"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              
              <textarea
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                placeholder="Description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={form.priority}
                  onChange={(e) => setForm({...form, priority: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorities.map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({...form, dueDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <select
                  value={form.assignedTo}
                  onChange={(e) => setForm({...form, assignedTo: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Personal (Self)</option>
                  {users.map(user => (
                    <option key={user.id} value={user.email}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create Todo
              </button>
            </form>
          </div>
        )}

        {/* List Tab */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {selectedTodos.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete Selected ({selectedTodos.length})
                  </button>
                )}
              </div>
            </div>

            {/* Pending Todos Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Pending Tasks</h3>
                <p className="text-sm text-gray-600">Tasks waiting to be started</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTodos(filteredTodos.map(t => t.id));
                            } else {
                              setSelectedTodos([]);
                            }
                          }}
                          checked={selectedTodos.length === filteredTodos.length && filteredTodos.length > 0}
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Task</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Due Date</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-gray-500">Loading todos...</td>
                      </tr>
                    ) : filteredTodos.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-gray-500">No todos found</td>
                      </tr>
                    ) : (
                      filteredTodos.map(todo => {
                        const remainingDays = getRemainingDays(todo.dueDate);
                        return (
                          <tr key={todo.id} className="hover:bg-gray-50">
                            <td className="px-3 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedTodos.includes(todo.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTodos([...selectedTodos, todo.id]);
                                  } else {
                                    setSelectedTodos(selectedTodos.filter(id => id !== todo.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="px-3 py-4">
                              {editingTodo === todo.id ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editForm.title || ''}
                                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                  <textarea
                                    value={editForm.description || ''}
                                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                    rows={2}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                  <div className="flex gap-1">
                                    <button
                                      onClick={saveEdit}
                                      className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingTodo(null);
                                        setEditForm({});
                                      }}
                                      className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="min-w-[200px]">
                                  <div className="text-sm font-medium text-gray-900">{todo.title}</div>
                                  {todo.description && (
                                    <div className="text-sm text-gray-500">{todo.description}</div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(todo.status)}`}>
                                {todo.status.replace('-', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(todo.priority)}`}>
                                {todo.priority.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              {todo.category}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              {todo.dueDate ? (
                                <div className="min-w-[120px]">
                                  <div>{new Date(todo.dueDate).toLocaleDateString()}</div>
                                  {todo.status === 'in-process' && remainingDays !== null && (
                                    <div className={`text-xs ${
                                      remainingDays < 0 ? 'text-red-600' : 
                                      remainingDays <= 3 ? 'text-orange-600' : 'text-green-600'
                                    }`}>
                                      {remainingDays < 0 ? `${Math.abs(remainingDays)} days overdue` : 
                                       remainingDays === 0 ? 'Due today' : 
                                       `${remainingDays} days left`}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">No due date</span>
                              )}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              {todo.assignedTo ? (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                  {todo.assignedTo}
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Personal
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-wrap gap-1 min-w-[200px]">
                                {todo.status !== 'completed' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedTodo(todo);
                                        setShowCompleteModal(true);
                                      }}
                                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 whitespace-nowrap"
                                    >
                                      Complete
                                    </button>
                                    <button
                                      onClick={() => updateTodo(todo.id, {
                                        status: todo.status === 'pending' ? 'in-process' : 'pending'
                                      })}
                                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 whitespace-nowrap"
                                    >
                                      {todo.status === 'pending' ? 'Start' : 'Pause'}
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleEdit(todo)}
                                  className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 whitespace-nowrap"
                                >
                                  Edit
                                </button>
                                {(user?.role === 'admin' || !todo.assignedTo) && (
                                  <button
                                    onClick={() => deleteTodo(todo.id)}
                                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 whitespace-nowrap"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Completed Tab - User Only */}
        {activeTab === 'completed' && user?.role === 'user' && (
          <div className="space-y-6">
            {/* Completed Tasks Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Completed Tasks</h3>
                <p className="text-sm text-gray-600">Your finished tasks</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Task</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Date</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading completed tasks...</td>
                      </tr>
                    ) : filteredTodos.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No completed tasks</td>
                      </tr>
                    ) : (
                      filteredTodos.map(todo => (
                        <tr key={todo.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4">
                            <div className="min-w-[200px]">
                              <div className="text-sm font-medium text-gray-900">{todo.title}</div>
                              {todo.description && (
                                <div className="text-sm text-gray-500 mt-1">{todo.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(todo.priority)}`}>
                              {todo.priority.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {todo.category}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {todo.completedAt ? new Date(todo.completedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {todo.completionNote || 'No notes'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* In Progress Tab - User Only */}
        {activeTab === 'in-progress' && user?.role === 'user' && (
          <div className="space-y-6">
            {/* In Progress Tasks Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Tasks In Progress</h3>
                <p className="text-sm text-gray-600">Your active tasks with remaining time</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Task</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Due Date & Time Left</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading in-progress tasks...</td>
                      </tr>
                    ) : filteredTodos.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No tasks in progress</td>
                      </tr>
                    ) : (
                      filteredTodos.map(todo => {
                        const remainingDays = getRemainingDays(todo.dueDate);
                        return (
                          <tr key={todo.id} className="hover:bg-gray-50">
                            <td className="px-3 py-4">
                              <div className="min-w-[200px]">
                                <div className="text-sm font-medium text-gray-900">{todo.title}</div>
                                {todo.description && (
                                  <div className="text-sm text-gray-500 mt-1">{todo.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(todo.priority)}`}>
                                {todo.priority.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              {todo.category}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              {todo.dueDate ? (
                                <div className="min-w-[150px]">
                                  <div className="font-medium">{new Date(todo.dueDate).toLocaleDateString()}</div>
                                  {remainingDays !== null && (
                                    <div className={`text-xs font-semibold ${
                                      remainingDays < 0 ? 'text-red-600' : 
                                      remainingDays <= 3 ? 'text-orange-600' : 'text-green-600'
                                    }`}>
                                      {remainingDays < 0 ? `${Math.abs(remainingDays)} days overdue` : 
                                       remainingDays === 0 ? 'Due today' : 
                                       `${remainingDays} days left`}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">No due date</span>
                              )}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-wrap gap-1 min-w-[150px]">
                                <button
                                  onClick={() => {
                                    setSelectedTodo(todo);
                                    setShowCompleteModal(true);
                                  }}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 whitespace-nowrap"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => updateTodo(todo.id, { status: 'pending' })}
                                  className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 whitespace-nowrap"
                                >
                                  Pause
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Assignments Tab - Admin Only */}
        {activeTab === 'assignments' && user?.role === 'admin' && (
          <div className="space-y-6">
            {/* Assigned Tasks Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Assigned Tasks</h3>
                <p className="text-sm text-gray-600">Tasks assigned to team members</p>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Loading assigned tasks...</td>
                    </tr>
                  ) : filteredTodos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No assigned tasks found</td>
                    </tr>
                  ) : (
                    filteredTodos.map(todo => {
                      const remainingDays = getRemainingDays(todo.dueDate);
                      return (
                        <tr key={todo.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{todo.title}</div>
                              {todo.description && (
                                <div className="text-sm text-gray-500">{todo.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(todo.status)}`}>
                              {todo.status.replace('-', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(todo.priority)}`}>
                              {todo.priority.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {todo.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {todo.dueDate ? (
                              <div>
                                <div>{new Date(todo.dueDate).toLocaleDateString()}</div>
                                {todo.status === 'in-process' && remainingDays !== null && (
                                  <div className={`text-xs ${
                                    remainingDays < 0 ? 'text-red-600' : 
                                    remainingDays <= 3 ? 'text-orange-600' : 'text-green-600'
                                  }`}>
                                    {remainingDays < 0 ? `${Math.abs(remainingDays)} days overdue` : 
                                     remainingDays === 0 ? 'Due today' : 
                                     `${remainingDays} days left`}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">No due date</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                              {todo.assignedTo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEdit(todo)}
                                className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                              >
                                Update
                              </button>
                              <button
                                onClick={() => deleteTodo(todo.id)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {stats ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">
                      {user?.role === 'admin' ? 'Total Created' : 'Total Todos'}
                    </h3>
                    <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                    <p className="text-2xl font-bold text-green-600">{userStats.completed}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Pending</h3>
                    <p className="text-2xl font-bold text-yellow-600">{userStats.pending}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">In Process</h3>
                    <p className="text-2xl font-bold text-blue-600">{userStats.inProcess}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
                    <p className="text-2xl font-bold text-red-600">{userStats.overdue}</p>
                  </div>
                </div>

                {user?.role === 'admin' && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Assignment Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {todos.filter(t => t.assignedTo && t.assignedTo !== user.email).length}
                        </div>
                        <p className="text-sm text-gray-600">Tasks Assigned</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {todos.filter(t => !t.assignedTo || t.assignedTo === user.email).length}
                        </div>
                        <p className="text-sm text-gray-600">Personal Tasks</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Category Breakdown */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {user?.role === 'admin' ? 'Created Todos by Category' : 'Todos by Category'}
                  </h3>
                  <div className="space-y-2">
                    {categories.map(cat => {
                      const count = userStats.categories[cat] || 0;
                      const percentage = userStats.total > 0 ? (count / userStats.total) * 100 : 0;
                      return (
                        <div key={cat} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{cat}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Breakdown */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {user?.role === 'admin' ? 'Created Todos by Priority' : 'Todos by Priority'}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {priorities.map(p => {
                      const count = userStats.priorities[p] || 0;
                      return (
                        <div key={p} className="text-center">
                          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-xl font-bold ${getPriorityColor(p)}`}>
                            {count}
                          </div>
                          <p className="text-sm font-medium mt-2 capitalize">{p} Priority</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">Loading analytics...</div>
            )}
          </div>
        )}
      </div>

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Complete Task</h3>
            <p className="text-sm text-gray-600 mb-4">Add an optional completion note:</p>
            <textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Completion notes (optional)..."
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Complete
              </button>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedTodo(null);
                  setCompletionNote('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}