import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { Task, TaskStatus, NewTask, UpdateTask } from "@/types";

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  addTask: (task: NewTask) => Promise<Task | null>;
  updateTask: (id: string, updates: UpdateTask) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus, newOrder: number) => Promise<void>;
  reorderTasks: (status: TaskStatus, taskIds: string[]) => Promise<void>;

  // Optimistic updates
  setTasks: (tasks: Task[]) => void;
  optimisticUpdate: (taskId: string, updates: Partial<Task>) => void;

  // Real-time
  subscribeToChanges: () => () => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    const supabase = createClient();

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("order", { ascending: true });

    if (error) {
      set({ error: error.message, isLoading: false });
      return;
    }

    set({ tasks: data as Task[], isLoading: false });
  },

  addTask: async (newTask: NewTask) => {
    const supabase = createClient();

    // Get max order for the status
    const tasksInColumn = get().tasks.filter((t) => t.status === newTask.status);
    const maxOrder = tasksInColumn.length > 0 
      ? Math.max(...tasksInColumn.map((t) => t.order)) 
      : -1;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        ...newTask,
        order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) {
      set({ error: error.message });
      return null;
    }

    set((state) => ({ tasks: [...state.tasks, data as Task] }));
    return data as Task;
  },

  updateTask: async (id: string, updates: UpdateTask) => {
    const supabase = createClient();

    // Optimistic update
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      ),
    }));

    const { error } = await supabase
      .from("tasks")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      // Rollback on error
      set({ tasks: previousTasks, error: error.message });
    }
  },

  deleteTask: async (id: string) => {
    const supabase = createClient();

    // Optimistic delete
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      // Rollback on error
      set({ tasks: previousTasks, error: error.message });
    }
  },

  moveTask: async (taskId: string, newStatus: TaskStatus, newOrder: number) => {
    const supabase = createClient();

    // Optimistic update
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, order: newOrder, updated_at: new Date().toISOString() }
          : t
      ),
    }));

    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus, order: newOrder, updated_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) {
      set({ tasks: previousTasks, error: error.message });
    }
  },

  reorderTasks: async (status: TaskStatus, taskIds: string[]) => {
    const supabase = createClient();

    // Optimistic update
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) => {
        const newIndex = taskIds.indexOf(t.id);
        if (newIndex !== -1 && t.status === status) {
          return { ...t, order: newIndex };
        }
        return t;
      }),
    }));

    // Batch update
    const updates = taskIds.map((id, index) => ({
      id,
      order: index,
      updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from("tasks")
        .update({ order: update.order, updated_at: update.updated_at })
        .eq("id", update.id);

      if (error) {
        set({ tasks: previousTasks, error: error.message });
        return;
      }
    }
  },

  setTasks: (tasks: Task[]) => set({ tasks }),

  optimisticUpdate: (taskId: string, updates: Partial<Task>) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));
  },

  subscribeToChanges: () => {
    const supabase = createClient();

    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTask = payload.new as Task;
            set((state) => {
              // Avoid duplicates
              if (state.tasks.find((t) => t.id === newTask.id)) {
                return state;
              }
              return { tasks: [...state.tasks, newTask] };
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedTask = payload.new as Task;
            set((state) => ({
              tasks: state.tasks.map((t) =>
                t.id === updatedTask.id ? updatedTask : t
              ),
            }));
          } else if (payload.eventType === "DELETE") {
            const deletedTask = payload.old as { id: string };
            set((state) => ({
              tasks: state.tasks.filter((t) => t.id !== deletedTask.id),
            }));
          }
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
