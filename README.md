# Advanced Todo Dashboard with Next.js and Tailwind CSS

A comprehensive todo management dashboard built with Next.js 16 and Tailwind CSS featuring advanced task organization and analytics.

## Features

### 📝 **Create Tab**
- Add todos with title, description, category, priority, and due date
- Form validation and reset functionality
- Rich todo creation with multiple fields

### 📋 **List Tab**
- View all todos with advanced filtering
- Filter by status (all/pending/completed) and category
- Inline editing with save/cancel options
- Visual priority indicators and due date tracking
- Overdue task highlighting

### 📊 **Analytics Tab**
- Real-time statistics dashboard
- Total, completed, pending, and overdue counters
- Category breakdown with progress bars
- Priority distribution visualization

### 🎯 **Advanced Features**
- **Categories**: Personal, Work, Shopping, Health, Other
- **Priorities**: Low, Medium, High with color coding
- **Due Dates**: Track deadlines and overdue tasks
- **Descriptions**: Optional detailed task descriptions
- **Smart Filtering**: Multi-criteria filtering system
- **Visual Indicators**: Color-coded priorities and status

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with hooks
- **Tailwind CSS 4** - Utility-first CSS framework
- **TypeScript** - Full type safety

## Getting Started

1. Navigate to the project directory:
   ```bash
   cd todo-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Guide

### Creating Todos
1. Go to the **Create** tab
2. Fill in the title (required)
3. Select category and priority
4. Add optional description and due date
5. Click "Create Todo"

### Managing Todos
1. Go to the **List** tab
2. Use filters to find specific todos
3. Check boxes to mark as complete
4. Click "Edit" to modify todos inline
5. Click "Delete" to remove todos

### Viewing Analytics
1. Go to the **Analytics** tab
2. View overview statistics
3. Check category distribution
4. Monitor priority breakdown

## Dashboard Structure

```
Todo Dashboard/
├── Create Tab/
│   ├── Title Input (required)
│   ├── Category Selection
│   ├── Priority Selection
│   ├── Due Date Picker
│   └── Description Textarea
├── List Tab/
│   ├── Status Filter (all/pending/completed)
│   ├── Category Filter
│   ├── Todo Cards with:
│   │   ├── Checkbox for completion
│   │   ├── Title and description
│   │   ├── Category, priority, due date badges
│   │   └── Edit/Delete actions
└── Analytics Tab/
    ├── Statistics Cards
    ├── Category Breakdown
    └── Priority Distribution
```

## Key Components

- **Dashboard Navigation**: Tab-based interface
- **Todo Form**: Comprehensive creation form
- **Todo List**: Filtered and sortable list view
- **Analytics**: Visual statistics and breakdowns
- **Filters**: Multi-criteria filtering system

## Deployment

Build for production:
```bash
npm run build
npm start
```

Deploy to Vercel:
```bash
npx vercel
```

## Features Showcase

- ✅ **Full CRUD Operations**
- 🏷️ **Category Management**
- ⚡ **Priority Levels**
- 📅 **Due Date Tracking**
- 🔍 **Advanced Filtering**
- 📈 **Real-time Analytics**
- 🎨 **Responsive Design**
- ⌨️ **Keyboard Support**