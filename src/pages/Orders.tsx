import { useState } from "react";
import { Plus, Search, Eye, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data
const orders = [
  {
    id: "1",
    order_number: "ORD-1234",
    customer: { full_name: "Juan Pérez", phone: "+591 70012345" },
    status: "pending",
    total: 350,
    items_count: 3,
    created_at: "2024-12-26T10:30:00",
    delivery_address: "Av. 6 de Agosto #1234, La Paz",
  },
  {
    id: "2",
    order_number: "ORD-1235",
    customer: { full_name: "María García", phone: "+591 70123456" },
    status: "confirmed",
    total: 520,
    items_count: 5,
    created_at: "2024-12-26T10:45:00",
    delivery_address: "Calle Junín #567, Santa Cruz",
  },
  {
    id: "3",
    order_number: "ORD-1236",
    customer: { full_name: "Carlos López", phone: "+591 70234567" },
    status: "preparing",
    total: 180,
    items_count: 2,
    created_at: "2024-12-26T11:00:00",
    delivery_address: "Av. América #890, Cochabamba",
  },
  {
    id: "4",
    order_number: "ORD-1237",
    customer: { full_name: "Ana Rodríguez", phone: "+591 70345678" },
    status: "delivering",
    total: 420,
    items_count: 4,
    created_at: "2024-12-26T09:15:00",
    delivery_address: "Zona Sur, Calle 21, La Paz",
  },
  {
    id: "5",
    order_number: "ORD-1238",
    customer: { full_name: "Pedro Mamani", phone: "+591 70456789" },
    status: "delivered",
    total: 650,
    items_count: 6,
    created_at: "2024-12-25T14:30:00",
    delivery_address: "Av. Arce #456, La Paz",
  },
];

const statusConfig: Record<string, { label: string; style: string; icon: React.ElementType }> = {
  pending: { label: "Pendiente", style: "bg-warning/10 text-warning border-warning/30", icon: Clock },
  confirmed: { label: "Confirmado", style: "bg-primary/10 text-primary border-primary/30", icon: CheckCircle },
  preparing: { label: "Preparando", style: "bg-chart-4/10 text-chart-4 border-chart-4/30", icon: Package },
  ready: { label: "Listo", style: "bg-success/10 text-success border-success/30", icon: CheckCircle },
  delivering: { label: "En Ruta", style: "bg-primary/10 text-primary border-primary/30", icon: Package },
  delivered: { label: "Entregado", style: "bg-success/10 text-success border-success/30", icon: CheckCircle },
  cancelled: { label: "Cancelado", style: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
};

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
            <p className="text-muted-foreground mt-1">Gestión de pedidos del día</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Pedido
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="glass border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número o cliente..."
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
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="preparing">Preparando</SelectItem>
                  <SelectItem value="ready">Listo</SelectItem>
                  <SelectItem value="delivering">En Ruta</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold text-warning">
                {orders.filter((o) => o.status === "pending").length}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">En Proceso</p>
              <p className="text-2xl font-bold text-primary">
                {orders.filter((o) => ["confirmed", "preparing", "ready"].includes(o.status)).length}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">En Ruta</p>
              <p className="text-2xl font-bold text-chart-4">
                {orders.filter((o) => o.status === "delivering").length}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Entregados Hoy</p>
              <p className="text-2xl font-bold text-success">
                {orders.filter((o) => o.status === "delivered").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Lista de Pedidos</CardTitle>
            <CardDescription>
              {filteredOrders.length} pedido(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <TableRow key={order.id} className="border-border/50 hover:bg-secondary/30">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">{order.items_count} items</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{order.customer.full_name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {order.delivery_address}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[order.status].style}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[order.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-foreground">
                          Bs. {order.total.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}