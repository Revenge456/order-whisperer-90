import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
import { TablePagination } from "@/components/ui/table-pagination";
import {
  useCustomers,
  useUpdateCustomer,
  useCustomerCounts,
  usePaginatedCustomers,
} from "@/hooks/useCustomers";
import { useColumnDefinitions } from "@/hooks/useColumnDefinitions";
import { useIsAdmin } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
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

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const DEFAULT_PAGE_SIZE = 50;

export default function Customers() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-persisted pagination state
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = (() => {
    const ps = Number(searchParams.get('size')) || DEFAULT_PAGE_SIZE;
    return PAGE_SIZE_OPTIONS.includes(ps) ? ps : DEFAULT_PAGE_SIZE;
  })();

  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
  const [canalFilter, setCanalFilter] = useState(searchParams.get('canal') ?? 'all');

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Debounce search input (350ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // When search/canal changes → reset to page 1 and sync URL
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', '1');
      if (debouncedSearch) next.set('q', debouncedSearch); else next.delete('q');
      if (canalFilter && canalFilter !== 'all') next.set('canal', canalFilter); else next.delete('canal');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, canalFilter]);

  const updatePageInUrl = (nextPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(nextPage));
      return next;
    }, { replace: true });
  };

  const updatePageSizeInUrl = (nextSize: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('size', String(nextSize));
      next.set('page', '1');
      return next;
    }, { replace: true });
  };

  const { data: counts } = useCustomerCounts();
  const { data: paginated, isLoading, isFetching } = usePaginatedCustomers({
    page,
    pageSize,
    search: debouncedSearch,
    canal: canalFilter,
  });
  const { data: columns = [] } = useColumnDefinitions('customers');
  const updateCustomer = useUpdateCustomer();
  const isAdmin = useIsAdmin();

  // For Excel export: fetch ALL customers (no pagination)
  const { data: allCustomers, refetch: refetchAll, isFetching: isExporting } = useCustomers();

  const rows = paginated?.rows ?? [];
  const total = paginated?.total ?? 0;
  const totalPages = paginated?.totalPages ?? 1;

  // If current page > totalPages (e.g. after delete), snap back
  useEffect(() => {
    if (!paginated) return;
    if (page > paginated.totalPages) {
      updatePageInUrl(paginated.totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginated?.totalPages]);

  // Handle ?highlight={customer_id} from global search → open detail sheet
  const highlightId = searchParams.get('highlight');
  useEffect(() => {
    if (!highlightId) return;
    let cancelled = false;
    (async () => {
      const local = rows.find((c) => c.id === highlightId);
      if (local) {
        setSelectedCustomer(local);
        setIsDetailOpen(true);
      } else {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('id', highlightId)
          .maybeSingle();
        if (cancelled || !data) return;
        setSelectedCustomer(data as Customer);
        setIsDetailOpen(true);
      }
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('highlight');
        return next;
      }, { replace: true });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId]);

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
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleExportExcel = async () => {
    let dataset = allCustomers;
    if (!dataset || dataset.length === 0) {
      const res = await refetchAll();
      dataset = res.data;
    }
    if (!dataset || dataset.length === 0) {
      toast.error('No hay clientes para exportar');
      return;
    }

    const headers = ['Nombre', 'Teléfono', 'Email', 'Dirección', 'Canal', 'Activo', 'Total Pedidos', 'Total Gastado (Bs)', 'Notas', 'Creado'];
    const exportRows = dataset.map(c => [
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

    const csvContent = [headers, ...exportRows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Archivo exportado: ${dataset.length.toLocaleString('es-BO')} clientes`);
  };

  const totalCustomers = counts?.total ?? 0;
  const activeCustomers = counts?.active ?? 0;

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
            <Button onClick={handleExportExcel} variant="outline" className="gap-2" disabled={isExporting}>
              <Download className="w-4 h-4" />
              {isExporting ? 'Exportando…' : 'Exportar a Excel'}
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Clientes</p>
              <p className="text-2xl font-bold text-foreground">
                {!counts ? <Skeleton className="h-8 w-16" /> : totalCustomers.toLocaleString('es-BO')}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Clientes Activos</p>
              <p className="text-2xl font-bold text-success">
                {!counts ? <Skeleton className="h-8 w-16" /> : activeCustomers.toLocaleString('es-BO')}
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
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
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
              {total.toLocaleString('es-BO')} cliente(s) encontrado(s) • Haz clic en una fila para ver detalles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DynamicTable
              moduleKey="customers"
              data={rows}
              isLoading={isLoading || isFetching}
              onRowClick={handleRowClick}
              getRowId={(row) => row.id}
              emptyMessage={debouncedSearch ? 'No se encontraron clientes' : 'No hay clientes registrados'}
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

            <TablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={updatePageInUrl}
              onPageSizeChange={updatePageSizeInUrl}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              itemLabel="clientes"
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
