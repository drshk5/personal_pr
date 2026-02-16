import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { RevenueByMonth } from "@/types/crm/dashboard.types";
import { TrendingUp, TrendingDown } from "lucide-react";

interface RevenueTrendChartProps {
  data: RevenueByMonth[];
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const totalWon = data.reduce((sum, month) => sum + month.dblWonAmount, 0);
  const totalLost = data.reduce((sum, month) => sum + month.dblLostAmount, 0);
  const netRevenue = totalWon - totalLost;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-sm">{payload[0].payload.strMonth}</p>
          <p className="text-sm text-green-600">
            Won: ₹{payload[0].value.toLocaleString("en-IN")}
          </p>
          <p className="text-sm text-red-600">
            Lost: ₹{payload[1].value.toLocaleString("en-IN")}
          </p>
          <p className="text-sm text-blue-600 font-medium mt-1">
            Net: ₹{(payload[0].value - payload[1].value).toLocaleString("en-IN")}
          </p>
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
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Won vs Lost Revenue (Last 12 Months)</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {netRevenue > 0 ? (
              <div className="flex items-center text-green-600 text-sm font-medium">
                <TrendingUp className="h-4 w-4 mr-1" />
                +₹{netRevenue.toLocaleString("en-IN")}
              </div>
            ) : (
              <div className="flex items-center text-red-600 text-sm font-medium">
                <TrendingDown className="h-4 w-4 mr-1" />
                ₹{Math.abs(netRevenue).toLocaleString("en-IN")}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="strMonth" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="dblWonAmount"
              name="Won Revenue"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorWon)"
            />
            <Area
              type="monotone"
              dataKey="dblLostAmount"
              name="Lost Revenue"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorLost)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
