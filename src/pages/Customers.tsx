import { useState } from "react";
import { Plus, Search, MoreHorizontal, Phone, Mail, MapPin, Edit, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// Mock data
const customers = [
  {
    id: "1",
    full_name: "Juan Pérez",
    phone: "+591 70012345",
    email: "juan@email.com",
    city: "La Paz",
    address: "Av. 6 de Agosto #1234",
    total_orders: 15,
    total_spent: 4500,
    created_at: "2024-01-15",
  },
  {
    id: "2",
    full_name: "María García",
    phone: "+591 70123456",
    email: "maria@email.com",
    city: "Santa Cruz",
    address: "Calle Junín #567",
    total_orders: 8,
    total_spent: 2800,
    created_at: "2024-02-20",
  },
  {
    id: "3",
    full_name: "Carlos López",
    phone: "+591 70234567",
    email: null,
    city: "Cochabamba",
    address: "Av. América #890",
    total_orders: 22,
    total_spent: 7200,
    created_at: "2023-11-10",
  },
  {
    id: "4",
    full_name: "Ana Rodríguez",
    phone: "+591 70345678",
    email: "ana.r@email.com",
    city: "La Paz",
    address: "Zona Sur, Calle 21",
    total_orders: 5,
    total_spent: 1500,
    created_at: "2024-03-05",
  },
];

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">Gestiona tu base de clientes</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="glass border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, teléfono o ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Clientes</p>
              <p className="text-2xl font-bold text-foreground">{customers.length}</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Clientes Activos (30d)</p>
              <p className="text-2xl font-bold text-foreground">12</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Ticket Promedio</p>
              <p className="text-2xl font-bold text-foreground">Bs. 320</p>
            </CardContent>
          </Card>
        </div>

        {/* Customers Table */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              {filteredCustomers.length} cliente(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Total Gastado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="border-border/50 hover:bg-secondary/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {customer.full_name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{customer.full_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {customer.address}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1 text-foreground">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {customer.phone}
                        </p>
                        {customer.email && (
                          <p className="text-xs flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-secondary/50">
                        {customer.city}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-foreground">{customer.total_orders}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-success">
                        Bs. {customer.total_spent.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}