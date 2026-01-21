import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, User, Copy, Check, Link } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const inviteSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "employee"]),
});

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserModal({ open, onOpenChange }: InviteUserModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "employee" as "admin" | "employee",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      inviteSchema.parse(formData);
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsLoading(true);
    setResetLink(null);

    try {
      // Get current session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("No hay sesión activa");
        return;
      }

      // Call edge function to create user
      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al crear usuario');
      }

      const data = response.data;

      if (!data.success) {
        throw new Error(data.error || 'Error al crear usuario');
      }

      // Store reset link if available
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }

      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Usuario creado exitosamente');

      // Don't close modal if we have a reset link to show
      if (!data.resetLink) {
        handleClose();
      }

    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      fullName: "",
      email: "",
      role: "employee",
    });
    setErrors({});
    setResetLink(null);
    setCopied(false);
    onOpenChange(false);
  };

  const copyResetLink = async () => {
    if (resetLink) {
      await navigator.clipboard.writeText(resetLink);
      setCopied(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {resetLink ? "Usuario Creado" : "Invitar Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {resetLink 
              ? "El usuario ha sido creado. Comparte el enlace de configuración de contraseña."
              : "Crea una cuenta para un nuevo miembro del equipo. Recibirás un enlace para compartir con el usuario."
            }
          </DialogDescription>
        </DialogHeader>

        {resetLink ? (
          <div className="py-4 space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Link className="w-4 h-4 text-primary" />
                <span>Enlace de configuración de contraseña:</span>
              </div>
              <div className="flex items-center gap-2">
                <Input 
                  value={resetLink} 
                  readOnly 
                  className="text-xs bg-background"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyResetLink}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Comparte este enlace con el usuario para que configure su contraseña.
                El enlace expira en 24 horas.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Juan Pérez"
                    className="pl-10 bg-input border-border"
                    required
                  />
                </div>
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="juan@ejemplo.com"
                    className="pl-10 bg-input border-border"
                    required
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "employee") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Empleado</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-border"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Usuario"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
