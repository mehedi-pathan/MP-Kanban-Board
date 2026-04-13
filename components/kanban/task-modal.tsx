"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, TaskStatus } from "@/types";
import { TEAM_USERS } from "@/lib/team-users";

const UNASSIGNED_USER = "__unassigned__";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: {
    title: string;
    description: string;
    assigned_user: string;
    status?: TaskStatus;
  }) => void;
  task?: Task | null;
  defaultStatus?: TaskStatus | null;
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  defaultStatus,
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedUser, setAssignedUser] = useState("");
  const isAddingTask = !task;
  const isUnassignedSelection = assignedUser === UNASSIGNED_USER;

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setAssignedUser(task.assigned_user || UNASSIGNED_USER);
    } else {
      setTitle("");
      setDescription("");
      setAssignedUser(UNASSIGNED_USER);
    }
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (isAddingTask && isUnassignedSelection) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      assigned_user:
        assignedUser === UNASSIGNED_USER ? "" : assignedUser.trim(),
      status: defaultStatus || task?.status,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_user">Assigned To</Label>
            <Select value={assignedUser} onValueChange={setAssignedUser}>
              <SelectTrigger id="assigned_user" className="w-full">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED_USER}>Unassigned</SelectItem>
                {TEAM_USERS.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAddingTask && isUnassignedSelection && (
              <p className="text-xs text-destructive">
                Please select an assignee for new tasks.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || (isAddingTask && isUnassignedSelection)}
            >
              {task ? "Save Changes" : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
