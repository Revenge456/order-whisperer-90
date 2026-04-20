import { Bell, User, LogOut, Shield, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useSession, useUserRole, useSignOut } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { GlobalSearch } from "@/components/layout/GlobalSearch";

export function DashboardHeader() {
  const { user, loading: sessionLoading } = useSession();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const { notifications, unreadCount, isRead, markAsRead, markAllAsRead, isLoading: notifLoading } =
    useNotifications(3);

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    navigate("/auth");
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";
  const isAdmin = role === "admin";

  if (sessionLoading) {
    return (
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-semibold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 p-0">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
              <DropdownMenuLabel className="p-0 text-sm">Notificaciones</DropdownMenuLabel>
              {unreadCount > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    markAllAsRead();
                  }}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Marcar todas
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto p-1">
              {notifLoading ? (
                <div className="p-3 space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <p className="text-3xl mb-2">🎉</p>
                  <p className="text-sm text-foreground font-medium">
                    Todo al día, no hay pendientes
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <NotificationItem
                    key={`${n.kind}-${n.id}`}
                    notification={n}
                    isRead={isRead(n.id)}
                    onClick={() => markAsRead(n.id)}
                  />
                ))
              )}
            </div>
            <DropdownMenuSeparator className="my-0" />
            <DropdownMenuItem
              className="justify-center text-sm text-primary cursor-pointer py-2.5"
              onClick={() => navigate("/notifications")}
            >
              Ver todas las notificaciones
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{displayName}</span>
                {!roleLoading && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {isAdmin && <Shield className="w-3 h-3" />}
                    {isAdmin ? "Admin" : "Empleado"}
                  </span>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{displayName}</span>
                <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                {!roleLoading && (
                  <Badge variant="outline" className={`mt-2 w-fit ${isAdmin ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted text-muted-foreground'}`}>
                    {isAdmin ? "Administrador" : "Empleado"}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleSignOut}
              disabled={signOut.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {signOut.isPending ? "Cerrando..." : "Cerrar Sesión"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
