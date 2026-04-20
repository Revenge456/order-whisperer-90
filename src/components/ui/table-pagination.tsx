import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string; // e.g. "clientes"
}

export function TablePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  itemLabel = "registros",
}: TablePaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const goFirst = () => onPageChange(1);
  const goPrev = () => onPageChange(Math.max(1, page - 1));
  const goNext = () => onPageChange(Math.min(totalPages, page + 1));
  const goLast = () => onPageChange(totalPages);

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          Mostrando <span className="font-medium text-foreground">{from.toLocaleString('es-BO')}-{to.toLocaleString('es-BO')}</span> de{" "}
          <span className="font-medium text-foreground">{total.toLocaleString('es-BO')}</span> {itemLabel}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">Filas por página</span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goFirst}
            disabled={isFirst}
            aria-label="Primera página"
            title="Primera página"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goPrev}
            disabled={isFirst}
            aria-label="Página anterior"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm px-3 min-w-[110px] text-center">
            Página <span className="font-medium text-foreground">{page}</span> de{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goNext}
            disabled={isLast}
            aria-label="Página siguiente"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goLast}
            disabled={isLast}
            aria-label="Última página"
            title="Última página"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
