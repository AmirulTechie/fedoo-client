export type UserRole = "customer" | "owner" | "admin";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "rejected"
  | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Waiting for kitchen",
  accepted: "Kitchen accepted",
  preparing: "Preparing your food",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  rejected: "Declined by kitchen",
  cancelled: "Cancelled",
};

export const ACTIVE_ORDER_STEPS: readonly OrderStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "out_for_delivery",
  "delivered",
];

const TRANSITIONS: Record<
  OrderStatus,
  Partial<Record<OrderStatus, readonly UserRole[]>>
> = {
  pending: {
    accepted: ["owner", "admin"],
    rejected: ["owner", "admin"],
    cancelled: ["customer", "admin"],
  },
  accepted: {
    preparing: ["owner", "admin"],
    cancelled: ["customer", "owner", "admin"],
  },
  preparing: {
    out_for_delivery: ["owner", "admin"],
  },
  out_for_delivery: {
    delivered: ["owner", "admin"],
  },
  delivered: {},
  rejected: {},
  cancelled: {},
};

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  role: UserRole
): boolean {
  const allowedRoles = TRANSITIONS[from]?.[to];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}
