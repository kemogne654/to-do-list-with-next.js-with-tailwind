// API Configuration
const API_BASE_URL = 'https://todo-backend-95t0.onrender.com';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  category: 'Personal' | 'Work' | 'Shopping' | 'Health' | 'Other';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-process' | 'completed';
  dueDate?: string;
  assignedTo?: string;
  completionNote?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  inProcess: number;
  overdue: number;
  categories: Record<string, number>;
  priorities: Record<string, number>;
}

// Token Management
export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },

  removeToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  setUser: (user: User): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }
};

// API Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = tokenManager.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      console.log('API Request:', {
        url: `${this.baseURL}${endpoint}`,
        method: config.method || 'GET',
        status: response.status,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        console.error('API Error:', {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          error
        });
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (fetchError) {
      console.error('Network Error:', {
        endpoint,
        url: `${this.baseURL}${endpoint}`,
        error: fetchError
      });
      throw new Error('Unable to connect to the server. Please try again later.');
    }
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    tokenManager.setToken(response.token);
    tokenManager.setUser(response.user);
    return response;
  }

  async register(name: string, email: string, password: string) {
    const response = await this.request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    
    tokenManager.setToken(response.token);
    tokenManager.setUser(response.user);
    return response;
  }

  async logout() {
    await this.request('/api/auth/logout', { method: 'POST' });
    tokenManager.removeToken();
  }

  async getCurrentUser() {
    return this.request<User>('/api/auth/me');
  }

  async getAllUsers() {
    return this.request<User[]>('/api/auth/users');
  }

  // Todos
  async getTodos(filters: {
    status?: string;
    category?: string;
    priority?: string;
    overdue?: boolean;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    return this.request<{ todos: Todo[]; total: number }>(`/api/todos?${params}`);
  }

  async createTodo(todoData: {
    title: string;
    description?: string;
    category: string;
    priority: string;
    dueDate?: string;
    assignedTo?: string;
  }) {
    return this.request<Todo>('/api/todos', {
      method: 'POST',
      body: JSON.stringify(todoData),
    });
  }

  async updateTodo(id: string, todoData: Partial<Todo>) {
    return this.request<Todo>(`/api/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(todoData),
    });
  }

  async deleteTodo(id: string) {
    return this.request<{ message: string }>(`/api/todos/${id}`, {
      method: 'DELETE',
    });
  }

  async completeTodo(id: string, completionNote?: string) {
    return this.request<Todo>(`/api/todos/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ completionNote }),
    });
  }

  async bulkDeleteTodos(todoIds: string[]) {
    return this.request<{ deletedCount: number; message: string }>('/api/todos/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ todoIds }),
    });
  }

  async getStats() {
    return this.request<TodoStats>('/api/todos/stats');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);