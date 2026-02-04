import { useState } from 'react';
import { Image, ExternalLink, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PaymentReceiptButtonProps {
  screenshotUrl: string | null;
  orderNumber: string | null;
}

export function PaymentReceiptButton({ screenshotUrl, orderNumber }: PaymentReceiptButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!screenshotUrl) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 opacity-30 cursor-not-allowed"
              disabled
            >
              <Image className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sin comprobante</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const handleDownload = () => {
    window.open(screenshotUrl, '_blank');
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-primary hover:text-primary/80"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
              }}
            >
              <Image className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver comprobante</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Comprobante - {orderNumber}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Abrir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Descargar
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="relative aspect-[4/3] bg-secondary/30 rounded-lg overflow-hidden border mt-4">
            <img
              src={screenshotUrl}
              alt="Comprobante de pago"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.classList.remove('hidden');
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
        </DialogContent>
      </Dialog>
    </>
  );
}
