import { FilterState } from "@/pages/home-page";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type TaskFiltersProps = {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
};

export default function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={filters.category ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                category: value === "all" ? null : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Work">Work</SelectItem>
              <SelectItem value="Study">Study</SelectItem>
              <SelectItem value="Personal">Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.completed === null ? "all" : filters.completed.toString()}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                completed:
                  value === "all"
                    ? null
                    : value === "true"
                    ? true
                    : false,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="false">Active</SelectItem>
              <SelectItem value="true">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
