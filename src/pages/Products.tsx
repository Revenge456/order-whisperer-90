import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, AlertTriangle } from "lucide-react";
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
import {
  usePaginatedProducts,
  useProductCounts,
  useProductCategories,
  useLowStockProducts,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/useProducts";
import { ProductModal } from "@/components/modals/ProductModal";
import { ProductImageLightbox } from "@/components/products/ProductImageLightbox";
import { ProductImageUpload } from "@/components/products/ProductImageUpload";
import { DynamicTable, RecordDetailSheet } from "@/components/dynamic-table";
import { TablePagination } from "@/components/ui/table-pagination";
import { useColumnDefinitions } from "@/hooks/useColumnDefinitions";
import { useIsAdmin } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<'products'>;

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const DEFAULT_PAGE_SIZE = 50;

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = (() => {
    const ps = Number(searchParams.get('size')) || DEFAULT_PAGE_SIZE;
    return PAGE_SIZE_OPTIONS.includes(ps) ? ps : DEFAULT_PAGE_SIZE;
  })();

  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get('cat') ?? 'all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [infoDraft, setInfoDraft] = useState('');

  // Sync info textarea when selectedRecord changes
  useEffect(() => {
    const cf = (selectedRecord?.custom_fields || {}) as Record<string, unknown>;
    setInfoDraft(typeof cf.info === 'string' ? cf.info : '');
  }, [selectedRecord?.id]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 + sync URL when search/category changes
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', '1');
      if (debouncedSearch) next.set('q', debouncedSearch); else next.delete('q');
      if (categoryFilter && categoryFilter !== 'all') next.set('cat', categoryFilter); else next.delete('cat');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, categoryFilter]);

  const updatePageInUrl = (nextPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(nextPage));
      return next;
    }, { replace: true });
  };

  const updatePageSizeInUrl = (nextSize: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('size', String(nextSize));
      next.set('page', '1');
      return next;
    }, { replace: true });
  };

  const { data: paginated, isLoading, isFetching } = usePaginatedProducts({
    page,
    pageSize,
    search: debouncedSearch,
    categoryId: categoryFilter,
  });
  const { data: counts } = useProductCounts();
  const { data: categories } = useProductCategories();
  const { data: lowStockProducts } = useLowStockProducts();
  const { data: columns, isLoading: columnsLoading } = useColumnDefinitions('products');
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const isAdmin = useIsAdmin();

  const rows = paginated?.rows ?? [];
  const total = paginated?.total ?? 0;
  const totalPages = paginated?.totalPages ?? 1;

  // Snap back if page > totalPages
  useEffect(() => {
    if (!paginated) return;
    if (page > paginated.totalPages) {
      updatePageInUrl(paginated.totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginated?.totalPages]);

  // Listen for lightbox events from CellRenderer
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.url) setLightboxImage({ url: detail.url, name: '' });
    };
    window.addEventListener('product-image-lightbox', handler);
    return () => window.removeEventListener('product-image-lightbox', handler);
  }, []);

  // Handle ?highlight={product_id} from global search → open detail sheet
  const highlightId = searchParams.get('highlight');
  useEffect(() => {
    if (!highlightId) return;
    let cancelled = false;
    (async () => {
      // Try to find in current page first
      const local = rows.find((p: any) => p.id === highlightId);
      if (local) {
        setSelectedRecord(local as Product);
        setIsDetailOpen(true);
      } else {
        // Fetch directly by id (works even if it's on another page)
        const { data } = await supabase
          .from('products')
          .select('*, product_categories(name)')
          .eq('id', highlightId)
          .maybeSingle();
        if (cancelled || !data) return;
        setSelectedRecord(data as unknown as Product);
        setIsDetailOpen(true);
      }
      // Clean URL param
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('highlight');
        return next;
      }, { replace: true });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId]);

  const handleNewProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleRowClick = (record: Record<string, unknown>) => {
    setSelectedRecord(record as unknown as Product);
    setIsDetailOpen(true);
  };

  const handleImageChange = (url: string | null, resetPhotoId: boolean) => {
    if (!selectedRecord) return;
    const updates: Record<string, unknown> = { image_url: url };
    if (resetPhotoId) updates.photo_id = null;
    handleSave(updates);
    setSelectedRecord(prev => prev ? { ...prev, image_url: url, photo_id: resetPhotoId ? null : prev.photo_id } : null);
  };

  const handleSave = async (updates: Partial<Record<string, unknown>>) => {
    if (!selectedRecord) return;
    const validFields = ['name', 'description', 'price', 'stock', 'low_stock_threshold', 'category_id', 'is_active', 'image_url', 'photo_id', 'custom_fields'];
    const filtered: Record<string, unknown> = {};
    for (const key of validFields) {
      if (key in updates) {
        filtered[key] = updates[key];
      }
    }
    try {
      await updateProduct.mutateAsync({
        id: selectedRecord.id,
        ...filtered,
      });
      toast.success('Producto actualizado');
    } catch (error) {
      toast.error('Error al actualizar producto');
    }
  };

  const handleDelete = async (record: Record<string, unknown>) => {
    try {
      await deleteProduct.mutateAsync(record.id as string);
      setIsDetailOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Transform products for DynamicTable
  const tableData = rows.map((product: any) => ({
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
                  placeholder="Buscar productos por nombre o descripción..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
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
                {!counts ? <Skeleton className="h-8 w-16" /> : counts.total.toLocaleString('es-BO')}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Activos</p>
              <p className="text-2xl font-bold text-success">
                {!counts ? <Skeleton className="h-8 w-16" /> : counts.active.toLocaleString('es-BO')}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50 border-warning/30">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Stock Bajo</p>
              <p className="text-2xl font-bold text-warning">
                {!lowStockProducts ? <Skeleton className="h-8 w-16" /> : lowStockProducts?.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50 border-destructive/30">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Sin Stock</p>
              <p className="text-2xl font-bold text-destructive">
                {!counts ? <Skeleton className="h-8 w-16" /> : counts.outOfStock.toLocaleString('es-BO')}
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
        <Card className="glass border-border/50">
          <CardContent className="pt-6">
            <DynamicTable
              moduleKey="products"
              data={tableData}
              isLoading={isLoading || isFetching || columnsLoading}
              onRowClick={handleRowClick}
              getRowId={(row) => row.id as string}
              emptyMessage={debouncedSearch ? 'No se encontraron productos con ese criterio' : 'No hay productos registrados'}
            />

            <TablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={updatePageInUrl}
              onPageSizeChange={updatePageSizeInUrl}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              itemLabel="productos"
            />
          </CardContent>
        </Card>
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
        columns={(columns || []).filter(c => c.column_key !== 'image_url')}
        title={selectedRecord?.name || 'Detalle de Producto'}
        onSave={handleSave}
        canEdit={isAdmin}
        canDelete={isAdmin}
        onDelete={handleDelete}
        customContent={
          selectedRecord ? (
            <div className="grid gap-4">
              {isAdmin ? (
                <ProductImageUpload
                  imageUrl={selectedRecord.image_url}
                  productId={selectedRecord.id}
                  onImageChange={handleImageChange}
                />
              ) : selectedRecord.image_url ? (
                <div className="grid gap-2">
                  <Label>Imagen del producto</Label>
                  <img src={selectedRecord.image_url} alt={selectedRecord.name} className="w-full h-40 rounded-lg object-cover border border-border" />
                </div>
              ) : null}

              {(isAdmin || infoDraft) && (
                <div className="grid gap-2">
                  <Label htmlFor="product-info">Información del producto</Label>
                  <Textarea
                    id="product-info"
                    value={infoDraft}
                    onChange={(e) => setInfoDraft(e.target.value)}
                    onBlur={() => {
                      const currentInfo = ((selectedRecord?.custom_fields || {}) as Record<string, unknown>).info;
                      const currentStr = typeof currentInfo === 'string' ? currentInfo : '';
                      const trimmed = infoDraft.trim();
                      if (trimmed === currentStr) return;
                      const baseCf = { ...((selectedRecord?.custom_fields || {}) as Record<string, unknown>) };
                      if (trimmed) {
                        baseCf.info = trimmed;
                      } else {
                        delete baseCf.info;
                      }
                      handleSave({ custom_fields: baseCf });
                    }}
                    disabled={!isAdmin}
                    placeholder="Beneficios, modo de uso, ingredientes, contraindicaciones... Esta información la leerá el chatbot cuando el cliente pregunte por detalles del producto."
                    className="min-h-[120px]"
                  />
                </div>
              )}
            </div>
          ) : null
        }
      />

      <ProductImageLightbox
        open={!!lightboxImage}
        onOpenChange={(open) => !open && setLightboxImage(null)}
        imageUrl={lightboxImage?.url || ''}
        productName={lightboxImage?.name}
      />
    </DashboardLayout>
  );
}
