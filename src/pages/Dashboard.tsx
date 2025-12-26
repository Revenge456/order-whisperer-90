import { 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardStats, RecentActivity } from "@/types/database";

// Mock data - will be replaced with real data from Supabase
const stats: DashboardStats = {
  totalOrders: 156,
  pendingOrders: 12,
  todayRevenue: 4580,
  pendingPayments: 8,
  activeDeliveries: 5,
  lowStockProducts: 3,
};

const recentActivities: RecentActivity[] = [
  { id: "1", type: "order", message: "Nuevo pedido #1234 de Juan Pérez", timestamp: "Hace 5 min", status: "info" },
  { id: "2", type: "payment", message: "Pago confirmado para pedido #1230", timestamp: "Hace 15 min", status: "success" },
  { id: "3", type: "delivery", message: "Entrega completada - Pedido #1225", timestamp: "Hace 30 min", status: "success" },
  { id: "4", type: "order", message: "Pedido #1233 cancelado", timestamp: "Hace 1 hora", status: "error" },
  { id: "5", type: "payment", message: "Pago pendiente de verificación #1232", timestamp: "Hace 2 horas", status: "warning" },
];

const pendingOrders = [
  { id: "1234", customer: "Juan Pérez", total: 350, time: "10:30", status: "pending" },
  { id: "1235", customer: "María García", total: 520, time: "10:45", status: "confirmed" },
  { id: "1236", customer: "Carlos López", total: 180, time: "11:00", status: "preparing" },
  { id: "1237", customer: "Ana Rodríguez", total: 420, time: "11:15", status: "ready" },
];

export default function Dashboard() {
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
            value={stats.totalOrders}
            change={+12}
            icon={ShoppingCart}
            variant="primary"
            subtitle={`${stats.pendingOrders} pendientes`}
          />
          <StatsCard
            title="Ingresos Hoy"
            value={`Bs. ${stats.todayRevenue.toLocaleString()}`}
            change={+8}
            icon={TrendingUp}
            variant="success"
          />
          <StatsCard
            title="Pagos Pendientes"
            value={stats.pendingPayments}
            icon={CreditCard}
            variant="warning"
            subtitle="Por verificar"
          />
          <StatsCard
            title="Entregas Activas"
            value={stats.activeDeliveries}
            icon={Truck}
            variant="primary"
            subtitle="En ruta"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Orders */}
          <Card className="lg:col-span-2 glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pedidos Recientes</CardTitle>
                <CardDescription>Últimos pedidos del día</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {pendingOrders.length} activos
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Pedido #{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-foreground">Bs. {order.total}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {order.time}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Actividad Reciente</CardTitle>
              <CardDescription>Últimas actualizaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <ActivityIcon status={activity.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {stats.lowStockProducts > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {stats.lowStockProducts} productos con stock bajo
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
  value: string | number;
  change?: number;
  icon: React.ElementType;
  variant: "primary" | "success" | "warning" | "destructive";
  subtitle?: string;
}

function StatsCard({ title, value, change, icon: Icon, variant, subtitle }: StatsCardProps) {
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
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${variantStyles[variant]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        {change !== undefined && (
          <div className="mt-4 flex items-center gap-1">
            {change >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-success" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-destructive" />
            )}
            <span className={`text-sm font-medium ${change >= 0 ? "text-success" : "text-destructive"}`}>
              {change >= 0 ? "+" : ""}{change}%
            </span>
            <span className="text-xs text-muted-foreground">vs ayer</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Order Status Badge
function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/30",
    confirmed: "bg-primary/10 text-primary border-primary/30",
    preparing: "bg-chart-4/10 text-chart-4 border-chart-4/30",
    ready: "bg-success/10 text-success border-success/30",
    delivering: "bg-primary/10 text-primary border-primary/30",
    delivered: "bg-success/10 text-success border-success/30",
    cancelled: "bg-destructive/10 text-destructive border-destructive/30",
  };

  const labels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    preparing: "Preparando",
    ready: "Listo",
    delivering: "En Ruta",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };

  return (
    <Badge variant="outline" className={styles[status]}>
      {labels[status]}
    </Badge>
  );
}

// Activity Icon
function ActivityIcon({ status }: { status?: string }) {
  const colors: Record<string, string> = {
    success: "bg-success/20 border-success/30",
    warning: "bg-warning/20 border-warning/30",
    error: "bg-destructive/20 border-destructive/30",
    info: "bg-primary/20 border-primary/30",
  };

  return (
    <div className={`w-2 h-2 rounded-full mt-2 ${colors[status || "info"]}`} />
  );
}