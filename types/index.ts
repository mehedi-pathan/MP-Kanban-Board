// Column status type - matches database constraint
export type TaskStatus = 'todo' | 'inprogress' | 'done';

// Task interface matching Supabase schema
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_user: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

// New task for creation
export interface NewTask {
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_user?: string | null;
}

// Update task
export interface UpdateTask {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  assigned_user?: string | null;
}
