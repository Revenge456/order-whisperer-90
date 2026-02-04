import { useCallback } from 'react';
import { toast } from 'sonner';

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// Default webhook URL - can be overridden via system settings
const DEFAULT_N8N_WEBHOOK_URL = '';

export function useN8nWebhook() {
  const triggerWebhook = useCallback(async (
    webhookUrl: string,
    event: string,
    data: Record<string, unknown>
  ): Promise<boolean> => {
    if (!webhookUrl) {
      console.warn('N8N webhook URL not configured');
      return false;
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    try {
      console.log('Triggering N8N webhook:', { event, webhookUrl, data });
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors', // Handle CORS for external webhooks
        body: JSON.stringify(payload),
      });

      // Since we're using no-cors, we can't check response status
      // The webhook was sent successfully
      console.log('N8N webhook triggered successfully');
      return true;
    } catch (error) {
      console.error('Error triggering N8N webhook:', error);
      toast.error('Error al enviar notificación');
      return false;
    }
  }, []);

  return { triggerWebhook };
}

// Event types for payment-related webhooks
export const PAYMENT_EVENTS = {
  CONFIRMED: 'payment.confirmed',
  REJECTED: 'payment.rejected',
  UNDER_REVIEW: 'payment.under_review',
} as const;

export type PaymentEvent = typeof PAYMENT_EVENTS[keyof typeof PAYMENT_EVENTS];
