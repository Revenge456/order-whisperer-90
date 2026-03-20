import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Truck, 
  Package, 
  BarChart3, 
  UsersRound,
  Dumbbell,
  MessageSquare,
  Megaphone
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePagePermissions, useIsAdmin } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, pageKey: "dashboard" },
  { title: "Clientes", url: "/customers", icon: Users, pageKey: "customers" },
  { title: "Pedidos", url: "/orders", icon: ShoppingCart, pageKey: "orders" },
  { title: "Entregas", url: "/deliveries", icon: Truck, pageKey: "deliveries" },
  { title: "Productos", url: "/products", icon: Package, pageKey: "products" },
];

const secondaryNavItems = [
  { title: "Chats", url: "/chats", icon: MessageSquare, pageKey: "chats" },
  { title: "Reportes", url: "/reports", icon: BarChart3, pageKey: "reports" },
  { title: "Equipo", url: "/team", icon: UsersRound, pageKey: "team" },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { data: permissions, isLoading: permissionsLoading } = usePagePermissions();
  const isAdmin = useIsAdmin();

  const isActive = (path: string) => location.pathname === path;

  const canAccess = (pageKey: string) => {
    // Admin has access to everything
    if (isAdmin) return true;
    // Check page permissions
    return permissions?.[pageKey] ?? true;
  };

  const filteredMainItems = mainNavItems.filter((item) => canAccess(item.pageKey));
  const filteredSecondaryItems = secondaryNavItems.filter((item) => canAccess(item.pageKey));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground">Bolivia Fitness</span>
              <span className="text-xs text-muted-foreground">Panel de Control</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 text-xs uppercase tracking-wider">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {permissionsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <Skeleton className="h-10 w-full" />
                  </SidebarMenuItem>
                ))
              ) : (
                filteredMainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink 
                        to={item.url} 
                        className={`flex items-center gap-3 transition-all duration-200 ${
                          isActive(item.url) 
                            ? "text-primary bg-primary/10" 
                            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 text-xs uppercase tracking-wider">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {permissionsLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <Skeleton className="h-10 w-full" />
                  </SidebarMenuItem>
                ))
              ) : (
                filteredSecondaryItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink 
                        to={item.url} 
                        className={`flex items-center gap-3 transition-all duration-200 ${
                          isActive(item.url) 
                            ? "text-primary bg-primary/10" 
                            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!isCollapsed && (
          <div className="glass rounded-lg p-3">
            <p className="text-xs text-muted-foreground text-center">
              v1.0.0 • Bolivia Fitness
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
