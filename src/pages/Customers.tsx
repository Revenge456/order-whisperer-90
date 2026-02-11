import { useState } from "react";
import { Search, MessageCircle, Download } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicTable, RecordDetailSheet } from "@/components/dynamic-table";
import { useCustomers, useUpdateCustomer } from "@/hooks/useCustomers";
import { useColumnDefinitions } from "@/hooks/useColumnDefinitions";
import { useIsAdmin } from "@/hooks/useAuth";
import { filterBySearch } from "@/lib/search-utils";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";


type Customer = Tables<'customers'>;

const canalOptions = [
  { value: 'all', label: 'Todos los canales' },
  { value: 'facebook_ads', label: 'Facebook Ads' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'referido', label: 'Referido' },
  { value: 'organico', label: 'Orgánico' },
  { value: 'otro', label: 'Otro' },
];

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [canalFilter, setCanalFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const { data: customers, isLoading } = useCustomers();
  const { data: columns = [] } = useColumnDefinitions('customers');
  const updateCustomer = useUpdateCustomer();
  const isAdmin = useIsAdmin();

  const filteredCustomers = filterBySearch(
    (customers || []).filter(c => canalFilter === 'all' || c.canal === canalFilter),
    searchTerm,
    ['name', 'phone']
  );

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleSave = async (updates: Partial<Customer>) => {
    if (!selectedCustomer) return;
    const validFields = ['name', 'phone', 'email', 'address', 'notes', 'is_active', 'canal', 'custom_fields', 'conversation_mode', 'Anuncio'];
    const filtered: Record<string, unknown> = {};
    for (const key of validFields) {
      if (key in updates) filtered[key] = (updates as Record<string, unknown>)[key];
    }
    try {
      await updateCustomer.mutateAsync({ id: selectedCustomer.id, ...filtered });
      toast.success('Cliente actualizado');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleExportExcel = () => {
    if (!customers || customers.length === 0) {
      toast.error('No hay clientes para exportar');
      return;
    }

    const headers = ['Nombre', 'Teléfono', 'Email', 'Dirección', 'Canal', 'Activo', 'Total Pedidos', 'Total Gastado (Bs)', 'Notas', 'Creado'];
    const rows = customers.map(c => [
      c.name || '',
      c.phone || '',
      c.email || '',
      c.address || '',
      canalOptions.find(o => o.value === c.canal)?.label || c.canal || '',
      c.is_active ? 'Sí' : 'No',
      c.total_orders || 0,
      c.total_spent || 0,
      c.notes || '',
      c.created_at ? new Date(c.created_at).toLocaleDateString('es-BO') : '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Archivo exportado exitosamente');
  };

  const activeCustomers = customers?.filter(c => c.is_active).length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">Gestiona tu base de clientes</p>
          </div>
          {isAdmin && (
            <Button onClick={handleExportExcel} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar a Excel
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Clientes</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? <Skeleton className="h-8 w-16" /> : customers?.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Clientes Activos</p>
              <p className="text-2xl font-bold text-success">
                {isLoading ? <Skeleton className="h-8 w-16" /> : activeCustomers}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search + Canal Filter */}
        <Card className="glass border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50"
                />
              </div>
              <Select value={canalFilter} onValueChange={setCanalFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Filtrar por canal" />
                </SelectTrigger>
                <SelectContent>
                  {canalOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Table */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              {filteredCustomers.length} cliente(s) encontrado(s) • Haz clic en una fila para ver detalles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DynamicTable
              moduleKey="customers"
              data={filteredCustomers}
              isLoading={isLoading}
              onRowClick={handleRowClick}
              getRowId={(row) => row.id}
              emptyMessage={searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              customActions={(row) => (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                    onClick={() => handleWhatsApp(row.phone)}
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              )}
            />
          </CardContent>
        </Card>
      </div>

      {/* Record Detail Sheet */}
      <RecordDetailSheet
        record={selectedCustomer}
        columns={columns}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onSave={handleSave}
        canEdit={true}
        canDelete={isAdmin}
        title={selectedCustomer?.name || 'Cliente'}
      />
    </DashboardLayout>
  );
}
