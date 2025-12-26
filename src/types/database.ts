// Bolivia Fitness Database Types

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'confirmed' | 'rejected';
export type PaymentMethod = 'qr' | 'transfer' | 'cash';
export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'delivering' | 'delivered' | 'failed';
export type ProductCategory = 'protein' | 'supplement' | 'accessory' | 'meal' | 'other';
export type UserRole = 'admin' | 'operator' | 'delivery';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string;
  notes: string | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  price: number;
  cost: number | null;
  stock: number;
  min_stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  notes: string | null;
  delivery_address: string | null;
  delivery_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  customer?: Customer;
  items?: OrderItem[];
  payment?: Payment;
  delivery?: Delivery;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
  notes: string | null;
  // Relations
  product?: Product;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  proof_url: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  delivery_person_id: string | null;
  status: DeliveryStatus;
  pickup_time: string | null;
  delivery_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  delivery_person?: Profile;
}

export interface DeliveryPerson {
  id: string;
  profile_id: string;
  is_available: boolean;
  current_location: string | null;
  phone: string;
  vehicle_type: string | null;
  // Relations
  profile?: Profile;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  pendingPayments: number;
  activeDeliveries: number;
  lowStockProducts: number;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'payment' | 'delivery' | 'customer';
  message: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error' | 'info';
}