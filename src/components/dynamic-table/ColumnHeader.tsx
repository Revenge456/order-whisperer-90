import { useState } from 'react';
import { 
  Settings2, 
  GripVertical, 
  Eye, 
  EyeOff, 
  Pencil, 
  Trash2,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  ChevronDown,
  CheckSquare,
  Circle,
  Mail,
  Phone,
  Paperclip,
  Link,
  Lock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { ColumnDefinition, ColumnType } from '@/hooks/useColumnDefinitions';
import { cn } from '@/lib/utils';

interface ColumnHeaderProps {
  column: ColumnDefinition;
  isAdmin: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  isDragging?: boolean;
}

const typeIcons: Record<ColumnType, React.ReactNode> = {
  text: <Type className="w-3.5 h-3.5" />,
  number: <Hash className="w-3.5 h-3.5" />,
  date: <Calendar className="w-3.5 h-3.5" />,
  boolean: <ToggleLeft className="w-3.5 h-3.5" />,
  select: <ChevronDown className="w-3.5 h-3.5" />,
  multi_select: <CheckSquare className="w-3.5 h-3.5" />,
  status: <Circle className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
  phone: <Phone className="w-3.5 h-3.5" />,
  file: <Paperclip className="w-3.5 h-3.5" />,
  url: <Link className="w-3.5 h-3.5" />,
};

export function ColumnHeader({ 
  column, 
  isAdmin, 
  onEdit, 
  onToggleVisibility, 
  onDelete,
  isDragging 
}: ColumnHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 group cursor-default",
        isDragging && "opacity-50"
      )}
    >
      {isAdmin && (
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
      )}
      
      <span className="text-muted-foreground">
        {typeIcons[column.column_type]}
      </span>
      
      <span className="font-medium text-muted-foreground">
        {column.column_name}
      </span>
      
      {column.is_required && (
        <span className="text-destructive text-xs">*</span>
      )}
      
      {column.is_system && (
        <Lock className="w-3 h-3 text-muted-foreground/50" />
      )}

      {isAdmin && (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar columna
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleVisibility}>
              {column.is_visible ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Ocultar
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Mostrar
                </>
              )}
            </DropdownMenuItem>
            {!column.is_system && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar columna
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
