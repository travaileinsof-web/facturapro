import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={cn("flex items-center justify-between px-2 py-4 border-t border-[var(--border)]", className)}>
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
        >
          Précédent
        </Button>
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
        >
          Suivant
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--foreground-muted)]">
            Page <span className="font-medium text-[var(--foreground)]">{currentPage}</span> sur <span className="font-medium text-[var(--foreground)]">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-l-md rounded-r-none border-r-0"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Précédent</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {getPages().map((page, i) => (
              page === '...' ? (
                <span key={`dots-${i}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-[var(--foreground-muted)] ring-1 ring-inset ring-[var(--border)] focus:outline-offset-0">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              ) : (
                <Button
                  key={`page-${page}`}
                  variant={currentPage === page ? "default" : "outline"}
                  className={cn(
                    "rounded-none first-of-type:rounded-l-md last-of-type:rounded-r-md min-w-[32px]",
                    currentPage !== page && "border-r-0"
                  )}
                  onClick={() => typeof page === 'number' && onPageChange(page)}
                >
                  {page}
                </Button>
              )
            ))}

            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-r-md rounded-l-none"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Suivant</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}
