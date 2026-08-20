import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const mockData = [
  { name: "Jan", completed: 45, pending: 12, overdue: 3 },
  { name: "Feb", completed: 52, pending: 8, overdue: 2 },
  { name: "Mar", completed: 48, pending: 15, overdue: 5 },
  { name: "Apr", completed: 61, pending: 10, overdue: 1 },
  { name: "May", completed: 55, pending: 14, overdue: 4 },
  { name: "Jun", completed: 67, pending: 9, overdue: 2 }
];

export function WorkDistributionChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Work Distribution</CardTitle>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />

            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px"
              }}
            />

            <Legend />

            <Bar dataKey="completed" fill="hsl(var(--chart-1))" name="Completed" />
            <Bar dataKey="pending" fill="hsl(var(--chart-4))" name="Pending" />
            <Bar dataKey="overdue" fill="hsl(var(--destructive))" name="Overdue" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
