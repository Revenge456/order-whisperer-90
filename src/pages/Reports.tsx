import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Reports() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reportes</h1>
            <p className="text-muted-foreground mt-1">Análisis y estadísticas del negocio</p>
          </div>
          <Button variant="outline" className="border-border/50">
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Ventas por Período
              </CardTitle>
              <CardDescription>Resumen de ventas diarias, semanales y mensuales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Gráfico de ventas - Conectar con Supabase
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Productos Más Vendidos
              </CardTitle>
              <CardDescription>Top 10 productos por volumen de ventas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Gráfico de productos - Conectar con Supabase
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Rendimiento por Ciudad</CardTitle>
              <CardDescription>Distribución de ventas por ubicación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Mapa de calor - Conectar con Supabase
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Métricas de Entrega</CardTitle>
              <CardDescription>Tiempos promedio y eficiencia de entregas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Métricas de entrega - Conectar con Supabase
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}