import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Shield, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Permission {
  id: string;
  role: string;
  page_key: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface PermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  customers: "Clientes",
  orders: "Pedidos",
  deliveries: "Entregas",
  products: "Productos",
  reports: "Reportes",
  team: "Equipo",
};

export function PermissionsModal({ open, onOpenChange }: PermissionsModalProps) {
  const queryClient = useQueryClient();
  const [activeRole, setActiveRole] = useState<"admin" | "employee">("employee");
  const [localPermissions, setLocalPermissions] = useState<Permission[]>([]);

  const { data: permissions, isLoading } = useQuery({
    queryKey: ["all-action-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_permissions")
        .select("*")
        .order("page_key");

      if (error) throw error;
      return data as Permission[];
    },
    enabled: open,
  });

  useEffect(() => {
    if (permissions) {
      setLocalPermissions(permissions);
    }
  }, [permissions]);

  const updatePermissionsMutation = useMutation({
    mutationFn: async (updatedPermissions: Permission[]) => {
      const updates = updatedPermissions.map((perm) =>
        supabase
          .from("action_permissions")
          .update({
            can_create: perm.can_create,
            can_read: perm.can_read,
            can_update: perm.can_update,
            can_delete: perm.can_delete,
          })
          .eq("id", perm.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-action-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["action-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["page-permissions"] });
      toast.success("Permisos actualizados correctamente");
    },
    onError: (error) => {
      toast.error("Error al actualizar permisos: " + error.message);
    },
  });

  const handleTogglePermission = (
    permissionId: string,
    field: "can_create" | "can_read" | "can_update" | "can_delete",
    value: boolean
  ) => {
    setLocalPermissions((prev) =>
      prev.map((perm) =>
        perm.id === permissionId ? { ...perm, [field]: value } : perm
      )
    );
  };

  const handleSave = () => {
    updatePermissionsMutation.mutate(localPermissions);
  };

  const rolePermissions = localPermissions.filter((p) => p.role === activeRole);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Gestión de Permisos
          </DialogTitle>
          <DialogDescription>
            Configura los permisos de acceso y acciones para cada rol del sistema
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeRole} onValueChange={(v) => setActiveRole(v as "admin" | "employee")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin" className="gap-2">
              <Shield className="w-4 h-4" />
              Administrador
            </TabsTrigger>
            <TabsTrigger value="employee" className="gap-2">
              <Users className="w-4 h-4" />
              Empleado
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeRole} className="mt-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              rolePermissions.map((perm) => (
                <Card key={perm.id} className="bg-secondary/50 border-border">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">
                      {PAGE_LABELS[perm.page_key] || perm.page_key}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`${perm.id}-read`} className="text-sm">
                          Leer
                        </Label>
                        <Switch
                          id={`${perm.id}-read`}
                          checked={perm.can_read}
                          onCheckedChange={(v) =>
                            handleTogglePermission(perm.id, "can_read", v)
                          }
                          disabled={activeRole === "admin"} // Admin siempre tiene acceso total
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`${perm.id}-create`} className="text-sm">
                          Crear
                        </Label>
                        <Switch
                          id={`${perm.id}-create`}
                          checked={perm.can_create}
                          onCheckedChange={(v) =>
                            handleTogglePermission(perm.id, "can_create", v)
                          }
                          disabled={activeRole === "admin"}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`${perm.id}-update`} className="text-sm">
                          Editar
                        </Label>
                        <Switch
                          id={`${perm.id}-update`}
                          checked={perm.can_update}
                          onCheckedChange={(v) =>
                            handleTogglePermission(perm.id, "can_update", v)
                          }
                          disabled={activeRole === "admin"}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`${perm.id}-delete`} className="text-sm">
                          Eliminar
                        </Label>
                        <Switch
                          id={`${perm.id}-delete`}
                          checked={perm.can_delete}
                          onCheckedChange={(v) =>
                            handleTogglePermission(perm.id, "can_delete", v)
                          }
                          disabled={activeRole === "admin"}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {activeRole === "admin" && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 inline mr-2 text-primary" />
                  Los administradores tienen acceso total al sistema. Los permisos no pueden ser modificados.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updatePermissionsMutation.isPending || activeRole === "admin"}
          >
            {updatePermissionsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
