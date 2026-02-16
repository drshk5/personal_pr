import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import type { PipelineStageSummary } from "@/types/crm/dashboard.types";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PipelineFunnelChartProps {
  data: PipelineStageSummary[];
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"];

export function PipelineFunnelChart({ data }: PipelineFunnelChartProps) {
  const chartData = data.map((stage, index) => ({
    name: stage.strStageName,
    value: stage.dblTotalValue,
    count: stage.intCount,
    rotting: stage.intRottingCount,
    color: COLORS[index % COLORS.length],
  }));

  const totalValue = data.reduce((sum, stage) => sum + stage.dblTotalValue, 0);
  const totalRotting = data.reduce((sum, stage) => sum + stage.intRottingCount, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-sm">{data.name}</p>
          <p className="text-sm text-blue-600">
            Value: ₹{data.value.toLocaleString("en-IN")}
          </p>
          <p className="text-sm text-gray-600">
            Count: {data.count} deals
          </p>
          {data.rotting > 0 && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Rotting: {data.rotting}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pipeline Funnel</CardTitle>
            <CardDescription>
              Total Pipeline: ₹{totalValue.toLocaleString("en-IN")}
            </CardDescription>
          </div>
          {totalRotting > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {totalRotting} Rotting Deals
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="value" name="Pipeline Value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
