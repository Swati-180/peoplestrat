import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "./EmptyState";

export const CompactTable = ({
  columns,
  data,
  onRowClick,
  keyField = "id",
  emptyMessage = "No data available",
  minWidth = "min-w-[760px]"
}) => {
  if (!data || data.length === 0) {
    return <EmptyState description={emptyMessage} />;
  }

  return (
    <div className="compact-table-container w-full max-w-full min-w-0 overflow-x-auto rounded-lg border border-slate-200/90 bg-white shadow-xs">
      <Table className={minWidth}>
        <TableHeader className="bg-slate-50 border-b border-slate-200">
          <TableRow className="hover:bg-transparent">
            {columns.map((col, idx) => (
              <TableHead key={idx} className={`h-10 py-2.5 px-3.5 text-xs font-semibold tracking-wider text-slate-600 uppercase whitespace-nowrap ${col.className || ''}`}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100">
          {data.map((row, rowIndex) => (
            <TableRow 
              key={row[keyField] || rowIndex} 
              className={`hover:bg-slate-50/70 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col, colIndex) => (
                <TableCell key={colIndex} className={`py-3 px-3.5 text-sm align-middle ${col.cellClassName || ''}`}>
                  {col.cell ? col.cell(row) : row[col.accessorKey]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

