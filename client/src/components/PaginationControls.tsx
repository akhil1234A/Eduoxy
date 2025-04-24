import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  total,
  page,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const maxVisiblePages = 5;

  if (totalPages === 0) {
    return (
      <div className="flex justify-center mt-4 text-muted-foreground">
        No data available
      </div>
    );
  }

  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-auto pt-6">
      <Button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        variant="outline"
        size="sm"
        className="rounded-md hover:bg-primary-100 hover:text-primary-750 transition-colors"
      >
        Previous
      </Button>
      {getPageNumbers().map((pageNum) => (
        <Button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          variant={pageNum === page ? "default" : "outline"}
          size="sm"
          className={`rounded-md ${
            pageNum === page
              ? "bg-primary-750 text-primary-foreground"
              : "hover:bg-primary-100 hover:text-primary-750"
          } transition-colors`}
        >
          {pageNum}
        </Button>
      ))}
      <Button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        variant="outline"
        size="sm"
        className="rounded-md hover:bg-primary-100 hover:text-primary-750 transition-colors"
      >
        Next
      </Button>
    </div>
  );
};