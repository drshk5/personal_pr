import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Target, DollarSign, TrendingUp } from "lucide-react";
import type { OpportunityListDtoForContact } from "@/types/CRM/contact";

interface ContactOpportunitiesTabProps {
  contactId: string;
  opportunities: OpportunityListDtoForContact[];
  canEdit: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-blue-500",
  Won: "bg-green-500",
  Lost: "bg-red-500",
};

export default function ContactOpportunitiesTab({
  opportunities,
}: ContactOpportunitiesTabProps) {
  const navigate = useNavigate();

  const totalValue = opportunities.reduce((sum, o) => sum + (o.dblAmount || 0), 0);
  const wonOpps = opportunities.filter((o) => o.strStatus === "Won");

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Opportunities
                </p>
                <h3 className="text-2xl font-bold text-foreground">{opportunities.length}</h3>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Value
                </p>
                <h3 className="text-2xl font-bold text-foreground">
                  ${totalValue.toLocaleString()}
                </h3>
              </div>
              <DollarSign className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Win Rate
                </p>
                <h3 className="text-2xl font-bold text-foreground">
                  {opportunities.length > 0
                    ? Math.round(
                        (wonOpps.length /
                          (wonOpps.length +
                            opportunities.filter((o) => o.strStatus === "Lost")
                              .length || 1)) *
                          100
                      )
                    : 0}
                  %
                </h3>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Opportunities ({opportunities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {opportunities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No opportunities linked to this contact yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity Name</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((opp) => (
                  <TableRow key={opp.strOpportunityGUID}>
                    <TableCell className="font-medium">
                      {opp.strOpportunityName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{opp.strStageName}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          STATUS_COLORS[opp.strStatus] || "bg-gray-500"
                        } text-white`}
                      >
                        {opp.strStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {opp.dblAmount
                        ? `${opp.strCurrency} ${opp.dblAmount.toLocaleString()}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate(
                            `/crm/opportunities/${opp.strOpportunityGUID}`
                          )
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
