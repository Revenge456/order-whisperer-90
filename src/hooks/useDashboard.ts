import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Fetch multiple stats in parallel
      const [
        ordersResult,
        paymentsResult,
        deliveriesResult,
        lowStockResult,
        customersResult,
      ] = await Promise.all([
        // Orders today
        supabase
          .from('orders')
          .select('id, status, total, created_at')
          .gte('created_at', todayISO),
        
        // Pending payments
        supabase
          .from('pending_payments_view')
          .select('payment_id, amount'),
        
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

      const ordersToday = ordersResult.data || [];
      const pendingPayments = paymentsResult.data || [];
      const activeDeliveries = deliveriesResult.data || [];
      const lowStock = lowStockResult.data || [];

      const todayRevenue = ordersToday
        .filter(o => o.status === 'completado')
        .reduce((sum, o) => sum + (o.total || 0), 0);

      return {
        totalOrdersToday: ordersToday.length,
        pendingOrders: ordersToday.filter(o => o.status === 'nuevo').length,
        todayRevenue,
        pendingPayments: pendingPayments.length,
        pendingPaymentsAmount: pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
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
