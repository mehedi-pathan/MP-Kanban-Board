"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import { TaskModal } from "./task-modal";
import { useTaskStore } from "@/store/task-store";
import type { Task, TaskStatus } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TEAM_CREDENTIALS, TEAM_USERS } from "@/lib/team-users";

const SESSION_USER_KEY = "mp-kanban-session-user";
const TASK_CREATOR_KEY = "mp-kanban-task-creators";

const columns: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "To Do" },
  { status: "inprogress", title: "In Progress" },
  { status: "done", title: "Done" },
];

export function KanbanBoard() {
  const {
    tasks,
    isLoading,
    fetchTasks,
    moveTask,
    reorderTasks,
    addTask,
    updateTask,
    deleteTask,
    subscribeToChanges,
  } = useTaskStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [addingToStatus, setAddingToStatus] = useState<TaskStatus | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [taskCreators, setTaskCreators] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTasks();
    const unsubscribe = subscribeToChanges();
    return () => unsubscribe();
  }, [fetchTasks, subscribeToChanges]);

  useEffect(() => {
    const savedUsername = window.localStorage.getItem(SESSION_USER_KEY);
    if (!savedUsername) return;
    const matchedUser = TEAM_CREDENTIALS.find(
      (user) => user.username === savedUsername
    );
    if (matchedUser) {
      setCurrentUserName(matchedUser.name);
    }

    const savedTaskCreators = window.localStorage.getItem(TASK_CREATOR_KEY);
    if (savedTaskCreators) {
      try {
        setTaskCreators(JSON.parse(savedTaskCreators) as Record<string, string>);
      } catch {
        setTaskCreators({});
      }
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => {
      return tasks
        .filter((task) => task.status === status)
        .sort((a, b) => a.order - b.order);
    },
    [tasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if over a column
    const overStatus = columns.find((col) => col.status === over.id)?.status;
    if (overStatus && activeTask.status !== overStatus) {
      // Moving to a different column
      const targetTasks = getTasksByStatus(overStatus);
      moveTask(activeTask.id, overStatus, targetTasks.length);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if dropped on a column
    const overStatus = columns.find((col) => col.status === over.id)?.status;
    if (overStatus) {
      const targetTasks = getTasksByStatus(overStatus);
      moveTask(activeTask.id, overStatus, targetTasks.length);
      return;
    }

    // Check if dropped on another task
    const overTask = tasks.find((t) => t.id === over.id);
    if (!overTask) return;

    if (activeTask.status === overTask.status) {
      // Reordering within the same column
      const columnTasks = getTasksByStatus(activeTask.status);
      const oldIndex = columnTasks.findIndex((t) => t.id === active.id);
      const newIndex = columnTasks.findIndex((t) => t.id === over.id);

      if (oldIndex !== newIndex) {
        const newOrder = arrayMove(columnTasks, oldIndex, newIndex);
        reorderTasks(
          activeTask.status,
          newOrder.map((t) => t.id)
        );
      }
    } else {
      // Moving to a different column at a specific position
      const targetTasks = getTasksByStatus(overTask.status);
      const targetIndex = targetTasks.findIndex((t) => t.id === over.id);
      moveTask(activeTask.id, overTask.status, targetIndex);
    }
  };

  const handleAddTask = (status: TaskStatus) => {
    setAddingToStatus(status);
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setAddingToStatus(null);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const handleAdvanceTask = async (task: Task) => {
    if (task.status === "todo") {
      const targetTasks = getTasksByStatus("inprogress");
      await moveTask(task.id, "inprogress", targetTasks.length);
      return;
    }

    if (task.status === "inprogress") {
      const targetTasks = getTasksByStatus("done");
      await moveTask(task.id, "done", targetTasks.length);
    }
  };

  const handleSaveTask = async (taskData: {
    title: string;
    description: string;
    assigned_user: string;
    status?: TaskStatus;
  }) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else if (addingToStatus) {
      const createdTask = await addTask({
        title: taskData.title,
        description: taskData.description || null,
        assigned_user: taskData.assigned_user || null,
        status: addingToStatus,
      });
      if (createdTask && currentUserName) {
        setTaskCreators((prev) => {
          const updated = { ...prev, [createdTask.id]: currentUserName };
          window.localStorage.setItem(TASK_CREATOR_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    }
    setIsModalOpen(false);
    setEditingTask(null);
    setAddingToStatus(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUsername = loginUsername.trim().toLowerCase();
    const matchedUser = TEAM_CREDENTIALS.find(
      (user) =>
        user.username.toLowerCase() === normalizedUsername &&
        user.password === loginPassword
    );

    if (!matchedUser) {
      setAuthError("Invalid username or password.");
      return;
    }

    setCurrentUserName(matchedUser.name);
    window.localStorage.setItem(SESSION_USER_KEY, matchedUser.username);
    setAuthError("");
    setLoginUsername("");
    setLoginPassword("");
  };

  const handleLogout = () => {
    setCurrentUserName(null);
    window.localStorage.removeItem(SESSION_USER_KEY);
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!currentUserName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-background shadow-sm">
              <Image
                src="/favicon-32x32.png"
                alt="MP Kanban Board logo"
                width={32}
                height={32}
                priority
              />
            </div>
          </div>
          <h1 className="text-xl font-bold">MP Kanban Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Multi-user simulation login
          </p>

          <form onSubmit={handleLogin} className="mt-5 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Username</label>
              <Input
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Enter username"
                className="placeholder:opacity-60"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Password</label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            {authError && <p className="text-xs text-destructive">{authError}</p>}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>

          <div className="mt-5 rounded-md border bg-muted/40 p-3">
            <p className="text-xs font-semibold">Kanban Users (fixed credentials)</p>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              {TEAM_CREDENTIALS.map((user) => (
                <p key={user.username}>
                  {user.name} - {user.username} / {user.password}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">MP Kanban Board</h1>
            <p className="text-sm text-muted-foreground">Organize your workflow</p>
          </div>
          <Button
            className="btn-soft-glow w-full rounded-md bg-blue-600 px-4 text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-blue-300/50 sm:w-auto"
            onClick={() => handleAddTask("todo")}
          >
            Add New Task
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge className="text-xs" variant="default">
            Signed in as: {currentUserName}
          </Badge>
          <Button size="sm" variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">View/Edit Users:</span>
          {TEAM_USERS.map((user) => (
            <Badge key={user} variant="secondary" className="text-xs">
              {user}
            </Badge>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-4 sm:p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full gap-4 pb-2 sm:gap-6">
            {columns.map((column) => (
              <KanbanColumn
                key={column.status}
                status={column.status}
                title={column.title}
                tasks={getTasksByStatus(column.status)}
                taskCreators={taskCreators}
                canAddTask={column.status === "todo"}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onAdvanceTask={handleAdvanceTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                createdBy={taskCreators[activeTask.id]}
                onEdit={() => {}}
                onDelete={() => {}}
                onAdvanceStatus={() => {}}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      <footer className="border-t bg-background/80 px-4 py-3 sm:px-6">
        <p className="text-center text-xs text-muted-foreground">
          Designed and developed by{" "}
          <a
            href="https://mehedipathan.online"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            Mehedi Pathan
          </a>
        </p>
      </footer>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
          setAddingToStatus(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
        defaultStatus={addingToStatus}
      />
    </div>
  );
}
