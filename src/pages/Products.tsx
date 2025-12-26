import { useState } from "react";
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

// Mock data
const products = [
  {
    id: "1",
    name: "Proteína Whey Gold Standard",
    category: "protein",
    price: 450,
    cost: 320,
    stock: 25,
    min_stock: 10,
    is_active: true,
  },
  {
    id: "2",
    name: "Creatina Monohidrato 500g",
    category: "supplement",
    price: 180,
    cost: 120,
    stock: 8,
    min_stock: 15,
    is_active: true,
  },
  {
    id: "3",
    name: "Pre-Workout C4 Original",
    category: "supplement",
    price: 320,
    cost: 220,
    stock: 12,
    min_stock: 10,
    is_active: true,
  },
  {
    id: "4",
    name: "BCAA Powder 300g",
    category: "supplement",
    price: 150,
    cost: 90,
    stock: 3,
    min_stock: 10,
    is_active: true,
  },
  {
    id: "5",
    name: "Shaker Bottle 600ml",
    category: "accessory",
    price: 45,
    cost: 25,
    stock: 50,
    min_stock: 20,
    is_active: true,
  },
  {
    id: "6",
    name: "Guantes de Entrenamiento",
    category: "accessory",
    price: 80,
    cost: 45,
    stock: 0,
    min_stock: 10,
    is_active: false,
  },
];

const categoryLabels: Record<string, string> = {
  protein: "Proteína",
  supplement: "Suplemento",
  accessory: "Accesorio",
  meal: "Comida",
  other: "Otro",
};

const categoryStyles: Record<string, string> = {
  protein: "bg-primary/10 text-primary border-primary/30",
  supplement: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  accessory: "bg-success/10 text-success border-success/30",
  meal: "bg-warning/10 text-warning border-warning/30",
  other: "bg-muted text-muted-foreground",
};

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = products.filter((p) => p.stock <= p.min_stock && p.is_active);
  const outOfStockProducts = products.filter((p) => p.stock === 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Productos</h1>
            <p className="text-muted-foreground mt-1">Inventario y catálogo de productos</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="glass border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="protein">Proteína</SelectItem>
                  <SelectItem value="supplement">Suplemento</SelectItem>
                  <SelectItem value="accessory">Accesorio</SelectItem>
                  <SelectItem value="meal">Comida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Productos</p>
              <p className="text-2xl font-bold text-foreground">{products.length}</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Activos</p>
              <p className="text-2xl font-bold text-success">
                {products.filter((p) => p.is_active).length}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50 border-warning/30">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Stock Bajo</p>
              <p className="text-2xl font-bold text-warning">{lowStockProducts.length}</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50 border-destructive/30">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Sin Stock</p>
              <p className="text-2xl font-bold text-destructive">{outOfStockProducts.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {lowStockProducts.length} producto(s) con stock bajo
                </p>
                <p className="text-sm text-muted-foreground">
                  {lowStockProducts.map((p) => p.name).join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Table */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Catálogo de Productos</CardTitle>
            <CardDescription>
              {filteredProducts.length} producto(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isLowStock = product.stock <= product.min_stock && product.stock > 0;
                  const isOutOfStock = product.stock === 0;

                  return (
                    <TableRow key={product.id} className="border-border/50 hover:bg-secondary/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-foreground">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={categoryStyles[product.category]}>
                          {categoryLabels[product.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-foreground">
                          Bs. {product.price}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground">Bs. {product.cost}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-medium ${
                            isOutOfStock
                              ? "text-destructive"
                              : isLowStock
                              ? "text-warning"
                              : "text-foreground"
                          }`}
                        >
                          {product.stock}
                          {isLowStock && !isOutOfStock && (
                            <AlertTriangle className="w-3 h-3 inline ml-1" />
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            product.is_active
                              ? "bg-success/10 text-success border-success/30"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {product.is_active ? "Activo" : "Inactivo"}
                        </Badge>
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
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}