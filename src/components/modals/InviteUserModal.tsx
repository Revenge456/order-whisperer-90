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
import { Loader2, Mail, User, Lock, Copy, Check, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const inviteSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(["admin", "employee"]),
});

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreatedUserData {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

export function InviteUserModal({ open, onOpenChange }: InviteUserModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "employee" as "admin" | "employee",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreatedUserData | null>(null);
  const [copied, setCopied] = useState<"email" | "password" | "all" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure at least one uppercase, one number
    password = password.slice(0, 10) + "A1";
    setFormData({ ...formData, password });
  };

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

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("No hay sesión activa");
        return;
      }

      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
          temporaryPassword: formData.password,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al crear usuario');
      }

      const data = response.data;

      if (!data.success) {
        throw new Error(data.error || 'Error al crear usuario');
      }

      // Store created user data to show credentials
      setCreatedUser({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role === 'admin' ? 'Administrador' : 'Empleado',
      });

      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Usuario creado exitosamente');

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
      password: "",
      role: "employee",
    });
    setErrors({});
    setCreatedUser(null);
    setCopied(null);
    setShowPassword(false);
    onOpenChange(false);
  };

  const copyToClipboard = async (text: string, type: "email" | "password" | "all") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAllCredentials = () => {
    if (createdUser) {
      const text = `Credenciales de acceso:\nEmail: ${createdUser.email}\nContraseña: ${createdUser.password}`;
      copyToClipboard(text, "all");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {createdUser ? "¡Usuario Creado!" : "Crear Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {createdUser 
              ? "Comparte estas credenciales con el nuevo miembro del equipo."
              : "Ingresa los datos del nuevo miembro. Podrás establecer su contraseña inicial."
            }
          </DialogDescription>
        </DialogHeader>

        {createdUser ? (
          <div className="py-4 space-y-4">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-2">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{createdUser.fullName}</h3>
                <p className="text-sm text-muted-foreground">{createdUser.role}</p>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={createdUser.email} 
                        readOnly 
                        className="text-sm bg-background font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(createdUser.email, "email")}
                      >
                        {copied === "email" ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Contraseña</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="relative flex-1">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          value={createdUser.password} 
                          readOnly 
                          className="text-sm bg-background font-mono pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(createdUser.password, "password")}
                      >
                        {copied === "password" ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={copyAllCredentials} 
              variant="outline" 
              className="w-full"
            >
              {copied === "all" ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-primary" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar todas las credenciales
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Envía estas credenciales de forma segura al nuevo usuario. 
              Puede cambiar su contraseña después de iniciar sesión.
            </p>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
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
                <Label htmlFor="password">Contraseña Inicial</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Mínimo 8 caracteres"
                      className="pl-10 pr-10 bg-input border-border"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                  >
                    Generar
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                <p className="text-xs text-muted-foreground">
                  Puedes escribir una contraseña o generar una automáticamente.
                </p>
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
