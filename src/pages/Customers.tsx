import { useState } from "react";
import { Plus, Search, MessageCircle, MoreHorizontal, Edit } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DynamicTable, RecordDetailSheet } from "@/components/dynamic-table";
import { AIAgentConfig } from "@/components/settings/AIAgentConfig";
import { useCustomers, useUpdateCustomer } from "@/hooks/useCustomers";
import { useColumnDefinitions } from "@/hooks/useColumnDefinitions";
import { useIsAdmin } from "@/hooks/useAuth";
import { filterBySearch } from "@/lib/search-utils";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Customer = Tables<'customers'>;

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const { data: customers, isLoading } = useCustomers();
  const { data: columns = [] } = useColumnDefinitions('customers');
  const updateCustomer = useUpdateCustomer();
  const isAdmin = useIsAdmin();

  const filteredCustomers = filterBySearch(
    customers || [],
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
    try {
      await updateCustomer.mutateAsync({ id: selectedCustomer.id, ...updates });
      toast.success('Cliente actualizado');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const totalSpent = customers?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0;
  const activeCustomers = customers?.filter(c => c.is_active).length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">Gestiona tu base de clientes con tablas dinámicas</p>
          </div>
        </div>

        {/* Search */}
        <Card className="glass border-border/50">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, teléfono o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Ventas Totales</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? <Skeleton className="h-8 w-24" /> : `Bs. ${totalSpent.toLocaleString()}`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Agent Config (Admin only) */}
        {isAdmin && <AIAgentConfig />}

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
