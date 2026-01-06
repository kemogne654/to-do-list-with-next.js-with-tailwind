# Backend Requirements for Todo Dashboard

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Todos Table
```sql
CREATE TABLE todos (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('Personal', 'Work', 'Shopping', 'Health', 'Other') NOT NULL,
  priority ENUM('low', 'medium', 'high') NOT NULL,
  status ENUM('pending', 'in-process', 'completed') DEFAULT 'pending',
  due_date DATE,
  completion_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |

### Todos Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | Get all user todos with filters |
| POST | `/api/todos` | Create new todo |
| PUT | `/api/todos/:id` | Update existing todo |
| DELETE | `/api/todos/:id` | Delete single todo |
| DELETE | `/api/todos/bulk` | Delete multiple todos |
| PATCH | `/api/todos/:id/complete` | Mark todo as complete |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos/stats` | Get dashboard statistics |

## Request/Response Examples

### Authentication

#### Login
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

#### Register
```json
POST /api/auth/register
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123"
}
```

### Todo Operations

#### Create Todo
```json
POST /api/todos
{
  "title": "Complete project",
  "description": "Finish the todo dashboard",
  "category": "Work",
  "priority": "high",
  "due_date": "2024-12-31"
}

Response:
{
  "id": "todo_id",
  "title": "Complete project",
  "description": "Finish the todo dashboard",
  "category": "Work",
  "priority": "high",
  "status": "pending",
  "due_date": "2024-12-31",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Get Todos with Filters
```json
GET /api/todos?status=pending&category=Work

Response:
{
  "todos": [
    {
      "id": "todo_id",
      "title": "Complete project",
      "description": "Finish the todo dashboard",
      "category": "Work",
      "priority": "high",
      "status": "pending",
      "due_date": "2024-12-31",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### Complete Todo
```json
PATCH /api/todos/:id/complete
{
  "completion_note": "Project completed successfully"
}

Response:
{
  "id": "todo_id",
  "status": "completed",
  "completion_note": "Project completed successfully",
  "completed_at": "2024-01-15T10:30:00Z"
}
```

#### Bulk Delete
```json
DELETE /api/todos/bulk
{
  "todo_ids": ["id1", "id2", "id3"]
}

Response:
{
  "deleted_count": 3,
  "message": "Todos deleted successfully"
}
```

### Analytics

#### Get Statistics
```json
GET /api/todos/stats

Response:
{
  "total": 25,
  "completed": 15,
  "pending": 8,
  "inProcess": 2,
  "overdue": 3,
  "categories": {
    "Personal": 8,
    "Work": 12,
    "Shopping": 3,
    "Health": 2,
    "Other": 0
  },
  "priorities": {
    "low": 5,
    "medium": 12,
    "high": 8
  }
}
```

## Query Parameters

### Get Todos Filters
- `status`: Filter by status (pending, in-process, completed)
- `category`: Filter by category (Personal, Work, Shopping, Health, Other)
- `priority`: Filter by priority (low, medium, high)
- `overdue`: Filter overdue todos (true/false)
- `limit`: Number of todos per page
- `offset`: Pagination offset

## Authentication
- Use JWT tokens for authentication
- Include `Authorization: Bearer <token>` header in protected routes
- Token should contain user ID and expiration

## Error Responses
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400
}
```

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Required Environment Variables
```
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=3001
NODE_ENV=development
```

This backend specification aligns with all frontend functionality including user authentication, todo CRUD operations, filtering, bulk actions, and analytics dashboard.