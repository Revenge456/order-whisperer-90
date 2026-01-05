import { 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Package
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDashboardStats, useRecentOrders, useRecentActivity } from "@/hooks/useDashboard";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Enums } from "@/integrations/supabase/types";

type OrderStatus = Enums<'order_status'>;

const orderStatusConfig: Record<OrderStatus, { label: string; style: string }> = {
  nuevo: { label: "Nuevo", style: "bg-warning/10 text-warning border-warning/30" },
  confirmado: { label: "Confirmado", style: "bg-primary/10 text-primary border-primary/30" },
  en_entrega: { label: "En Entrega", style: "bg-chart-4/10 text-chart-4 border-chart-4/30" },
  completado: { label: "Completado", style: "bg-success/10 text-success border-success/30" },
  cancelado: { label: "Cancelado", style: "bg-destructive/10 text-destructive border-destructive/30" },
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders();
  const { data: notifications } = useRecentActivity();

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), "HH:mm", { locale: es });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Resumen general del negocio</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Pedidos Hoy"
            value={statsLoading ? null : stats?.totalOrdersToday || 0}
            icon={ShoppingCart}
            variant="primary"
            subtitle={`${stats?.pendingOrders || 0} pendientes`}
          />
          <StatsCard
            title="Ingresos Hoy"
            value={statsLoading ? null : `Bs. ${(stats?.todayRevenue || 0).toLocaleString()}`}
            icon={TrendingUp}
            variant="success"
          />
          <StatsCard
            title="Pagos Pendientes"
            value={statsLoading ? null : stats?.pendingPayments || 0}
            icon={CreditCard}
            variant="warning"
            subtitle={`Bs. ${(stats?.pendingPaymentsAmount || 0).toLocaleString()}`}
          />
          <StatsCard
            title="Entregas Activas"
            value={statsLoading ? null : stats?.activeDeliveries || 0}
            icon={Truck}
            variant="primary"
            subtitle="En ruta"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-2 glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pedidos Recientes</CardTitle>
                <CardDescription>Últimos pedidos del día</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {recentOrders?.length || 0} recientes
              </Badge>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !recentOrders?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay pedidos recientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_name || 'Sin nombre'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-foreground">Bs. {(order.total || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {formatTime(order.created_at)}
                          </p>
                        </div>
                        <Badge variant="outline" className={orderStatusConfig[order.status as OrderStatus]?.style}>
                          {orderStatusConfig[order.status as OrderStatus]?.label || order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity / Notifications */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Notificaciones</CardTitle>
              <CardDescription>Alertas del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {!notifications?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success opacity-50" />
                  <p>Sin notificaciones pendientes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.slice(0, 6).map((notification) => (
                    <div key={notification.id} className="flex items-start gap-3">
                      <NotificationIcon type={notification.notification_type} priority={notification.priority} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium truncate">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {(stats?.lowStockProducts || 0) > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {stats?.lowStockProducts} producto(s) con stock bajo
                </p>
                <p className="text-sm text-muted-foreground">
                  Revisa el inventario para evitar faltantes
                </p>
              </div>
              <Badge variant="outline" className="border-warning text-warning">
                Atención requerida
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number | null;
  icon: React.ElementType;
  variant: "primary" | "success" | "warning" | "destructive";
  subtitle?: string;
}

function StatsCard({ title, value, icon: Icon, variant, subtitle }: StatsCardProps) {
  const variantStyles = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <Card className="glass border-border/50 hover:border-border transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            {value === null ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{value}</p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${variantStyles[variant]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Notification Icon
function NotificationIcon({ type, priority }: { type: string; priority: string | null }) {
  const priorityColors: Record<string, string> = {
    critica: "bg-destructive/20 text-destructive",
    alta: "bg-warning/20 text-warning",
    media: "bg-primary/20 text-primary",
    baja: "bg-muted text-muted-foreground",
  };

  const icons: Record<string, React.ElementType> = {
    stock_bajo: AlertTriangle,
    pago_pendiente_largo: Clock,
  };

  const IconComponent = icons[type] || AlertTriangle;
  const color = priorityColors[priority || 'media'];

  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      <IconComponent className="w-4 h-4" />
    </div>
  );
}
