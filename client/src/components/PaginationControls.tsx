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

  if (totalPages === 0) {
    return (
      <div className="flex justify-center mt-4 text-muted-foreground">
        No data available
      </div>
    );
  }


  return (
    <div className="flex justify-center gap-2 mt-4">
      <Button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        variant="outline"
      >
        Previous
      </Button>
      <span className="self-center">
        Page {page} of {totalPages}
      </span>
      <Button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        variant="outline"
      >
        Next
      </Button>
    </div>
  );
};