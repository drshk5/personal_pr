import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { LeadsBySource, LeadsByStatus } from "@/types/crm/dashboard.types";

interface LeadsDistributionChartProps {
  sourceData: LeadsBySource[];
  statusData: LeadsByStatus[];
}

const SOURCE_COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f59e0b", // Orange
  "#10b981", // Green
  "#6366f1", // Indigo
  "#f43f5e", // Rose
];

const STATUS_COLORS = [
  "#10b981", // Green - Qualified
  "#3b82f6", // Blue - Contacted
  "#f59e0b", // Orange - New
  "#ef4444", // Red - Unqualified
  "#6366f1", // Indigo - Converted
];

export function LeadsDistributionChart({
  sourceData,
  statusData,
}: LeadsDistributionChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold">{data.name}</p>
          <p className="text-sm text-gray-600">Count: {data.value}</p>
          <p className="text-xs text-gray-500">
            {((data.value / data.payload.total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const totalSource = sourceData.reduce((sum, item) => sum + item.intCount, 0);
  const totalStatus = statusData.reduce((sum, item) => sum + item.intCount, 0);

  const sourceChartData = sourceData.map((item) => ({
    name: item.strSource,
    value: item.intCount,
    total: totalSource,
  }));

  const statusChartData = statusData.map((item) => ({
    name: item.strStatus,
    value: item.intCount,
    total: totalStatus,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Leads by Source */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={sourceChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sourceChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={SOURCE_COLORS[index % SOURCE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Leads by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
