import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface TaskCounterCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  isLoading: boolean;
  error: boolean;
  onClick?: () => void;
}

export const TaskCounterCard: React.FC<TaskCounterCardProps> = ({
  title,
  value,
  icon,
  isLoading,
  error,
  onClick,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isLoading || error) return;

    setDisplayValue(0);

    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(increment * currentStep));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, isLoading, error]);

  return (
    <Card
      className={`group relative overflow-hidden border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 h-full min-h-30 md:min-h-35 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-linear-to-br from-primary/2 via-transparent to-secondary/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200">
          {title}
        </CardTitle>
        <div className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-200">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative pt-0 flex-1 flex items-end">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-20 bg-muted/50" />
          </div>
        ) : error ? (
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xl font-semibold">--</span>
          </div>
        ) : (
          <div className="text-2xl md:text-3xl font-bold tracking-tight text-foreground group-hover:scale-105 transition-transform duration-200">
            {displayValue.toLocaleString()}
          </div>
        )}
      </CardContent>

      <div className="absolute top-0 right-0 w-16 h-16 bg-linear-to-br from-primary/10 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Card>
  );
};
