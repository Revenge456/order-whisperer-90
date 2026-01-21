import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Deliveries from "./pages/Deliveries";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Team from "./pages/Team";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected routes with page permissions */}
          <Route path="/dashboard" element={
            <ProtectedRoute pageKey="dashboard">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/customers" element={
            <ProtectedRoute pageKey="customers">
              <Customers />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute pageKey="orders">
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/deliveries" element={
            <ProtectedRoute pageKey="deliveries">
              <Deliveries />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute pageKey="products">
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute pageKey="reports">
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute pageKey="team">
              <Team />
            </ProtectedRoute>
          } />
          
          {/* Redirect old routes */}
          <Route path="/payments" element={<Navigate to="/orders" replace />} />
          <Route path="/settings" element={<Navigate to="/team" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
