import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Bell, Webhook, Palette, Shield } from "lucide-react";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-1">Ajustes del sistema y preferencias</p>
        </div>

        <div className="grid gap-6">
          {/* General Settings */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-primary" />
                Configuración General
              </CardTitle>
              <CardDescription>Ajustes básicos del negocio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Nombre del Negocio</Label>
                  <Input
                    id="business_name"
                    defaultValue="Bolivia Fitness"
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono de Contacto</Label>
                  <Input
                    id="phone"
                    defaultValue="+591 70000000"
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="contacto@boliviafitness.com"
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_fee">Costo de Envío (Bs.)</Label>
                  <Input
                    id="delivery_fee"
                    type="number"
                    defaultValue="15"
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notificaciones
              </CardTitle>
              <CardDescription>Preferencias de alertas y notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Nuevos Pedidos</p>
                  <p className="text-sm text-muted-foreground">Recibir alerta cuando llegue un nuevo pedido</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Pagos Pendientes</p>
                  <p className="text-sm text-muted-foreground">Alertar cuando hay pagos por verificar</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Stock Bajo</p>
                  <p className="text-sm text-muted-foreground">Notificar cuando un producto tiene poco stock</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* N8N Integration */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5 text-primary" />
                Integración N8N
              </CardTitle>
              <CardDescription>Configuración de webhooks para automatizaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook_url">URL del Webhook N8N</Label>
                <Input
                  id="webhook_url"
                  placeholder="https://n8n.example.com/webhook/..."
                  className="bg-secondary/50 border-border/50"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Modo AI Automático</p>
                  <p className="text-sm text-muted-foreground">Procesar pedidos automáticamente con IA</p>
                </div>
                <Switch />
              </div>
              <Button variant="outline" className="w-full border-border/50">
                Probar Conexión
              </Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Seguridad
              </CardTitle>
              <CardDescription>Gestión de accesos y permisos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                La gestión de usuarios y roles estará disponible cuando se conecte Supabase.
              </p>
              <Button variant="outline" className="border-border/50" disabled>
                Gestionar Usuarios
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Guardar Cambios
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}