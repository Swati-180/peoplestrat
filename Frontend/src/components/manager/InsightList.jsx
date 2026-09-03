import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { StatusBadge } from './StatusBadge';
import { EmptyState } from './EmptyState';

export const InsightList = ({ title = "Attention Required", insights, onActionClick }) => {
  return (
    <Card className="mb-6 shadow-sm border-gray-100">
      <CardHeader className="pb-3 border-b border-gray-50">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!insights || insights.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No items require attention" description="Everything is looking good right now." icon="check" />
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {insights.map((insight, idx) => (
              <li key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                <div className="mb-3 sm:mb-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-gray-900 text-sm">{insight.title}</span>
                    {insight.badge && (
                      <StatusBadge status={insight.badge.text} type={insight.badge.type} />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 max-w-2xl">{insight.description}</p>
                </div>
                {onActionClick && insight.actionPayload && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs self-start sm:self-center h-8"
                    onClick={() => onActionClick(insight.actionPayload)}
                  >
                    View details <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
