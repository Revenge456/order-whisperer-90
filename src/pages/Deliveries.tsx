import { useState } from "react";
import { Search, Truck, MapPin, Clock, CheckCircle, Phone, User } from "lucide-react";
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

// Mock data
const deliveries = [
  {
    id: "1",
    order_number: "ORD-1237",
    customer: { name: "Ana Rodríguez", phone: "+591 70345678", address: "Zona Sur, Calle 21, La Paz" },
    delivery_person: { name: "Miguel Quispe", phone: "+591 71234567" },
    status: "delivering",
    estimated_time: "15 min",
    created_at: "2024-12-26T09:30:00",
  },
  {
    id: "2",
    order_number: "ORD-1239",
    customer: { name: "Roberto Flores", phone: "+591 70567890", address: "Av. Ballivián #789, La Paz" },
    delivery_person: { name: "Carlos Mamani", phone: "+591 71345678" },
    status: "picked_up",
    estimated_time: "25 min",
    created_at: "2024-12-26T10:00:00",
  },
  {
    id: "3",
    order_number: "ORD-1240",
    customer: { name: "Lucía Mendoza", phone: "+591 70678901", address: "Calle Comercio #123, El Alto" },
    delivery_person: null,
    status: "pending",
    estimated_time: null,
    created_at: "2024-12-26T10:30:00",
  },
  {
    id: "4",
    order_number: "ORD-1238",
    customer: { name: "Pedro Mamani", phone: "+591 70456789", address: "Av. Arce #456, La Paz" },
    delivery_person: { name: "Miguel Quispe", phone: "+591 71234567" },
    status: "delivered",
    estimated_time: null,
    created_at: "2024-12-25T14:30:00",
    delivered_at: "2024-12-25T15:00:00",
  },
];

const deliveryPersons = [
  { id: "1", name: "Miguel Quispe", phone: "+591 71234567", active_deliveries: 1, is_available: true },
  { id: "2", name: "Carlos Mamani", phone: "+591 71345678", active_deliveries: 1, is_available: true },
  { id: "3", name: "José Vargas", phone: "+591 71456789", active_deliveries: 0, is_available: true },
];

const statusConfig: Record<string, { label: string; style: string }> = {
  pending: { label: "Por Asignar", style: "bg-warning/10 text-warning border-warning/30" },
  assigned: { label: "Asignado", style: "bg-primary/10 text-primary border-primary/30" },
  picked_up: { label: "Recogido", style: "bg-chart-4/10 text-chart-4 border-chart-4/30" },
  delivering: { label: "En Ruta", style: "bg-primary/10 text-primary border-primary/30" },
  delivered: { label: "Entregado", style: "bg-success/10 text-success border-success/30" },
  failed: { label: "Fallido", style: "bg-destructive/10 text-destructive border-destructive/30" },
};

export default function Deliveries() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeDeliveries = deliveries.filter((d) => ["delivering", "picked_up"].includes(d.status));
  const pendingAssignment = deliveries.filter((d) => d.status === "pending");

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
              <p className="text-sm text-muted-foreground">Por Asignar</p>
              <p className="text-2xl font-bold text-warning">{pendingAssignment.length}</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">En Ruta</p>
              <p className="text-2xl font-bold text-primary">{activeDeliveries.length}</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Entregados Hoy</p>
              <p className="text-2xl font-bold text-success">
                {deliveries.filter((d) => d.status === "delivered").length}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Repartidores Activos</p>
              <p className="text-2xl font-bold text-foreground">
                {deliveryPersons.filter((d) => d.is_available).length}
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
                      placeholder="Buscar por pedido o cliente..."
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
                      <SelectItem value="pending">Por Asignar</SelectItem>
                      <SelectItem value="picked_up">Recogido</SelectItem>
                      <SelectItem value="delivering">En Ruta</SelectItem>
                      <SelectItem value="delivered">Entregado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {filteredDeliveries.map((delivery) => (
                <Card key={delivery.id} className="glass border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Truck className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{delivery.order_number}</p>
                            <Badge variant="outline" className={statusConfig[delivery.status].style}>
                              {statusConfig[delivery.status].label}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-foreground">{delivery.customer.name}</p>
                              <p className="text-muted-foreground">{delivery.customer.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <p className="text-muted-foreground">{delivery.customer.address}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {delivery.estimated_time && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>~{delivery.estimated_time}</span>
                          </div>
                        )}

                        {delivery.delivery_person ? (
                          <div className="text-right text-sm">
                            <p className="text-foreground">{delivery.delivery_person.name}</p>
                            <p className="text-muted-foreground">{delivery.delivery_person.phone}</p>
                          </div>
                        ) : (
                          <Select>
                            <SelectTrigger className="w-40 bg-secondary/50 border-border/50">
                              <SelectValue placeholder="Asignar" />
                            </SelectTrigger>
                            <SelectContent>
                              {deliveryPersons
                                .filter((p) => p.is_available)
                                .map((person) => (
                                  <SelectItem key={person.id} value={person.id}>
                                    {person.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}

                        {delivery.status === "delivering" && (
                          <Button size="sm" className="bg-success hover:bg-success/90">
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
          </div>

          {/* Delivery Persons */}
          <Card className="glass border-border/50 h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Repartidores</CardTitle>
              <CardDescription>Estado actual del equipo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deliveryPersons.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{person.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {person.phone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          person.is_available
                            ? "bg-success/10 text-success border-success/30"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {person.is_available ? "Disponible" : "Ocupado"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {person.active_deliveries} entrega(s)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}