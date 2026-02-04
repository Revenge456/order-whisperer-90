import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useUpdatePayment } from '@/hooks/useOrders';
import { useN8nWebhook, PAYMENT_EVENTS } from '@/hooks/useN8nWebhook';
import { useN8nPaymentWebhookUrl } from '@/hooks/useSystemSettings';
import type { Enums } from '@/integrations/supabase/types';

type PaymentStatus = Enums<'payment_status'>;

interface PaymentStatusSelectProps {
  paymentId: string | null;
  currentStatus: PaymentStatus | null;
  orderId: string | null;
  orderNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  amount: number | null;
  disabled?: boolean;
}

const statusConfig: Record<PaymentStatus, { label: string; style: string }> = {
  pendiente: { label: 'Pendiente', style: 'bg-warning/10 text-warning border-warning/30' },
  confirmado: { label: 'Confirmado', style: 'bg-success/10 text-success border-success/30' },
  rechazado: { label: 'Rechazado', style: 'bg-destructive/10 text-destructive border-destructive/30' },
  bajo_revision: { label: 'En Revisión', style: 'bg-chart-4/10 text-chart-4 border-chart-4/30' },
};

export function PaymentStatusSelect({
  paymentId,
  currentStatus,
  orderId,
  orderNumber,
  customerName,
  customerPhone,
  amount,
  disabled = false,
}: PaymentStatusSelectProps) {
  const updatePayment = useUpdatePayment();
  const { triggerWebhook } = useN8nWebhook();
  const webhookUrl = useN8nPaymentWebhookUrl();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: PaymentStatus) => {
    if (!paymentId || newStatus === currentStatus) return;

    setIsUpdating(true);
    try {
      const updateData: Record<string, unknown> = {
        id: paymentId,
        status: newStatus,
      };

      // Add confirmation timestamp if confirming
      if (newStatus === 'confirmado') {
        updateData.confirmed_at = new Date().toISOString();
      }

      await updatePayment.mutateAsync(updateData as any);

      // Trigger n8n webhook for payment confirmation
      if (newStatus === 'confirmado' && webhookUrl) {
        await triggerWebhook(webhookUrl, PAYMENT_EVENTS.CONFIRMED, {
          payment_id: paymentId,
          order_id: orderId,
          order_number: orderNumber,
          customer_name: customerName,
          customer_phone: customerPhone,
          amount: amount,
          status: newStatus,
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (!paymentId || !currentStatus) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  if (isUpdating) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Actualizando...</span>
      </div>
    );
  }

  return (
    <Select
      value={currentStatus}
      onValueChange={(value) => handleStatusChange(value as PaymentStatus)}
      disabled={disabled || isUpdating}
    >
      <SelectTrigger 
        className="w-[140px] h-8 border-0 bg-transparent p-0 focus:ring-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Badge variant="outline" className={statusConfig[currentStatus]?.style}>
          {statusConfig[currentStatus]?.label || currentStatus}
        </Badge>
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        {Object.entries(statusConfig).map(([value, config]) => (
          <SelectItem key={value} value={value}>
            <Badge variant="outline" className={config.style}>
              {config.label}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
