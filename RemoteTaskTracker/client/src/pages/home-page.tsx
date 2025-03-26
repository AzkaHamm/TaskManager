import { useAuth } from "@/hooks/use-auth";
import TaskForm from "@/components/task-form";
import TaskList from "@/components/task-list";
import TaskFilters from "@/components/task-filters";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export type FilterState = {
  category: string | null;
  completed: boolean | null;
};

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    completed: null,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Task Manager</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Welcome, {user?.username}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
          <div className="space-y-8">
            <TaskForm />
            <TaskFilters filters={filters} onFiltersChange={setFilters} />
          </div>
          <TaskList filters={filters} />
        </div>
      </main>
    </div>
  );
}
