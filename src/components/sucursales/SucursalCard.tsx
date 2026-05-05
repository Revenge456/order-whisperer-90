import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Pencil } from 'lucide-react';
import type { Sucursal } from '@/hooks/useSucursales';
import { useUpdateSucursal } from '@/hooks/useSucursales';

interface Props {
  sucursal: Sucursal;
  onEdit: (s: Sucursal) => void;
}

export function SucursalCard({ sucursal, onEdit }: Props) {
  const update = useUpdateSucursal();
  const photos = sucursal.photo_urls || [];
  const aliases = sucursal.aliases || [];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{sucursal.nombre}</h3>
            {aliases.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {aliases.map((a) => (
                  <Badge key={a} variant="outline" className="text-[10px] px-1.5 py-0">
                    {a}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <Badge variant={sucursal.is_active ? 'default' : 'secondary'} className="text-[10px]">
              {sucursal.is_active ? 'Activa' : 'Inactiva'}
            </Badge>
            {sucursal.coming_soon && (
              <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-500">
                Próximamente
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {photos.length > 0 ? (
          <div className="flex gap-1.5">
            {photos.slice(0, 3).map((url, i) => (
              <img key={i} src={url} alt="" className="h-16 w-16 rounded object-cover" />
            ))}
            {photos.length > 3 && (
              <div className="h-16 w-16 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                +{photos.length - 3}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Sin fotos</p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Switch
            checked={sucursal.is_active}
            onCheckedChange={(v) => update.mutate({ id: sucursal.id, is_active: v })}
          />
          <span className="text-xs text-muted-foreground">#{sucursal.sort_order}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => onEdit(sucursal)}>
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Editar
        </Button>
      </CardFooter>
    </Card>
  );
}
