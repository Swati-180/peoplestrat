import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalRecords, 
  pageSize, 
  onPageChange 
}) => {
  if (totalRecords <= pageSize) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="flex items-center justify-between px-2 py-4 text-sm text-[#64748B]">
      <div>
        Showing <span className="font-medium text-[#0F172A]">{startRecord}–{endRecord}</span> of <span className="font-medium text-[#0F172A]">{totalRecords}</span>
      </div>
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="text-[#64748B] hover:text-[#0F172A]"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="font-medium text-[#0F172A]">
          Page {currentPage} of {totalPages}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          className="text-[#64748B] hover:text-[#0F172A]"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
