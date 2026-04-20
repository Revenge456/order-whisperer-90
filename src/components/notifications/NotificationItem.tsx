import { ShoppingCart, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/hooks/useNotifications";

interface NotificationItemProps {
  notification: AppNotification;
  isRead: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
}

export function NotificationItem({
  notification,
  isRead,
  onClick,
  fullWidth,
}: NotificationItemProps) {
  const navigate = useNavigate();

  const isOrder = notification.kind === "new_order";
  const Icon = isOrder ? ShoppingCart : CreditCard;
  const iconColor = isOrder ? "text-warning" : "text-primary";
  const iconBg = isOrder ? "bg-warning/10" : "bg-primary/10";
  const title = isOrder
    ? `Nuevo pedido ${notification.order_number}`
    : `Pago pendiente ${notification.order_number}`;

  const handleClick = () => {
    onClick?.();
    const tab = isOrder ? "orders" : "payments";
    navigate(`/orders?tab=${tab}&search=${encodeURIComponent(notification.order_number)}`);
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: es,
  });

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full text-left flex items-start gap-3 px-3 py-3 rounded-md transition-colors",
        "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring",
        !isRead && "bg-accent/40",
        fullWidth && "border border-border",
      )}
    >
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("w-4 h-4", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-snug truncate",
            isRead ? "text-muted-foreground font-normal" : "font-medium text-foreground",
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "text-xs truncate",
            isRead ? "text-muted-foreground/70" : "text-muted-foreground",
          )}
        >
          {(notification.customer_name ?? "Cliente s/n") +
            ` — Bs ${notification.amount.toLocaleString("es-BO")}`}
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">{timeAgo}</p>
      </div>
      {!isRead && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
    </button>
  );
}
