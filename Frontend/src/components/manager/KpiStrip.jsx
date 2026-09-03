import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export const KpiStrip = ({ items }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
      {items.map((item, index) => (
        <Card key={index} className="shadow-sm border-gray-100">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <p className="text-sm font-medium text-gray-500 mb-1">{item.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-gray-900">{item.value}</h3>
              {item.trend && (
                <span className={`text-xs font-medium ${item.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.trend > 0 ? '+' : ''}{item.trend}%
                </span>
              )}
            </div>
            {item.subtext && <p className="text-xs text-gray-400 mt-1">{item.subtext}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
