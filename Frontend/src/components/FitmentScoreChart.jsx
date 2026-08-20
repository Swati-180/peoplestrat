import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const mockData = [
  { name: "Excellent (90-100)", value: 25, color: "hsl(var(--chart-1))" },
  { name: "Good (75-89)", value: 42, color: "hsl(var(--chart-2))" },
  { name: "Average (60-74)", value: 28, color: "hsl(var(--chart-4))" },
  { name: "Below Average (<60)", value: 5, color: "hsl(var(--destructive))" },
];

export function FitmentScoreChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Employee Fitment Distribution</CardTitle>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={mockData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {mockData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />

            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
