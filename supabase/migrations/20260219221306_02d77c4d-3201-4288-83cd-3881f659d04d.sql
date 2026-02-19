
DROP VIEW IF EXISTS public.orders_complete_view;

CREATE VIEW public.orders_complete_view AS
SELECT
    o.id,
    o.order_number,
    o.status,
    o.total,
    o.notes AS order_notes,
    o.custom_fields,
    o.created_at,
    o.updated_at,
    o.confirmed_at,
    o.completed_at,
    o.customer_id,
    c.name AS customer_name,
    c.phone AS customer_phone,
    c.address AS customer_address,
    c.conversation_mode,
    p.id AS payment_id,
    p.status AS payment_status,
    p.method AS payment_method,
    p.amount AS payment_amount,
    p.confirmed_at AS payment_confirmed_at,
    p.notes AS payment_notes,
    p.screenshot_url,
    d.id AS delivery_id,
    d.status AS delivery_status,
    d.assigned_at AS delivery_assigned_at,
    d.delivered_at,
    d.driver_name,
    d.driver_phone,
    d.address AS delivery_address,
    d.location_url,
    (
        SELECT json_agg(json_build_object(
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal
        ))
        FROM order_items oi
        WHERE oi.order_id = o.id
    ) AS products
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
LEFT JOIN payments p ON p.order_id = o.id
LEFT JOIN deliveries d ON d.order_id = o.id;
