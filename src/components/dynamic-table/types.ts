import type { ColumnDefinition, ColumnType, ColumnOption, ModuleKey } from '@/hooks/useColumnDefinitions';

export type { ColumnDefinition, ColumnType, ColumnOption, ModuleKey };

export interface DynamicTableProps<T extends Record<string, unknown>> {
  moduleKey: ModuleKey;
  data: T[];
  isLoading: boolean;
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  searchTerm?: string;
  searchFields?: string[];
  emptyMessage?: string;
  customActions?: (row: T) => React.ReactNode;
  getRowValue?: (row: T, columnKey: string) => unknown;
}

export interface CellRendererProps {
  value: unknown;
  column: ColumnDefinition;
  row: Record<string, unknown>;
}

export interface ColumnHeaderProps {
  column: ColumnDefinition;
  isAdmin: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}

export interface ColumnEditorProps {
  column?: ColumnDefinition;
  moduleKey: ModuleKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingColumnKeys: string[];
}

export const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  text: 'Texto',
  number: 'Número',
  date: 'Fecha',
  boolean: 'Sí/No',
  select: 'Selección',
  multi_select: 'Multi-selección',
  status: 'Estado',
  email: 'Email',
  phone: 'Teléfono',
  file: 'Archivo',
  url: 'URL',
};

export const COLUMN_TYPE_ICONS: Record<ColumnType, string> = {
  text: 'Type',
  number: 'Hash',
  date: 'Calendar',
  boolean: 'ToggleLeft',
  select: 'ChevronDown',
  multi_select: 'CheckSquare',
  status: 'Circle',
  email: 'Mail',
  phone: 'Phone',
  file: 'Paperclip',
  url: 'Link',
};
