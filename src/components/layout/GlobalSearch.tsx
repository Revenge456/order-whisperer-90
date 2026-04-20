import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, User, Package, ShoppingBag, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type CustomerHit = { id: string; name: string | null; phone: string };
type OrderHit = {
  id: string;
  order_number: string;
  status: string | null;
  total: number;
  created_at: string | null;
  customers: { name: string | null } | null;
};
type ProductHit = { id: string; name: string; price: number };

type FlatItem =
  | { kind: "customer"; data: CustomerHit }
  | { kind: "order"; data: OrderHit }
  | { kind: "product"; data: ProductHit };

const formatBs = (n: number) =>
  `Bs. ${new Intl.NumberFormat("es-BO", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n || 0)}`;

const statusBadgeClass = (status: string | null) => {
  switch (status) {
    case "nuevo":
      return "bg-primary/15 text-primary border-primary/30";
    case "confirmado":
    case "completado":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "cancelado":
      return "bg-muted text-muted-foreground border-border";
    case "en_entrega":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const enabled = debounced.length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", debounced],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const q = debounced;
      const [customersRes, ordersRes, productsRes] = await Promise.all([
        supabase
          .from("customers")
          .select("id, name, phone")
          .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
          .limit(5),
        supabase
          .from("orders")
          .select("id, order_number, status, total, created_at, customers(name)")
          .ilike("order_number", `%${q}%`)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("products")
          .select("id, name, price, is_active")
          .ilike("name", `%${q}%`)
          .eq("is_active", true)
          .limit(5),
      ]);

      return {
        customers: (customersRes.data ?? []) as CustomerHit[],
        orders: (ordersRes.data ?? []) as unknown as OrderHit[],
        products: (productsRes.data ?? []) as ProductHit[],
      };
    },
  });

  const flat: FlatItem[] = useMemo(() => {
    if (!data) return [];
    return [
      ...data.customers.map((c) => ({ kind: "customer" as const, data: c })),
      ...data.orders.map((o) => ({ kind: "order" as const, data: o })),
      ...data.products.map((p) => ({ kind: "product" as const, data: p })),
    ];
  }, [data]);

  useEffect(() => {
    setActiveIndex(0);
  }, [debounced, data]);

  const goTo = useCallback(
    (item: FlatItem) => {
      setOpen(false);
      setQuery("");
      if (item.kind === "customer") navigate(`/customers?highlight=${item.data.id}`);
      else if (item.kind === "order") navigate(`/orders?highlight=${item.data.id}`);
      else navigate(`/products?highlight=${item.data.id}`);
    },
    [navigate]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || flat.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[activeIndex];
      if (item) goTo(item);
    }
  };

  const showDropdown = open && debounced.length >= 2;
  const totalResults = flat.length;

  // Index helpers per section to map to global activeIndex
  const customerStart = 0;
  const orderStart = data?.customers.length ?? 0;
  const productStart = orderStart + (data?.orders.length ?? 0);

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Buscar pedidos, clientes, productos..."
        className="w-80 pl-10 pr-14 bg-secondary/50 border-border/50 focus:border-primary"
      />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        ⌘K
      </kbd>

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-2 w-[28rem] max-w-[90vw] rounded-md border border-border text-popover-foreground shadow-2xl z-[100] overflow-hidden"
          style={{ backgroundColor: "hsl(var(--popover))", backdropFilter: "none" }}
        >
          {isFetching && !data ? (
            <div className="p-3 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 px-4 text-center">
              <p className="text-sm text-muted-foreground">
                Sin resultados para <span className="text-foreground font-medium">"{debounced}"</span>
              </p>
            </div>
          ) : (
            <div className="max-h-[28rem] overflow-y-auto py-1">
              {isFetching && (
                <div className="px-3 py-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Actualizando...
                </div>
              )}

              {data && data.customers.length > 0 && (
                <Section title={`Clientes (${data.customers.length})`}>
                  {data.customers.map((c, i) => {
                    const idx = customerStart + i;
                    return (
                      <ResultRow
                        key={c.id}
                        active={idx === activeIndex}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => goTo({ kind: "customer", data: c })}
                        icon={<User className="w-4 h-4 text-primary" />}
                        title={c.name || "(sin nombre)"}
                        right={<span className="text-xs text-muted-foreground tabular-nums">{c.phone}</span>}
                      />
                    );
                  })}
                </Section>
              )}

              {data && data.orders.length > 0 && (
                <Section title={`Pedidos (${data.orders.length})`}>
                  {data.orders.map((o, i) => {
                    const idx = orderStart + i;
                    return (
                      <ResultRow
                        key={o.id}
                        active={idx === activeIndex}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => goTo({ kind: "order", data: o })}
                        icon={<Package className="w-4 h-4 text-primary" />}
                        title={o.order_number}
                        subtitle={o.customers?.name || undefined}
                        right={
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium tabular-nums">{formatBs(o.total)}</span>
                            <Badge variant="outline" className={cn("text-[10px] py-0 h-4 px-1.5", statusBadgeClass(o.status))}>
                              {o.status}
                            </Badge>
                          </div>
                        }
                      />
                    );
                  })}
                </Section>
              )}

              {data && data.products.length > 0 && (
                <Section title={`Productos (${data.products.length})`}>
                  {data.products.map((p, i) => {
                    const idx = productStart + i;
                    return (
                      <ResultRow
                        key={p.id}
                        active={idx === activeIndex}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => goTo({ kind: "product", data: p })}
                        icon={<ShoppingBag className="w-4 h-4 text-primary" />}
                        title={p.name}
                        right={<span className="text-xs font-medium tabular-nums">{formatBs(p.price)}</span>}
                      />
                    );
                  })}
                </Section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ResultRow({
  active,
  onClick,
  onMouseEnter,
  icon,
  title,
  subtitle,
  right,
}: {
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
      )}
    >
      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </button>
  );
}
