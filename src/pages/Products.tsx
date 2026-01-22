import { useState } from "react";
import { Plus, Search, Package, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts, useProductCategories, useLowStockProducts, useUpdateProduct } from "@/hooks/useProducts";
import { filterBySearch } from "@/lib/search-utils";
import { ProductModal } from "@/components/modals/ProductModal";
import { DynamicTable, RecordDetailSheet } from "@/components/dynamic-table";
import { useColumnDefinitions } from "@/hooks/useColumnDefinitions";
import { useIsAdmin } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<'products'>;

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: products, isLoading } = useProducts();
  const { data: categories } = useProductCategories();
  const { data: lowStockProducts } = useLowStockProducts();
  const { data: columns, isLoading: columnsLoading } = useColumnDefinitions('products');
  const updateProduct = useUpdateProduct();
  const isAdmin = useIsAdmin();

  const filteredProducts = filterBySearch(
    products?.filter(p => categoryFilter === "all" || p.category_id === categoryFilter) || [],
    searchTerm,
    ['name', 'description']
  );

  const handleNewProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleRowClick = (record: Record<string, unknown>) => {
    setSelectedRecord(record as unknown as Product);
    setIsDetailOpen(true);
  };

  const handleSave = async (updates: Partial<Record<string, unknown>>) => {
    if (!selectedRecord) return;
    try {
      await updateProduct.mutateAsync({
        id: selectedRecord.id,
        ...updates,
      });
      toast.success('Producto actualizado');
    } catch (error) {
      toast.error('Error al actualizar producto');
    }
  };

  const activeProducts = products?.filter(p => p.is_active).length || 0;
  const outOfStockProducts = products?.filter(p => p.stock === 0).length || 0;

  // Transform products for DynamicTable
  const tableData = filteredProducts.map((product: any) => ({
    ...product,
    category_name: product.product_categories?.name || 'Sin categoría',
  }));

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

        {/* Dynamic Products Table */}
        <DynamicTable
          moduleKey="products"
          data={tableData}
          isLoading={isLoading || columnsLoading}
          onRowClick={handleRowClick}
          getRowId={(row) => row.id as string}
          emptyMessage={searchTerm ? 'No se encontraron productos con ese criterio' : 'No hay productos registrados'}
        />
      </div>

      <ProductModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        product={editingProduct}
      />

      <RecordDetailSheet
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        record={selectedRecord as unknown as Record<string, unknown>}
        columns={columns || []}
        title={selectedRecord?.name || 'Detalle de Producto'}
        onSave={handleSave}
        canEdit={isAdmin}
        canDelete={false}
      />
    </DashboardLayout>
  );
}
