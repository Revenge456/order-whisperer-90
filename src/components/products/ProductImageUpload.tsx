import { useState, useRef, useCallback } from 'react';
import { Upload, X, Replace, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const BUCKET = 'Product storage';
const FOLDER = 'productos';

interface ProductImageUploadProps {
  imageUrl: string | null;
  productId?: string;
  onImageChange: (url: string | null, resetPhotoId: boolean) => void;
}

export function ProductImageUpload({ imageUrl, productId, onImageChange }: ProductImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Formato no permitido. Usa JPG, PNG o WebP');
      return false;
    }
    if (file.size > MAX_SIZE) {
      toast.error('La imagen no debe superar 2MB');
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const id = productId || crypto.randomUUID();
      const timestamp = Date.now();
      const filePath = `${FOLDER}/${id}-${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

      onImageChange(urlData.publicUrl, true);
      toast.success('Imagen actualizada');
    } catch (error: any) {
      toast.error('Error al subir imagen: ' + (error.message || 'Desconocido'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [productId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleRemove = () => {
    onImageChange(null, true);
  };

  return (
    <div className="grid gap-2">
      <Label>Imagen del producto</Label>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {imageUrl ? (
        <div className="relative group">
          <div className="w-full h-40 rounded-lg overflow-hidden border border-border bg-muted">
            <img
              src={imageUrl}
              alt="Producto"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Replace className="w-4 h-4 mr-1" />}
              Reemplazar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="w-4 h-4 mr-1" />
              Quitar
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            "w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50",
            isUploading && "pointer-events-none opacity-60"
          )}
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Arrastra una imagen o haz clic para seleccionar
              </span>
              <span className="text-xs text-muted-foreground">JPG, PNG, WebP · Máx 2MB</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
