import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Download, 
  Loader2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useUpdatePayment } from '@/hooks/useOrders';
import type { Tables } from '@/integrations/supabase/types';

type PendingPayment = Tables<'pending_payments_view'>;

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PendingPayment | null;
}

const methodLabels: Record<string, string> = {
  qr: 'Código QR',
  efectivo: 'Efectivo',
};

export function PaymentModal({ open, onOpenChange, payment }: PaymentModalProps) {
  const updatePayment = useUpdatePayment();
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!payment) return null;

  const handleConfirm = async () => {
    if (!payment.payment_id) return;
    
    await updatePayment.mutateAsync({
      id: payment.payment_id,
      status: 'confirmado',
      confirmed_at: new Date().toISOString(),
    });
    onOpenChange(false);
  };

  const handleReject = async () => {
    if (!payment.payment_id || !rejectionReason.trim()) return;
    
    await updatePayment.mutateAsync({
      id: payment.payment_id,
      status: 'rechazado',
      rejection_reason: { reason: rejectionReason },
    });
    setRejectionReason('');
    setShowRejectForm(false);
    onOpenChange(false);
  };

  const handleDownload = () => {
    if (payment.screenshot_url) {
      window.open(payment.screenshot_url, '_blank');
    }
  };

  const isLoading = updatePayment.isPending;
  const isPending = payment.status === 'pendiente';
  const waitingMinutes = payment.minutes_waiting || 0;
  
  const getTimerColor = () => {
    if (waitingMinutes < 10) return 'text-success';
    if (waitingMinutes < 30) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Verificar Pago - {payment.order_number}
          </DialogTitle>
          <DialogDescription>
            Cliente: {payment.customer_name} • {payment.customer_phone}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Monto</p>
              <p className="text-2xl font-bold">Bs. {payment.amount?.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Método</p>
              <Badge variant="secondary" className="text-base">
                {payment.method ? methodLabels[payment.method] || payment.method : 'N/A'}
              </Badge>
            </div>
          </div>

          {/* Waiting Time */}
          {isPending && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
              <AlertCircle className={`w-5 h-5 ${getTimerColor()}`} />
              <span className="text-sm">
                Esperando verificación: 
                <span className={`font-bold ml-1 ${getTimerColor()}`}>
                  {Math.floor(waitingMinutes)} minutos
                </span>
              </span>
            </div>
          )}

          {/* Screenshot */}
          {payment.screenshot_url ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Comprobante de Pago</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Descargar
                </Button>
              </div>
              <div className="relative aspect-[4/3] bg-secondary/30 rounded-lg overflow-hidden border">
                <img
                  src={payment.screenshot_url}
                  alt="Comprobante de pago"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ExternalLink className="w-8 h-8 mx-auto mb-2" />
                    <p>No se pudo cargar la imagen</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleDownload}
                    >
                      Ver en nueva pestaña
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-secondary/30 rounded-lg border border-dashed">
              <p className="text-muted-foreground">
                {payment.method === 'efectivo' 
                  ? 'Pago en efectivo - sin comprobante digital'
                  : 'Sin comprobante adjunto'}
              </p>
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <div className="space-y-2 p-4 bg-destructive/10 rounded-lg border border-destructive/30">
              <Label htmlFor="rejection">Motivo del rechazo *</Label>
              <Textarea
                id="rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Describe el motivo del rechazo..."
                className="bg-background"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {isPending && !showRejectForm && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(true)}
                disabled={isLoading}
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="bg-success hover:bg-success/90"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar Pago
              </Button>
            </>
          )}
          
          {showRejectForm && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isLoading || !rejectionReason.trim()}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Rechazo
              </Button>
            </>
          )}
          
          {!isPending && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
