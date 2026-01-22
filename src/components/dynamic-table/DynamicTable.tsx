import { useState } from 'react';
import { Plus, Search, Settings2, Columns, Eye, EyeOff, MoreHorizontal, MessageCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { 
  useColumnDefinitions, 
  useUpdateColumn, 
  useDeleteColumn,
  type ModuleKey,
  type ColumnDefinition 
} from '@/hooks/useColumnDefinitions';
import { useIsAdmin } from '@/hooks/useAuth';
import { CellRenderer } from './CellRenderer';
import { ColumnHeader } from './ColumnHeader';
import { ColumnEditor } from './ColumnEditor';
import { cn } from '@/lib/utils';

interface DynamicTableProps<T extends Record<string, unknown>> {
  moduleKey: ModuleKey;
  data: T[];
  isLoading: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  customActions?: (row: T) => React.ReactNode;
  getRowValue?: (row: T, columnKey: string) => unknown;
  getRowId: (row: T) => string;
}

export function DynamicTable<T extends Record<string, unknown>>({
  moduleKey,
  data,
  isLoading,
  onRowClick,
  emptyMessage = 'No hay registros',
  customActions,
  getRowValue,
  getRowId,
}: DynamicTableProps<T>) {
  const { data: columns = [], isLoading: columnsLoading } = useColumnDefinitions(moduleKey);
  const isAdmin = useIsAdmin();
  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();

  const [editingColumn, setEditingColumn] = useState<ColumnDefinition | undefined>();
  const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false);

  const visibleColumns = columns.filter(col => col.is_visible);

  const handleToggleVisibility = async (column: ColumnDefinition) => {
    await updateColumn.mutateAsync({
      id: column.id,
      is_visible: !column.is_visible,
    });
  };

  const handleDeleteColumn = async (column: ColumnDefinition) => {
    if (column.is_system) return;
    await deleteColumn.mutateAsync({ id: column.id, moduleKey });
  };

  const handleEditColumn = (column: ColumnDefinition) => {
    setEditingColumn(column);
    setIsColumnEditorOpen(true);
  };

  const handleNewColumn = () => {
    setEditingColumn(undefined);
    setIsColumnEditorOpen(true);
  };

  const getValue = (row: T, columnKey: string): unknown => {
    if (getRowValue) {
      return getRowValue(row, columnKey);
    }
    return row[columnKey];
  };

  const loading = isLoading || columnsLoading;

  return (
    <div className="space-y-4">
      {/* Column management for admins */}
      {isAdmin && (
        <div className="flex items-center gap-2 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="w-4 h-4 mr-2" />
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Visibilidad</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.is_visible}
                  onCheckedChange={() => handleToggleVisibility(column)}
                >
                  {column.column_name}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleNewColumn}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva columna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 bg-muted/30">
                {visibleColumns.map((column) => (
                  <TableHead 
                    key={column.id}
                    style={{ width: column.column_width || undefined }}
                  >
                    <ColumnHeader
                      column={column}
                      isAdmin={isAdmin}
                      onEdit={() => handleEditColumn(column)}
                      onToggleVisibility={() => handleToggleVisibility(column)}
                      onDelete={() => handleDeleteColumn(column)}
                    />
                  </TableHead>
                ))}
                <TableHead className="w-[60px]">
                  {/* Actions column */}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={visibleColumns.length + 1} 
                    className="text-center py-12 text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow 
                    key={getRowId(row)}
                    className={cn(
                      "border-border/50 transition-colors",
                      onRowClick && "cursor-pointer hover:bg-secondary/50"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {visibleColumns.map((column) => (
                      <TableCell key={column.id}>
                        <CellRenderer 
                          value={getValue(row, column.column_key)} 
                          column={column} 
                        />
                      </TableCell>
                    ))}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {customActions?.(row)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Column Editor Modal */}
      <ColumnEditor
        column={editingColumn}
        moduleKey={moduleKey}
        open={isColumnEditorOpen}
        onOpenChange={setIsColumnEditorOpen}
        existingColumnKeys={columns.map(c => c.column_key)}
        nextOrder={(columns.length > 0 ? Math.max(...columns.map(c => c.column_order)) : 0) + 1}
      />
    </div>
  );
}
