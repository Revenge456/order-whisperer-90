import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Phone, Mail, Link, Check, X, Calendar, FileText, Bot, User, ImageIcon } from 'lucide-react';
import type { ColumnDefinition, ColumnOption } from '@/hooks/useColumnDefinitions';
import { cn } from '@/lib/utils';

interface CellRendererProps {
  value: unknown;
  column: ColumnDefinition;
}

const colorClasses: Record<string, string> = {
  primary: 'bg-primary/10 text-primary border-primary/30',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  destructive: 'bg-destructive/10 text-destructive border-destructive/30',
  muted: 'bg-muted text-muted-foreground border-border',
};

export function CellRenderer({ value, column }: CellRendererProps) {
  if (value === null || value === undefined || value === '') {
    // Show placeholder for image columns
    if (column.column_key === 'image_url') {
      return (
        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border border-border flex-shrink-0">
          <ImageIcon className="w-4 h-4 text-muted-foreground" />
        </div>
      );
    }
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  switch (column.column_type) {
    case 'text':
      // Truncate description with tooltip
      if (column.column_key === 'description' || column.column_key === 'notes') {
        const text = String(value);
        if (text.length > 60) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-foreground text-sm line-clamp-2 max-w-[200px] block">{text}</span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs whitespace-pre-wrap">
                  {text}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        return <span className="text-foreground text-sm line-clamp-2 max-w-[200px] block">{text}</span>;
      }
      return <span className="text-foreground text-sm">{String(value)}</span>;

    case 'number':
      const num = typeof value === 'number' ? value : parseFloat(String(value));
      if (column.column_key === 'total_spent' || column.column_key === 'total' || column.column_key === 'price') {
        return <span className="font-medium text-success text-sm whitespace-nowrap">Bs. {num.toLocaleString()}</span>;
      }
      return <span className="font-medium text-foreground text-sm">{num.toLocaleString()}</span>;

    case 'date':
      try {
        const date = new Date(String(value));
        return (
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs whitespace-nowrap">
            <Calendar className="w-3 h-3" />
            {format(date, 'dd MMM yyyy', { locale: es })}
          </span>
        );
      } catch {
        return <span className="text-foreground text-sm">{String(value)}</span>;
      }

    case 'boolean':
      return value ? (
        <Badge variant="outline" className={cn(colorClasses.success, 'text-xs')}>
          <Check className="w-3 h-3 mr-1" /> Sí
        </Badge>
      ) : (
        <Badge variant="outline" className={cn(colorClasses.muted, 'text-xs')}>
          <X className="w-3 h-3 mr-1" /> No
        </Badge>
      );

    case 'select':
    case 'status':
      const stringValue = String(value);
      const option = column.options?.find(o => o.value === stringValue);
      if (option) {
        const colorClass = option.color ? colorClasses[option.color] || colorClasses.muted : colorClasses.muted;
        
        if (column.column_key === 'conversation_mode') {
          return (
            <Badge variant="outline" className={cn(colorClass, 'gap-1 text-xs')}>
              {stringValue === 'ai' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
              {option.label}
            </Badge>
          );
        }
        
        return <Badge variant="outline" className={cn(colorClass, 'text-xs')}>{option.label}</Badge>;
      }
      return <Badge variant="outline" className={cn(colorClasses.muted, 'text-xs')}>{stringValue}</Badge>;

    case 'multi_select':
      const values = Array.isArray(value) ? value : [value];
      return (
        <div className="flex flex-wrap gap-1">
          {values.map((v, i) => {
            const opt = column.options?.find(o => o.value === String(v));
            const cls = opt?.color ? colorClasses[opt.color] || colorClasses.muted : colorClasses.muted;
            return (
              <Badge key={i} variant="outline" className={cn(cls, 'text-xs')}>
                {opt?.label || String(v)}
              </Badge>
            );
          })}
        </div>
      );

    case 'email':
      return (
        <a 
          href={`mailto:${value}`} 
          className="text-primary hover:underline flex items-center gap-1.5 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <Mail className="w-3 h-3" />
          {String(value)}
        </a>
      );

    case 'phone':
      return (
        <span className="text-foreground flex items-center gap-1.5 text-sm">
          <Phone className="w-3 h-3 text-muted-foreground" />
          {String(value)}
        </span>
      );

    case 'url':
      return (
        <a 
          href={String(value)} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1.5 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <Link className="w-3 h-3" />
          Ver enlace
        </a>
      );

    case 'file':
      if (column.column_key === 'image_url') {
        return (
          <div
            className="w-10 h-10 rounded-md overflow-hidden bg-muted flex items-center justify-center border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent('product-image-lightbox', { detail: { url: String(value) } }));
            }}
          >
            <img
              src={String(value)}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
            <ImageIcon className="w-4 h-4 text-muted-foreground hidden" />
          </div>
        );
      }
      return (
        <a 
          href={String(value)} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1.5 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <FileText className="w-3 h-3" />
          Ver archivo
        </a>
      );

    default:
      return <span className="text-foreground text-sm">{String(value)}</span>;
  }
}
