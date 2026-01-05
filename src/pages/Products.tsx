import { useState } from "react";
import { Plus, Search, Edit, Package, AlertTriangle, MoreHorizontal } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts, useProductCategories, useLowStockProducts } from "@/hooks/useProducts";
import { filterBySearch } from "@/lib/search-utils";
import { ProductModal } from "@/components/modals/ProductModal";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<'products'>;

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data: products, isLoading } = useProducts();
  const { data: categories } = useProductCategories();
  const { data: lowStockProducts } = useLowStockProducts();

  const filteredProducts = filterBySearch(
    products?.filter(p => categoryFilter === "all" || p.category_id === categoryFilter) || [],
    searchTerm,
    ['name', 'description']
  );

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const activeProducts = products?.filter(p => p.is_active).length || 0;
  const outOfStockProducts = products?.filter(p => p.stock === 0).length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Productos</h1>
            <p className="text-muted-foreground mt-1">Inventario y catálogo de productos</p>
          </div>
          <Button onClick={handleNewProduct} className="bg-primary text-primary-foreground hover:bg-primary/90">
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
                  placeholder="Buscar productos... (ignora acentos)"
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
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
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
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? <Skeleton className="h-8 w-16" /> : products?.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Activos</p>
              <p className="text-2xl font-bold text-success">
                {isLoading ? <Skeleton className="h-8 w-16" /> : activeProducts}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50 border-warning/30">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Stock Bajo</p>
              <p className="text-2xl font-bold text-warning">
                {isLoading ? <Skeleton className="h-8 w-16" /> : lowStockProducts?.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50 border-destructive/30">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Sin Stock</p>
              <p className="text-2xl font-bold text-destructive">
                {isLoading ? <Skeleton className="h-8 w-16" /> : outOfStockProducts}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {(lowStockProducts?.length || 0) > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {lowStockProducts?.length} producto(s) con stock bajo
                </p>
                <p className="text-sm text-muted-foreground">
                  {lowStockProducts?.slice(0, 3).map(p => p.name).join(", ")}
                  {(lowStockProducts?.length || 0) > 3 && '...'}
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
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'No se encontraron productos con ese criterio' : 'No hay productos registrados'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product: any) => {
                      const isLowStock = product.stock <= (product.low_stock_threshold || 5) && product.stock > 0;
                      const isOutOfStock = product.stock === 0;

                      return (
                        <TableRow key={product.id} className="border-border/50 hover:bg-secondary/30">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                                <Package className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <div>
                                <span className="font-medium text-foreground">{product.name}</span>
                                {product.description && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {product.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-secondary/50">
                              {product.product_categories?.name || 'Sin categoría'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium text-foreground">
                              Bs. {product.price?.toLocaleString()}
                            </span>
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
                                <DropdownMenuItem onClick={() => handleEdit(product)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ProductModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        product={editingProduct}
      />
    </DashboardLayout>
  );
}
