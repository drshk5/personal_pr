import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TopOpportunity } from "@/types/crm/dashboard.types";
import { Building2, TrendingUp } from "lucide-react";

interface TopOpportunitiesListProps {
  data: TopOpportunity[];
}

export function TopOpportunitiesList({ data }: TopOpportunitiesListProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No opportunities found
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((opp, index) => (
            <div
              key={opp.strOpportunityGUID}
              className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm leading-none">
                    {opp.strOpportunityName}
                  </p>
                  {opp.strAccountName && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {opp.strAccountName}
                    </p>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {opp.strStageName}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-green-600">
                  ₹{opp.dblAmount?.toLocaleString("en-IN") || "0"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
