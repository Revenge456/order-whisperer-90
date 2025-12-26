import { useState } from "react";
import { Search, CheckCircle, XCircle, Clock, Eye, Image } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Mock data
const payments = [
  {
    id: "1",
    order_number: "ORD-1234",
    customer: "Juan Pérez",
    amount: 350,
    method: "qr",
    status: "pending",
    proof_url: null,
    created_at: "2024-12-26T10:35:00",
  },
  {
    id: "2",
    order_number: "ORD-1235",
    customer: "María García",
    amount: 520,
    method: "transfer",
    status: "confirmed",
    proof_url: "/placeholder.svg",
    created_at: "2024-12-26T10:50:00",
    confirmed_at: "2024-12-26T11:00:00",
  },
  {
    id: "3",
    order_number: "ORD-1236",
    customer: "Carlos López",
    amount: 180,
    method: "cash",
    status: "pending",
    proof_url: null,
    created_at: "2024-12-26T11:05:00",
  },
  {
    id: "4",
    order_number: "ORD-1237",
    customer: "Ana Rodríguez",
    amount: 420,
    method: "qr",
    status: "rejected",
    proof_url: "/placeholder.svg",
    created_at: "2024-12-26T09:20:00",
    notes: "Imagen borrosa, no se puede verificar",
  },
  {
    id: "5",
    order_number: "ORD-1238",
    customer: "Pedro Mamani",
    amount: 650,
    method: "transfer",
    status: "confirmed",
    proof_url: "/placeholder.svg",
    created_at: "2024-12-25T14:35:00",
    confirmed_at: "2024-12-25T14:45:00",
  },
];

const statusConfig: Record<string, { label: string; style: string; icon: React.ElementType }> = {
  pending: { label: "Pendiente", style: "bg-warning/10 text-warning border-warning/30", icon: Clock },
  confirmed: { label: "Confirmado", style: "bg-success/10 text-success border-success/30", icon: CheckCircle },
  rejected: { label: "Rechazado", style: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
};

const methodLabels: Record<string, string> = {
  qr: "QR",
  transfer: "Transferencia",
  cash: "Efectivo",
};

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<typeof payments[0] | null>(null);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const confirmedAmount = payments
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + p.amount, 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pagos</h1>
          <p className="text-muted-foreground mt-1">Verificación y gestión de pagos</p>
        </div>

        {/* Search and Filters */}
        <Card className="glass border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por pedido o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Pendientes por Verificar</p>
              <p className="text-2xl font-bold text-warning">
                {payments.filter((p) => p.status === "pending").length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Bs. {pendingAmount.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Confirmados Hoy</p>
              <p className="text-2xl font-bold text-success">
                {payments.filter((p) => p.status === "confirmed").length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Bs. {confirmedAmount.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Rechazados</p>
              <p className="text-2xl font-bold text-destructive">
                {payments.filter((p) => p.status === "rejected").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Lista de Pagos</CardTitle>
            <CardDescription>
              {filteredPayments.length} pago(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const StatusIcon = statusConfig[payment.status].icon;
                  return (
                    <TableRow key={payment.id} className="border-border/50 hover:bg-secondary/30">
                      <TableCell>
                        <span className="font-medium text-foreground">{payment.order_number}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-foreground">{payment.customer}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-secondary/50">
                          {methodLabels[payment.method]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[payment.status].style}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[payment.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-foreground">
                          Bs. {payment.amount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(payment.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {payment.proof_url && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setSelectedPayment(payment)}
                                >
                                  <Image className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Comprobante de Pago</DialogTitle>
                                  <DialogDescription>
                                    {payment.order_number} - {payment.customer}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="aspect-video bg-secondary/50 rounded-lg flex items-center justify-center">
                                  <p className="text-muted-foreground">Imagen del comprobante</p>
                                </div>
                                {payment.status === "pending" && (
                                  <DialogFooter className="gap-2">
                                    <Button variant="destructive" className="flex-1">
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Rechazar
                                    </Button>
                                    <Button className="flex-1 bg-success hover:bg-success/90">
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Confirmar
                                    </Button>
                                  </DialogFooter>
                                )}
                              </DialogContent>
                            </Dialog>
                          )}
                          {payment.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
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