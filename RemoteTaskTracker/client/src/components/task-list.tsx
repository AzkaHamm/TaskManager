import { useQuery, useMutation } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FilterState } from "@/pages/home-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CalendarIcon,
  Trash2Icon,
  Loader2,
  FolderIcon,
} from "lucide-react";
import { format } from "date-fns";

type TaskListProps = {
  filters: FilterState;
};

export default function TaskList({ filters }: TaskListProps) {
  const { toast } = useToast();
  
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredTasks = tasks?.filter((task) => {
    if (filters.category && task.category !== filters.category) return false;
    if (filters.completed !== null && task.completed !== filters.completed)
      return false;
    return true;
  });

  if (!filteredTasks?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground">No tasks found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredTasks.map((task) => (
        <Card key={task.id} className={task.completed ? "opacity-75" : ""}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) =>
                    updateTaskMutation.mutate({
                      id: task.id,
                      completed: checked as boolean,
                    })
                  }
                />
                <CardTitle className={task.completed ? "line-through" : ""}>
                  {task.title}
                </CardTitle>
              </div>
              <CardDescription className="mt-2">{task.description}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteTaskMutation.mutate(task.id)}
              disabled={deleteTaskMutation.isPending}
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <FolderIcon className="h-4 w-4" />
                {task.category}
              </div>
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {format(new Date(task.dueDate), "PPP")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
