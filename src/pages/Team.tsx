import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Users, Shield, UserCheck } from "lucide-react";
import { useTeam, TeamMember, CreateTeamMemberData, UpdateTeamMemberData } from "@/hooks/useTeam";
import { TeamMemberModal } from "@/components/modals/TeamMemberModal";
import { filterBySearch } from "@/lib/search-utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Team() {
  const { teamMembers, isLoading, createMember, updateMember, deleteMember } = useTeam();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const filteredMembers = filterBySearch(
    teamMembers,
    searchQuery,
    ["full_name", "email", "role"]
  );

  const handleCreateMember = () => {
    setSelectedMember(null);
    setIsModalOpen(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleSaveMember = (data: CreateTeamMemberData | UpdateTeamMemberData) => {
    if ("id" in data) {
      updateMember.mutate(data, {
        onSuccess: () => setIsModalOpen(false),
      });
    } else {
      createMember.mutate(data, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  const handleDeleteClick = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (memberToDelete) {
      deleteMember.mutate(memberToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setMemberToDelete(null);
        },
      });
    }
  };

  const getRoleBadge = (role: string | null) => {
    const roleConfig = {
      admin: { label: "Administrador", className: "bg-primary/20 text-primary border-primary/30" },
      operator: { label: "Operador", className: "bg-success/20 text-success border-success/30" },
      viewer: { label: "Visualizador", className: "bg-muted text-muted-foreground border-border" },
    };
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: teamMembers.length,
    admins: teamMembers.filter((m) => m.role === "admin").length,
    active: teamMembers.filter((m) => m.is_active).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Equipo</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona los miembros de tu equipo y sus permisos
            </p>
          </div>
          <Button onClick={handleCreateMember} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Miembro
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Miembros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/20">
                  <Shield className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
                  <p className="text-sm text-muted-foreground">Administradores</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/20">
                  <UserCheck className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card className="glass border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg">Miembros del Equipo</CardTitle>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, email o rol..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input border-border"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? "No se encontraron miembros con ese criterio"
                  : "No hay miembros del equipo aún"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Último Acceso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id} className="border-border/50">
                        <TableCell className="font-medium text-foreground">
                          {member.full_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.email}
                        </TableCell>
                        <TableCell>{getRoleBadge(member.role)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              member.is_active
                                ? "bg-success/20 text-success border-success/30"
                                : "bg-destructive/20 text-destructive border-destructive/30"
                            }
                          >
                            {member.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.last_login
                            ? format(new Date(member.last_login), "dd MMM yyyy HH:mm", {
                                locale: es,
                              })
                            : "Nunca"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem
                                onClick={() => handleEditMember(member)}
                                className="gap-2"
                              >
                                <Pencil className="w-4 h-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(member)}
                                className="gap-2 text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TeamMemberModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        member={selectedMember}
        onSave={handleSaveMember}
        isLoading={createMember.isPending || updateMember.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente a{" "}
              <strong>{memberToDelete?.full_name}</strong> del equipo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
