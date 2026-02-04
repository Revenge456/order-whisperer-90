import { useState, useEffect } from 'react';
import { Settings2, Webhook, Save, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useN8nPaymentWebhookUrl, useCreateSystemSetting } from '@/hooks/useSystemSettings';
import { toast } from 'sonner';

export function N8nWebhookConfig() {
  const currentUrl = useN8nPaymentWebhookUrl();
  const createSetting = useCreateSystemSetting();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (currentUrl) {
      setWebhookUrl(currentUrl);
    }
  }, [currentUrl]);

  const handleSave = async () => {
    try {
      await createSetting.mutateAsync({
        key: 'n8n_payment_webhook_url',
        value: webhookUrl,
        description: 'URL del webhook de n8n para notificaciones de pagos confirmados',
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving webhook URL:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Webhook className="w-4 h-4" />
          Webhook n8n
          {currentUrl && <Check className="w-3 h-3 text-success" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Configurar Webhook n8n
          </DialogTitle>
          <DialogDescription>
            Configura el webhook de n8n para recibir notificaciones cuando se confirme un pago.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">URL del Webhook</Label>
            <Input
              id="webhook-url"
              placeholder="https://tu-instancia.app.n8n.cloud/webhook/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Esta URL se llamará automáticamente cuando se confirme un pago.
            </p>
          </div>

          <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
            <p className="text-sm font-medium">Datos que se enviarán:</p>
            <pre className="text-xs text-muted-foreground bg-background p-3 rounded border overflow-x-auto">
{`{
  "event": "payment.confirmed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "payment_id": "uuid",
    "order_id": "uuid",
    "order_number": "ORD-001",
    "customer_name": "Juan Pérez",
    "customer_phone": "+591...",
    "amount": 150,
    "status": "confirmado"
  }
}`}
            </pre>
          </div>

          <a
            href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Ver documentación de n8n
          </a>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={createSetting.isPending}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {createSetting.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
