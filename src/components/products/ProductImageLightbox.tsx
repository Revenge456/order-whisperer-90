import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ProductImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  productName?: string;
}

export function ProductImageLightbox({ open, onOpenChange, imageUrl, productName }: ProductImageLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-2 bg-card border-border">
        <img
          src={imageUrl}
          alt={productName || 'Producto'}
          className="w-full h-auto rounded-lg object-contain max-h-[80vh]"
        />
      </DialogContent>
    </Dialog>
  );
}
