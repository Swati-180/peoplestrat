import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical, Edit, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockEmployees = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "Senior Developer",
    department: "Engineering",
    email: "sarah.j@company.com",
    fitmentScore: 92,
    status: "active",
  },
  {
    id: "2",
    name: "Mike Chen",
    role: "Product Manager",
    department: "Product",
    email: "mike.c@company.com",
    fitmentScore: 88,
    status: "active",
  },
  {
    id: "3",
    name: "Emma Wilson",
    role: "UX Designer",
    department: "Design",
    email: "emma.w@company.com",
    fitmentScore: 95,
    status: "active",
  },
  {
    id: "4",
    name: "James Brown",
    role: "Data Analyst",
    department: "Analytics",
    email: "james.b@company.com",
    fitmentScore: 78,
    status: "active",
  },
  {
    id: "5",
    name: "Lisa Anderson",
    role: "HR Manager",
    department: "Human Resources",
    email: "lisa.a@company.com",
    fitmentScore: 85,
    status: "inactive",
  },
];

export function EmployeeTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [employees] = useState(mockEmployees);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-employees"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Fitment Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow
                key={employee.id}
                data-testid={`row-employee-${employee.id}`}
              >
                <TableCell className="font-medium">{employee.name}</TableCell>

                <TableCell className="text-muted-foreground">
                  {employee.role}
                </TableCell>

                <TableCell>
                  <Badge variant="secondary">{employee.department}</Badge>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {employee.email}
                </TableCell>

                <TableCell className="text-right">
                  <span className="font-mono font-semibold text-primary">
                    {employee.fitmentScore}%
                  </span>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      employee.status === "active"
                        ? "bg-green-100 text-green-800"
                        : ""
                    }
                  >
                    {employee.status}
                  </Badge>
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-actions-${employee.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => console.log("Edit", employee.id)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => console.log("Delete", employee.id)}
                        className="text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No employees found matching your search.
          </p>
        </div>
      )}
    </div>
  );
}
