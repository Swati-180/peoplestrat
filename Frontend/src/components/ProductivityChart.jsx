import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const mockData = [
  { month: "Jan", productivity: 78, target: 75 },
  { month: "Feb", productivity: 82, target: 75 },
  { month: "Mar", productivity: 79, target: 80 },
  { month: "Apr", productivity: 85, target: 80 },
  { month: "May", productivity: 88, target: 85 },
  { month: "Jun", productivity: 92, target: 85 },
];

export function ProductivityChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Productivity Trend</CardTitle>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />

            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />

            <Legend />

            <Line
              type="monotone"
              dataKey="productivity"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              name="Actual Productivity"
            />

            <Line
              type="monotone"
              dataKey="target"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Target"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
