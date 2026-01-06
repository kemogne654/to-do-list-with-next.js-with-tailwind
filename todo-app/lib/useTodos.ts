'use client';

import { useState, useEffect, useCallback } from 'react';
import { Todo, TodoStats, apiClient } from './api';

interface TodoFilters {
  status?: string;
  category?: string;
  priority?: string;
  overdue?: boolean;
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = useCallback(async (filters: TodoFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getTodos(filters);
      setTodos(response.todos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await apiClient.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const createTodo = async (todoData: {
    title: string;
    description?: string;
    category: string;
    priority: string;
    dueDate?: string;
    assignedTo?: string;
  }) => {
    try {
      setError(null);
      const newTodo = await apiClient.createTodo(todoData);
      setTodos(prev => [newTodo, ...prev]);
      await fetchStats();
      return newTodo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create todo');
      throw err;
    }
  };

  const updateTodo = async (id: string, todoData: Partial<Todo>) => {
    try {
      setError(null);
      const updatedTodo = await apiClient.updateTodo(id, todoData);
      setTodos(prev => prev.map(todo => todo.id === id ? updatedTodo : todo));
      await fetchStats();
      return updatedTodo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
      throw err;
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      setError(null);
      await apiClient.deleteTodo(id);
      setTodos(prev => prev.filter(todo => todo.id !== id));
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
      throw err;
    }
  };

  const completeTodo = async (id: string, completionNote?: string) => {
    try {
      setError(null);
      const completedTodo = await apiClient.completeTodo(id, completionNote);
      setTodos(prev => prev.map(todo => todo.id === id ? completedTodo : todo));
      await fetchStats();
      return completedTodo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete todo');
      throw err;
    }
  };

  const bulkDeleteTodos = async (todoIds: string[]) => {
    try {
      setError(null);
      await apiClient.bulkDeleteTodos(todoIds);
      setTodos(prev => prev.filter(todo => !todoIds.includes(todo.id)));
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todos');
      throw err;
    }
  };

  useEffect(() => {
    fetchTodos();
    fetchStats();
  }, [fetchTodos, fetchStats]);

  return {
    todos,
    stats,
    loading,
    error,
    fetchTodos,
    fetchStats,
    createTodo,
    updateTodo,
    deleteTodo,
    completeTodo,
    bulkDeleteTodos,
  };
}