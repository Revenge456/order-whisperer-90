## Análisis

**Estado actual:**
- `useProductCategories()` ya existe en `src/hooks/useProducts.ts` pero filtra `is_active=true` y la usa `ProductModal`. No sirve para gestión (necesitamos ver inactivas también).
- Tabla `product_categories` tiene RLS **solo con SELECT** para authenticated. **No hay policies de INSERT/UPDATE/DELETE** → cualquier mutation va a fallar con error de RLS.
- No hay UNIQUE constraint en `name` — validación tiene que ser en cliente.
- FK `products.category_id → product_categories.id` existe, así que el bloqueo por productos asignados se valida con count en cliente (y Postgres lo respaldaría).

**Hallazgo crítico:** hay que agregar policies RLS antes que nada, si no toda la gestión rompe.

---

## Plan

### 1. Migración Supabase
Agregar policies a `product_categories`:
- `INSERT/UPDATE/DELETE` para admins (`has_role(auth.uid(), 'admin')`).
- Mantener SELECT autenticado.

(No tocar estructura — la tabla ya tiene todo lo necesario.)

### 2. Nuevo hook `src/hooks/useCategories.ts`
- `useCategoriesWithCount()` → query `['categories-with-count']` que trae **todas** las categorías (activas e inactivas) + count de productos por categoría (un SELECT a `product_categories` + un SELECT agrupado a `products` con `category_id, count`, mergeados en JS — evita N+1).
- `useCreateCategory()` — insert + valida nombre único en cliente.
- `useUpdateCategory()` — update por id.
- `useToggleCategoryActive()` — update `is_active`.
- `useDeleteCategory()` — delete por id.
- Todas invalidan `['categories-with-count']`, `['product-categories']` y `['products']`. Errores reales de Postgres se propagan al toast.

### 3. Refactor `useProductCategories` (ya existente)
Lo dejamos como está (solo activas, para el selector del ProductModal) — sigue compatible. El nuevo hook `useCategoriesWithCount` es para gestión.

### 4. Nuevo componente `src/components/modals/CategoryManagerModal.tsx`
- `Dialog` con tabla: Nombre · Descripción · Productos (count, con badge amarillo "Vacía" si count=0) · Activa (`Switch` inline) · Acciones (Edit, Delete).
- Botón "+ Nueva categoría" arriba → abre un sub-form inline (no segundo dialog anidado) con Nombre / Descripción / Switch Activa.
- Botón Editar → mismo form pre-cargado.
- Botón Eliminar → `AlertDialog`. Si `productCount > 0`, botón `disabled` con `Tooltip` "No se puede eliminar: X productos asignados…".
- Footer "Cerrar".

### 5. Wire-up en `src/pages/Products.tsx`
- Importar `Tag` de lucide-react.
- Agregar botón `variant="outline"` "Gestionar categorías" al lado de "Nuevo Producto".
- Estado `isCategoryManagerOpen` + render del modal.

### 6. ProductModal
Ya usa `useProductCategories()` → invalidar `['product-categories']` desde las mutations del nuevo hook hace que el selector se refresque solo. **No hace falta tocar ProductModal.**

---

### Archivos afectados
- ➕ `supabase/migrations/<timestamp>.sql` (policies)
- ➕ `src/hooks/useCategories.ts`
- ➕ `src/components/modals/CategoryManagerModal.tsx`
- ✏️ `src/pages/Products.tsx` (botón + estado + render del modal)
