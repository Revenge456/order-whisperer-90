import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Last 24 hours window (rolling, not calendar day)
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Fetch multiple stats in parallel
      const [
        ordersResult,
        paymentsResult,
        deliveriesResult,
        lowStockResult,
        customersResult,
      ] = await Promise.all([
        // Orders last 24h
        supabase
          .from('orders')
          .select('id, status, total, created_at')
          .gte('created_at', since),
        
        // Pending payments — same source as bell notifications (payments table)
        supabase
          .from('payments')
          .select('id, amount')
          .eq('status', 'pendiente'),
        
        // Active deliveries
        supabase
          .from('active_deliveries_view')
          .select('delivery_id, status'),
        
        // Low stock products
        supabase
          .from('low_stock_products_view')
          .select('id'),
        
        // Total customers
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true }),
      ]);

      const ordersLast24h = ordersResult.data || [];
      const pendingPayments = paymentsResult.data || [];
      const activeDeliveries = deliveriesResult.data || [];
      const lowStock = lowStockResult.data || [];

      const last24hRevenue = ordersLast24h
        .filter(o => o.status === 'completado')
        .reduce((sum, o) => sum + (o.total || 0), 0);

      return {
        totalOrdersLast24h: ordersLast24h.length,
        pendingOrders: ordersLast24h.filter(o => o.status === 'nuevo').length,
        last24hRevenue,
        pendingPayments: pendingPayments.length,
        pendingPaymentsAmount: pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
        activeDeliveries: activeDeliveries.filter(d => 
          d.status && ['asignado', 'en_camino'].includes(d.status)
        ).length,
        lowStockProducts: lowStock.length,
        totalCustomers: customersResult.count || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useRecentOrders() {
  return useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders_complete_view')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
}
