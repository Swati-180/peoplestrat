import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "./EmptyState";

export const CompactTable = ({ columns, data, onRowClick, keyField = "id", emptyMessage = "No data available" }) => {
  if (!data || data.length === 0) {
    return <EmptyState description={emptyMessage} />;
  }

  return (
    <div className="border rounded-md bg-white overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            {columns.map((col, idx) => (
              <TableHead key={idx} className={`h-9 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase ${col.className || ''}`}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow 
              key={row[keyField] || rowIndex} 
              className={`hover:bg-gray-50/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col, colIndex) => (
                <TableCell key={colIndex} className={`py-2 text-sm ${col.cellClassName || ''}`}>
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

