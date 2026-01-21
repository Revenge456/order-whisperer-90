import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TeamMember, CreateTeamMemberData, UpdateTeamMemberData } from "@/hooks/useTeam";

interface TeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember | null;
  onSave: (data: CreateTeamMemberData | UpdateTeamMemberData) => void;
  isLoading?: boolean;
}

export function TeamMemberModal({
  open,
  onOpenChange,
  member,
  onSave,
  isLoading,
}: TeamMemberModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "operator" as "admin" | "operator" | "viewer",
    is_active: true,
  });

  useEffect(() => {
    if (member) {
      setFormData({
        email: member.email || "",
        full_name: member.full_name || "",
        role: member.role || "operator",
        is_active: member.is_active ?? true,
      });
    } else {
      setFormData({
        email: "",
        full_name: "",
        role: "operator",
        is_active: true,
      });
    }
  }, [member, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (member) {
      onSave({
        id: member.id,
        ...formData,
      });
    } else {
      onSave(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {member ? "Editar Miembro" : "Nuevo Miembro del Equipo"}
          </DialogTitle>
          <DialogDescription>
            {member
              ? "Modifica los datos del miembro del equipo"
              : "Agrega un nuevo miembro al equipo"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="Juan Pérez"
                required
                className="bg-input border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="juan@ejemplo.com"
                required
                className="bg-input border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "operator" | "viewer") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="operator">Operador</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {member && (
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Activo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : member ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
