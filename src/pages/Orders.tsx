import { useState } from "react";
import { Search, Eye, Clock, CheckCircle, XCircle, Package, Image, CreditCard, AlertCircle, MapPin, ExternalLink, MessageCircle, ChevronDown, ChevronUp, ShoppingBag, Trash2 } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useOrders, usePendingPayments, useUpdatePayment, useDeleteOrder } from "@/hooks/useOrders";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { filterBySearch } from "@/lib/search-utils";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { PaymentStatusSelect } from "@/components/orders/PaymentStatusSelect";
import { PaymentReceiptButton } from "@/components/orders/PaymentReceiptButton";

import type { Enums } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type OrderStatus = Enums<'order_status'>;

interface ProductItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const orderStatusConfig: Record<OrderStatus, { label: string; style: string; icon: React.ElementType }> = {
  nuevo: { label: "Nuevo", style: "bg-warning/10 text-warning border-warning/30", icon: Clock },
  confirmado: { label: "Confirmado", style: "bg-primary/10 text-primary border-primary/30", icon: CheckCircle },
  en_entrega: { label: "En Entrega", style: "bg-chart-4/10 text-chart-4 border-chart-4/30", icon: Package },
  completado: { label: "Completado", style: "bg-success/10 text-success border-success/30", icon: CheckCircle },
  cancelado: { label: "Cancelado", style: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
};

const methodLabels: Record<string, string> = {
  qr: "QR",
  efectivo: "Efectivo",
};

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);

  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: pendingPayments, isLoading: paymentsLoading } = usePendingPayments();
  const updatePayment = useUpdatePayment();
  const deleteOrder = useDeleteOrder();

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

  const handleViewPayment = (payment: any) => {
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

  const openWhatsApp = (phone: string | null) => {
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleaned}`, '_blank');
  };

  const renderProducts = (products: ProductItem[] | null) => {
    if (!products || products.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
    return (
      <div className="space-y-0.5">
        {products.map((p, i) => (
          <div key={i} className="text-xs">
            <span className="font-medium text-foreground">{p.quantity}x</span>{' '}
            <span className="text-foreground">{p.product_name}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderLocation = (address: string | null, locationUrl: string | null) => {
    if (!address && !locationUrl) return <span className="text-muted-foreground text-xs">—</span>;
    return (
      <div className="space-y-1">
        {address && <p className="text-xs text-foreground max-w-[150px] truncate">{address}</p>}
        {locationUrl && (
          <a
            href={locationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <MapPin className="w-3 h-3" />
            Ver mapa
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50">
                          <TableHead>Pedido</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Productos</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Pago</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Ubicación</TableHead>
                          <TableHead>Nota / Accesorio</TableHead>
                          <TableHead>Comprobante</TableHead>
                          <TableHead className="text-right">Fecha</TableHead>
                          <TableHead className="w-[80px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                              No hay pedidos que coincidan
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredOrders.map((order) => {
                            const orderStatus = order.status as OrderStatus;
                            const StatusIcon = orderStatusConfig[orderStatus]?.icon || Clock;
                            const products = (order as any).products as ProductItem[] | null;
                            const isExpanded = expandedOrderId === order.id;
                            const totalItems = products?.reduce((sum, p) => sum + p.quantity, 0) || 0;

                            return (
                              <>
                                <TableRow
                                  key={order.id}
                                  className="border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                >
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                      <p className="font-medium text-foreground text-sm">{order.order_number}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-foreground text-sm">{order.customer_name || 'Sin nombre'}</p>
                                      <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span className="text-sm font-medium text-foreground">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={`${orderStatusConfig[orderStatus]?.style} text-xs`}>
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
                                      customerId={order.customer_id}
                                      customerName={order.customer_name}
                                      customerPhone={order.customer_phone}
                                      amount={order.payment_amount}
                                      products={order.products as unknown[] | null}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="font-medium text-foreground text-sm">
                                      Bs. {(order.total || 0).toLocaleString()}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {renderLocation(order.delivery_address, order.location_url)}
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-xs text-foreground max-w-[150px] truncate block">
                                      {order.order_notes || '—'}
                                    </span>
                                  </TableCell>
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    <PaymentReceiptButton
                                      screenshotUrl={order.screenshot_url}
                                      orderNumber={order.order_number}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(order.created_at)}
                                    </span>
                                  </TableCell>
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-1">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-success hover:text-success/80"
                                              onClick={() => openWhatsApp(order.customer_phone)}
                                            >
                                              <MessageCircle className="w-4 h-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Abrir WhatsApp</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-destructive hover:text-destructive/80"
                                              onClick={() => setDeleteOrderId(order.id!)}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Eliminar pedido</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </TableCell>
                                </TableRow>

                                {/* Expanded detail row */}
                                {isExpanded && (
                                  <TableRow key={`${order.id}-detail`} className="bg-secondary/20 border-border/30">
                                    <TableCell colSpan={11} className="p-0">
                                      <div className="px-6 py-4 animate-fade-in">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                          {/* Products detail */}
                                          <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                              <ShoppingBag className="w-4 h-4 text-primary" />
                                              Productos ({totalItems} unidades)
                                            </h4>
                                            {products && products.length > 0 ? (
                                              <div className="space-y-2">
                                                {products.map((p, i) => (
                                                  <div key={i} className="flex items-center justify-between bg-background/60 rounded-lg px-3 py-2 border border-border/30">
                                                    <div>
                                                      <p className="text-sm font-medium text-foreground">{p.product_name}</p>
                                                      <p className="text-xs text-muted-foreground">Bs. {p.unit_price?.toLocaleString()} c/u</p>
                                                    </div>
                                                    <div className="text-right">
                                                      <Badge variant="secondary" className="text-xs">{p.quantity}x</Badge>
                                                      <p className="text-xs font-medium text-foreground mt-0.5">Bs. {p.subtotal?.toLocaleString()}</p>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-xs text-muted-foreground">Sin productos registrados</p>
                                            )}
                                          </div>

                                          {/* Delivery & Location */}
                                          <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                              <MapPin className="w-4 h-4 text-primary" />
                                              Entrega
                                            </h4>
                                            <div className="bg-background/60 rounded-lg px-3 py-2 border border-border/30 space-y-2">
                                              <div>
                                                <p className="text-xs text-muted-foreground">Dirección</p>
                                                <p className="text-sm text-foreground">{order.delivery_address || order.customer_address || '—'}</p>
                                              </div>
                                              {order.location_url && (
                                                <a
                                                  href={order.location_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                                                >
                                                  <MapPin className="w-4 h-4" />
                                                  Abrir en Google Maps
                                                  <ExternalLink className="w-3 h-3" />
                                                </a>
                                              )}
                                              {order.driver_name && (
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Repartidor</p>
                                                  <p className="text-sm text-foreground">{order.driver_name} {order.driver_phone ? `· ${order.driver_phone}` : ''}</p>
                                                </div>
                                              )}
                                            </div>
                                            {order.order_notes && (
                                              <div className="bg-background/60 rounded-lg px-3 py-2 border border-border/30">
                                                <p className="text-xs text-muted-foreground">Nota / Accesorio gratis</p>
                                                <p className="text-sm text-foreground">{order.order_notes}</p>
                                              </div>
                                            )}
                                          </div>

                                          {/* Payment detail */}
                                          <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                              <CreditCard className="w-4 h-4 text-primary" />
                                              Pago
                                            </h4>
                                            <div className="bg-background/60 rounded-lg px-3 py-2 border border-border/30 space-y-2">
                                              <div className="flex justify-between">
                                                <span className="text-xs text-muted-foreground">Método</span>
                                                <span className="text-sm font-medium text-foreground">{methodLabels[order.payment_method || ''] || order.payment_method || '—'}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-xs text-muted-foreground">Monto</span>
                                                <span className="text-sm font-medium text-foreground">Bs. {(order.payment_amount || order.total || 0).toLocaleString()}</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground">Estado</span>
                                                <Badge variant="outline" className="text-xs">
                                                  {order.payment_status || '—'}
                                                </Badge>
                                              </div>
                                              {order.screenshot_url && (
                                                <div className="pt-1">
                                                  <p className="text-xs text-muted-foreground mb-1">Comprobante</p>
                                                  <a href={order.screenshot_url} target="_blank" rel="noopener noreferrer">
                                                    <img
                                                      src={order.screenshot_url}
                                                      alt="Comprobante de pago"
                                                      className="rounded-md border border-border/50 max-h-32 object-cover hover:opacity-80 transition-opacity"
                                                    />
                                                  </a>
                                                </div>
                                              )}
                                            </div>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="w-full text-success border-success/30 hover:bg-success/10"
                                              onClick={(e) => { e.stopPropagation(); openWhatsApp(order.customer_phone); }}
                                            >
                                              <MessageCircle className="w-4 h-4 mr-2" />
                                              Contactar por WhatsApp
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
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

      <AlertDialog open={!!deleteOrderId} onOpenChange={(open) => !open && setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el pedido junto con sus items, pago y entrega asociados. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteOrder.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteOrderId) {
                  deleteOrder.mutate(deleteOrderId, {
                    onSuccess: () => setDeleteOrderId(null),
                  });
                }
              }}
              disabled={deleteOrder.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOrder.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
