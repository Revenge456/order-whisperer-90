import { useState } from "react";
import { Search, Eye, Clock, CheckCircle, XCircle, Package, Image, CreditCard, AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders, usePendingPayments, useUpdatePayment } from "@/hooks/useOrders";
import { filterBySearch } from "@/lib/search-utils";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { PaymentStatusSelect } from "@/components/orders/PaymentStatusSelect";
import { PaymentReceiptButton } from "@/components/orders/PaymentReceiptButton";

import type { Tables, Enums } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type OrderCompleteView = Tables<'orders_complete_view'>;
type PendingPayment = Tables<'pending_payments_view'>;
type OrderStatus = Enums<'order_status'>;

const orderStatusConfig: Record<OrderStatus, { label: string; style: string; icon: React.ElementType }> = {
  nuevo: { label: "Nuevo", style: "bg-warning/10 text-warning border-warning/30", icon: Clock },
  confirmado: { label: "Confirmado", style: "bg-primary/10 text-primary border-primary/30", icon: CheckCircle },
  en_entrega: { label: "En Entrega", style: "bg-chart-4/10 text-chart-4 border-chart-4/30", icon: Package },
  completado: { label: "Completado", style: "bg-success/10 text-success border-success/30", icon: CheckCircle },
  cancelado: { label: "Cancelado", style: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
};

const paymentStatusConfig: Record<string, { label: string; style: string }> = {
  pendiente: { label: "Pendiente", style: "bg-warning/10 text-warning border-warning/30" },
  confirmado: { label: "Confirmado", style: "bg-success/10 text-success border-success/30" },
  rechazado: { label: "Rechazado", style: "bg-destructive/10 text-destructive border-destructive/30" },
  bajo_revision: { label: "En Revisión", style: "bg-chart-4/10 text-chart-4 border-chart-4/30" },
};

const methodLabels: Record<string, string> = {
  qr: "QR",
  efectivo: "Efectivo",
};

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: pendingPayments, isLoading: paymentsLoading } = usePendingPayments();
  const updatePayment = useUpdatePayment();

  const filteredOrders = filterBySearch(
    orders?.filter(o => statusFilter === "all" || o.status === statusFilter) || [],
    searchTerm,
    ['order_number', 'customer_name', 'customer_phone']
  );

  const filteredPayments = filterBySearch(
    pendingPayments || [],
    searchTerm,
    ['order_number', 'customer_name', 'customer_phone']
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM HH:mm", { locale: es });
  };

  const getWaitingTimeColor = (minutes: number | null) => {
    if (!minutes) return 'text-success';
    if (minutes < 10) return 'text-success';
    if (minutes < 30) return 'text-warning';
    return 'text-destructive';
  };

  const handleViewPayment = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setIsPaymentModalOpen(true);
  };

  const handleQuickConfirm = async (paymentId: string) => {
    await updatePayment.mutateAsync({
      id: paymentId,
      status: 'confirmado',
      confirmed_at: new Date().toISOString(),
    });
  };

  // Stats
  const pendingOrders = orders?.filter(o => o.status === 'nuevo').length || 0;
  const inProgressOrders = orders?.filter(o => ['confirmado', 'en_entrega'].includes(o.status || '')).length || 0;
  const completedToday = orders?.filter(o => {
    if (o.status !== 'completado' || !o.completed_at) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(o.completed_at) >= today;
  }).length || 0;

  const pendingPaymentsAmount = pendingPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
            <p className="text-muted-foreground mt-1">Gestión de pedidos y pagos</p>
          </div>
          
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Nuevos</p>
              <p className="text-2xl font-bold text-warning">
                {ordersLoading ? <Skeleton className="h-8 w-12" /> : pendingOrders}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">En Proceso</p>
              <p className="text-2xl font-bold text-primary">
                {ordersLoading ? <Skeleton className="h-8 w-12" /> : inProgressOrders}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Completados Hoy</p>
              <p className="text-2xl font-bold text-success">
                {ordersLoading ? <Skeleton className="h-8 w-12" /> : completedToday}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50 border-warning/30">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Pagos Pendientes</p>
              <p className="text-2xl font-bold text-warning">
                {paymentsLoading ? <Skeleton className="h-8 w-12" /> : pendingPayments?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Bs. {pendingPaymentsAmount.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Pagos Pendientes
              {(pendingPayments?.length || 0) > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-1.5">
                  {pendingPayments?.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card className="glass border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por número, cliente o teléfono..."
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
                      <SelectItem value="nuevo">Nuevo</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="en_entrega">En Entrega</SelectItem>
                      <SelectItem value="completado">Completado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle>Lista de Pedidos</CardTitle>
                <CardDescription>
                  {filteredOrders.length} pedido(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead>Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Estado Pedido</TableHead>
                        <TableHead>Estado Pago</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Fecha</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No hay pedidos que coincidan
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => {
                          const orderStatus = order.status as OrderStatus;
                          const StatusIcon = orderStatusConfig[orderStatus]?.icon || Clock;
                          
                          return (
                            <TableRow key={order.id} className="border-border/50 hover:bg-secondary/30">
                              <TableCell>
                                <div>
                                  <p className="font-medium text-foreground">{order.order_number}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-foreground">{order.customer_name || 'Sin nombre'}</p>
                                  <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={orderStatusConfig[orderStatus]?.style}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {orderStatusConfig[orderStatus]?.label || orderStatus}
                                </Badge>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <PaymentStatusSelect
                                  paymentId={order.payment_id}
                                  currentStatus={order.payment_status}
                                  orderId={order.id}
                                  orderNumber={order.order_number}
                                  customerName={order.customer_name}
                                  customerPhone={order.customer_phone}
                                  amount={order.payment_amount}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-medium text-foreground">
                                  Bs. {(order.total || 0).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(order.created_at)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <PaymentReceiptButton
                                    screenshotUrl={order.screenshot_url}
                                    orderNumber={order.order_number}
                                  />
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            {(pendingPayments?.length || 0) === 0 ? (
              <Card className="glass border-border/50">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">¡Todo al día!</p>
                  <p className="text-muted-foreground">No hay pagos pendientes por verificar</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => {
                  const waitingMinutes = payment.minutes_waiting || 0;
                  
                  return (
                    <Card key={payment.payment_id} className="glass border-border/50 hover:border-primary/30 transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            {/* Payment Icon/Image indicator */}
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              {payment.screenshot_url ? (
                                <Image className="w-6 h-6 text-primary" />
                              ) : (
                                <CreditCard className="w-6 h-6 text-primary" />
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{payment.order_number}</p>
                                <Badge variant="secondary" className="bg-secondary/50 text-xs">
                                  {payment.method ? methodLabels[payment.method] || payment.method : 'N/A'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {payment.customer_name} • {payment.customer_phone}
                              </p>
                              <div className="flex items-center gap-2 text-sm">
                                <AlertCircle className={`w-4 h-4 ${getWaitingTimeColor(waitingMinutes)}`} />
                                <span className={getWaitingTimeColor(waitingMinutes)}>
                                  Esperando {Math.floor(waitingMinutes)} min
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-foreground">
                                Bs. {(payment.amount || 0).toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(payment.created_at)}
                              </p>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPayment(payment)}
                                className="gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                Ver
                              </Button>
                              {payment.method === 'efectivo' && (
                                <Button
                                  size="sm"
                                  className="bg-success hover:bg-success/90 gap-1"
                                  onClick={() => payment.payment_id && handleQuickConfirm(payment.payment_id)}
                                  disabled={updatePayment.isPending}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Confirmar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <PaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        payment={selectedPayment}
      />
    </DashboardLayout>
  );
}
