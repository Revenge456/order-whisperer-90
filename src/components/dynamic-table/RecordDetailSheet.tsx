import { useState, useEffect } from 'react';
import { Loader2, X, Trash2, Save, MessageCircle, Bot, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ColumnDefinition } from '@/hooks/useColumnDefinitions';
import { cn } from '@/lib/utils';

interface RecordDetailSheetProps<T extends Record<string, unknown>> {
  record: T | null;
  columns: ColumnDefinition[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<T>) => Promise<void>;
  onDelete?: (record: T) => Promise<void>;
  isLoading?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  title?: string;
  customContent?: React.ReactNode;
}

const colorClasses: Record<string, string> = {
  primary: 'bg-primary/10 text-primary border-primary/30',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  destructive: 'bg-destructive/10 text-destructive border-destructive/30',
  muted: 'bg-muted text-muted-foreground border-border',
};

export function RecordDetailSheet<T extends Record<string, unknown>>({
  record,
  columns,
  open,
  onOpenChange,
  onSave,
  onDelete,
  isLoading = false,
  canEdit = true,
  canDelete = false,
  title,
  customContent,
}: RecordDetailSheetProps<T>) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (record && open) {
      setFormData({ ...record });
      setHasChanges(false);
    }
  }, [record, open]);

  const handleChange = (key: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData as Partial<T>);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!record || !onDelete) return;
    setIsSaving(true);
    try {
      await onDelete(record);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleWhatsApp = () => {
    const phone = formData.phone as string;
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  const renderField = (column: ColumnDefinition) => {
    const value = formData[column.column_key];
    const disabled = !canEdit || isLoading || isSaving;

    // System calculated fields are read-only
    if (['total_orders', 'total_spent', 'created_at', 'updated_at'].includes(column.column_key)) {
      return (
        <div className="text-sm text-muted-foreground">
          {column.column_type === 'date' && value ? (
            format(new Date(String(value)), 'dd MMM yyyy, HH:mm', { locale: es })
          ) : column.column_type === 'number' && (column.column_key === 'total_spent' || column.column_key === 'total') ? (
            `Bs. ${(value as number || 0).toLocaleString()}`
          ) : (
            String(value ?? '—')
          )}
        </div>
      );
    }

    switch (column.column_type) {
      case 'text':
        if (column.column_key === 'address' || column.column_key === 'notes') {
          return (
            <Textarea
              value={String(value || '')}
              onChange={(e) => handleChange(column.column_key, e.target.value)}
              disabled={disabled}
              className="min-h-[80px] resize-none"
            />
          );
        }
        return (
          <Input
            value={String(value || '')}
            onChange={(e) => handleChange(column.column_key, e.target.value)}
            disabled={disabled}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value as number || ''}
            onChange={(e) => handleChange(column.column_key, parseFloat(e.target.value) || 0)}
            disabled={disabled}
          />
        );

      case 'boolean':
        return (
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => handleChange(column.column_key, checked)}
            disabled={disabled}
          />
        );

      case 'select':
      case 'status':
        const options = column.options || [];
        return (
          <Select
            value={String(value || '')}
            onValueChange={(v) => handleChange(column.column_key, v)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    {column.column_key === 'conversation_mode' && (
                      opt.value === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />
                    )}
                    <Badge variant="outline" className={colorClasses[opt.color || 'muted']}>
                      {opt.label}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'email':
        return (
          <Input
            type="email"
            value={String(value || '')}
            onChange={(e) => handleChange(column.column_key, e.target.value)}
            disabled={disabled}
          />
        );

      case 'phone':
        return (
          <div className="flex gap-2">
            <Input
              type="tel"
              value={String(value || '')}
              onChange={(e) => handleChange(column.column_key, e.target.value)}
              disabled={disabled}
              className="flex-1"
            />
            {value && (
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={handleWhatsApp}
                className="text-success hover:text-success"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value ? format(new Date(String(value)), 'yyyy-MM-dd') : ''}
            onChange={(e) => handleChange(column.column_key, e.target.value)}
            disabled={disabled}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            value={String(value || '')}
            onChange={(e) => handleChange(column.column_key, e.target.value)}
            disabled={disabled}
            placeholder="https://..."
          />
        );

      default:
        return (
          <Input
            value={String(value || '')}
            onChange={(e) => handleChange(column.column_key, e.target.value)}
            disabled={disabled}
          />
        );
    }
  };

  if (!record) return null;

  // Group columns: system info at bottom
  const mainColumns = columns.filter(c => 
    !['created_at', 'updated_at', 'total_orders', 'total_spent'].includes(c.column_key)
  );
  const infoColumns = columns.filter(c => 
    ['total_orders', 'total_spent', 'created_at', 'updated_at'].includes(c.column_key)
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl">
              {title || (formData.name as string) || (formData.order_number as string) || 'Detalle'}
            </SheetTitle>
            <SheetDescription>
              {formData.phone && `📞 ${formData.phone}`}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-4">
            {/* Main editable fields */}
            <div className="space-y-4">
              {mainColumns.map((column) => (
                <div key={column.id} className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    {column.column_name}
                    {column.is_required && <span className="text-destructive">*</span>}
                  </Label>
                  {renderField(column)}
                </div>
              ))}
            </div>

            {customContent}

            {/* System info section */}
            {infoColumns.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Información del Sistema
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    {infoColumns.map((column) => (
                      <div key={column.id} className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          {column.column_name}
                        </span>
                        {renderField(column)}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <SheetFooter className="gap-2 pt-4 border-t border-border">
            {canDelete && onDelete && (
              <Button 
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving}
                className="mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            )}
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            {canEdit && (
              <Button 
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
