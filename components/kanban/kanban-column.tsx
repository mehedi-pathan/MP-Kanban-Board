"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./task-card";
import type { Task, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  taskCreators: Record<string, string>;
  canAddTask: boolean;
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAdvanceTask: (task: Task) => void;
}

const columnColors: Record<TaskStatus, string> = {
  todo: "border-t-blue-500",
  inprogress: "border-t-amber-500",
  done: "border-t-green-500",
};

export function KanbanColumn({
  status,
  title,
  tasks,
  taskCreators,
  canAddTask,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onAdvanceTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const taskIds = tasks.map((task) => task.id);

  return (
    <div
      className={cn(
        "flex h-full min-h-[420px] w-[88vw] max-w-[22rem] shrink-0 flex-col rounded-lg border border-t-4 bg-muted/50 sm:w-80 sm:min-h-[500px]",
        columnColors[status]
      )}
    >
      <div className="p-4 flex items-center justify-between border-b bg-background/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">{title}</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        {canAddTask && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddTask(status)}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add task to {title}</span>
          </Button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-3 overflow-y-auto p-3 transition-colors",
          isOver && "bg-primary/5"
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              createdBy={taskCreators[task.id]}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onAdvanceStatus={onAdvanceTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
            No tasks yet
          </div>
        )}
      </div>
    </div>
  );
}
