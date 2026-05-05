import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus, MapPin } from 'lucide-react';
import { useSucursales } from '@/hooks/useSucursales';
import { SucursalCard } from '@/components/sucursales/SucursalCard';
import { SucursalModal } from '@/components/sucursales/SucursalModal';
import type { Sucursal } from '@/hooks/useSucursales';
import { Skeleton } from '@/components/ui/skeleton';

export default function Sucursales() {
  const { data: sucursales, isLoading } = useSucursales();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sucursal | null>(null);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (s: Sucursal) => {
    setEditing(s);
    setModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Sucursales</h1>
              <p className="text-sm text-muted-foreground">
                Gestioná las sucursales que el bot de WhatsApp muestra a los clientes
              </p>
            </div>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva sucursal
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-lg" />
            ))}
          </div>
        ) : !sucursales?.length ? (
          <div className="text-center py-20 text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No hay sucursales todavía</p>
            <Button variant="outline" className="mt-3" onClick={openNew}>
              Crear la primera
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sucursales.map((s) => (
              <SucursalCard key={s.id} sucursal={s} onEdit={openEdit} />
            ))}
          </div>
        )}
      </div>

      <SucursalModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        sucursal={editing}
      />
    </DashboardLayout>
  );
}
