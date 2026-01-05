import { useState } from "react";
import { Search, Truck, MapPin, CheckCircle, Phone, User, MessageCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveDeliveries, useDeliveryDrivers, useAssignDriver, useUpdateDelivery } from "@/hooks/useDeliveries";
import { filterBySearch } from "@/lib/search-utils";
import type { Enums } from "@/integrations/supabase/types";

type DeliveryStatus = Enums<'delivery_status'>;

const statusConfig: Record<DeliveryStatus, { label: string; style: string }> = {
  sin_asignar: { label: "Sin Asignar", style: "bg-warning/10 text-warning border-warning/30" },
  asignado: { label: "Asignado", style: "bg-primary/10 text-primary border-primary/30" },
  en_camino: { label: "En Camino", style: "bg-chart-4/10 text-chart-4 border-chart-4/30" },
  entregado: { label: "Entregado", style: "bg-success/10 text-success border-success/30" },
  fallido: { label: "Fallido", style: "bg-destructive/10 text-destructive border-destructive/30" },
  cancelado: { label: "Cancelado", style: "bg-muted text-muted-foreground" },
};

export default function Deliveries() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: deliveries, isLoading: deliveriesLoading } = useActiveDeliveries();
  const { data: drivers } = useDeliveryDrivers();
  const assignDriver = useAssignDriver();
  const updateDelivery = useUpdateDelivery();

  const filteredDeliveries = filterBySearch(
    deliveries?.filter(d => statusFilter === "all" || d.status === statusFilter) || [],
    searchTerm,
    ['order_number', 'customer_name', 'driver_name']
  );

  const activeDeliveries = deliveries?.filter(d => 
    d.status && ['asignado', 'en_camino'].includes(d.status)
  ).length || 0;
  
  const pendingAssignment = deliveries?.filter(d => d.status === 'sin_asignar').length || 0;
  const completedToday = deliveries?.filter(d => d.status === 'entregado').length || 0;

  const handleAssignDriver = async (deliveryId: string, driverId: string) => {
    const driver = drivers?.find(d => d.id === driverId);
    if (!driver) return;
    
    await assignDriver.mutateAsync({
      deliveryId,
      driverId,
      driverName: driver.full_name,
      driverPhone: driver.phone,
    });
  };

  const handleMarkDelivered = async (deliveryId: string) => {
    await updateDelivery.mutateAsync({
      id: deliveryId,
      status: 'entregado',
      delivered_at: new Date().toISOString(),
    });
  };

  const handleContactDriver = (phone: string | null) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleContactCustomer = (phone: string | null) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Entregas</h1>
          <p className="text-muted-foreground mt-1">Seguimiento y asignación de entregas</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Sin Asignar</p>
              <p className="text-2xl font-bold text-warning">
                {deliveriesLoading ? <Skeleton className="h-8 w-12" /> : pendingAssignment}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">En Ruta</p>
              <p className="text-2xl font-bold text-primary">
                {deliveriesLoading ? <Skeleton className="h-8 w-12" /> : activeDeliveries}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Entregados Hoy</p>
              <p className="text-2xl font-bold text-success">
                {deliveriesLoading ? <Skeleton className="h-8 w-12" /> : completedToday}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Repartidores Activos</p>
              <p className="text-2xl font-bold text-foreground">
                {drivers?.length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deliveries List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="glass border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por pedido, cliente o repartidor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-secondary/50 border-border/50"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 bg-secondary/50 border-border/50">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="sin_asignar">Sin Asignar</SelectItem>
                      <SelectItem value="asignado">Asignado</SelectItem>
                      <SelectItem value="en_camino">En Camino</SelectItem>
                      <SelectItem value="entregado">Entregado</SelectItem>
                      <SelectItem value="fallido">Fallido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {deliveriesLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <Card className="glass border-border/50">
                <CardContent className="py-12 text-center">
                  <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay entregas que mostrar</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredDeliveries.map((delivery) => (
                  <Card key={delivery.delivery_id} className="glass border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Truck className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{delivery.order_number}</p>
                              <Badge variant="outline" className={statusConfig[delivery.status as DeliveryStatus]?.style}>
                                {statusConfig[delivery.status as DeliveryStatus]?.label || delivery.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-foreground">{delivery.customer_name || 'Sin nombre'}</p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-success hover:text-success hover:bg-success/10"
                                    onClick={() => handleContactCustomer(delivery.customer_phone)}
                                    title="WhatsApp cliente"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                                <p className="text-muted-foreground">{delivery.customer_phone}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <p className="text-muted-foreground">{delivery.address}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {delivery.total && (
                            <p className="font-bold text-lg text-foreground">
                              Bs. {delivery.total.toLocaleString()}
                            </p>
                          )}

                          {delivery.driver_name ? (
                            <div className="text-right text-sm space-y-1">
                              <div className="flex items-center gap-2 justify-end">
                                <p className="text-foreground font-medium">{delivery.driver_name}</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1 text-success border-success/50 hover:bg-success/10"
                                  onClick={() => handleContactDriver(delivery.driver_phone)}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  Contactar
                                </Button>
                              </div>
                              <p className="text-muted-foreground">{delivery.driver_phone}</p>
                            </div>
                          ) : (
                            <Select onValueChange={(value) => delivery.delivery_id && handleAssignDriver(delivery.delivery_id, value)}>
                              <SelectTrigger className="w-48 bg-secondary/50 border-border/50">
                                <SelectValue placeholder="Asignar repartidor" />
                              </SelectTrigger>
                              <SelectContent>
                                {drivers?.map((driver) => (
                                  <SelectItem key={driver.id} value={driver.id}>
                                    {driver.full_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {delivery.status === 'en_camino' && (
                            <Button 
                              size="sm" 
                              className="bg-success hover:bg-success/90"
                              onClick={() => delivery.delivery_id && handleMarkDelivered(delivery.delivery_id)}
                              disabled={updateDelivery.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Marcar Entregado
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Drivers */}
          <Card className="glass border-border/50 h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Repartidores</CardTitle>
              <CardDescription>Equipo de delivery disponible</CardDescription>
            </CardHeader>
            <CardContent>
              {!drivers?.length ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay repartidores registrados
                </p>
              ) : (
                <div className="space-y-3">
                  {drivers.map((driver) => (
                    <div
                      key={driver.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{driver.full_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {driver.phone}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            driver.is_active
                              ? "bg-success/10 text-success border-success/30"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {driver.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {driver.successful_deliveries || 0}/{driver.total_deliveries || 0} entregas
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
