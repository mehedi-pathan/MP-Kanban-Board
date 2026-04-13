"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, formatDistanceToNow } from "date-fns";
import { CalendarDays, GripVertical, Pencil, Trash2, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  createdBy?: string;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAdvanceStatus: (task: Task) => void;
  isDragging?: boolean;
}

export function TaskCard({
  task,
  createdBy,
  onEdit,
  onDelete,
  onAdvanceStatus,
  isDragging,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBeingDragged = isDragging || isSortableDragging;
  const createdDateTimeLabel = task.created_at
    ? format(new Date(task.created_at), "PPP 'at' p")
    : "Unknown date and time";
  const taskAgeLabel = task.created_at
    ? formatDistanceToNow(new Date(task.created_at), { addSuffix: true })
    : "unknown";
  const statusActionLabel =
    task.status === "todo" ? "Start" : task.status === "inprogress" ? "Done" : null;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex flex-col cursor-grab active:cursor-grabbing transition-shadow",
        isBeingDragged && "opacity-50 shadow-lg ring-2 ring-primary/20"
      )}
    >
      <CardHeader className="p-3 pb-2 flex flex-row items-start gap-2">
        <button
          className="mt-0.5 text-muted-foreground hover:text-foreground focus:outline-none"
          aria-label="Drag handle"
          type="button"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm leading-tight text-balance">
            {task.title}
          </h3>
          <p className="mt-1 text-[10px] font-medium text-muted-foreground">
            ID: {task.id.slice(0, 8)}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {createdDateTimeLabel}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                type="button"
                aria-label="Task creation date"
              >
                <CalendarDays className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              Added on {createdDateTimeLabel} ({taskAgeLabel})
            </TooltipContent>
          </Tooltip>
          {!isDragging && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onEdit(task)}
            >
              <Pencil className="h-3 w-3" />
              <span className="sr-only">Edit task</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-3 w-3" />
            <span className="sr-only">Delete task</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-3 pt-0">
        <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
          {task.description?.trim() || "No description provided."}
        </p>
        {task.assigned_user && (
          <Badge variant="secondary" className="mb-3 w-fit text-xs gap-1">
            <User className="h-3 w-3" />
            {task.assigned_user}
          </Badge>
        )}
        {createdBy && (
          <p className="mb-3 text-[11px] text-muted-foreground">
            Created by: <span className="font-medium text-foreground">{createdBy}</span>
          </p>
        )}
        {statusActionLabel && (
          <div className="mt-auto pt-2">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-full rounded-md bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20"
              onClick={() => onAdvanceStatus(task)}
            >
              {statusActionLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
