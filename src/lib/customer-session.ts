import { DEFAULT_DELIVERY_FEE } from "@/lib/config";
import type { OrderStatus } from "@/lib/orderStatus";

export interface CustomerSession {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface CustomerAddress {
  id: string;
  label: string;
  city: string;
  area: string;
  streetAddress: string;
  phone: string;
  isDefault: boolean;
}

export interface OrderItemSnapshot {
  itemId: string;
  name: string;
  variant: string;
  unitPriceBdt: number;
  quantity: number;
}

export interface CustomerOrder {
  id: string;
  idempotencyKey: string;
  restaurantId: string;
  restaurantName: string;
  restaurantArea: string;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  subtotalBdt: number;
  deliveryFeeBdt: number;
  totalBdt: number;
  commissionAmount: 0;
  paymentMethod: "Cash on Delivery";
  deliveryAddress: string;
  customerPhone: string;
  createdAtIso: string;
  updatedAtIso: string;
}

const SESSION_KEY = "fedoo_customer_session_v1";
const ADDRESSES_KEY = "fedoo_customer_addresses_v1";
const ORDERS_KEY = "fedoo_customer_orders_v1";

export const DEFAULT_ADDRESSES: CustomerAddress[] = [
  {
    id: "addr-home",
    label: "Home",
    city: "Dhaka",
    area: "Dhanmondi",
    streetAddress: "House 14, Road 6, Block C",
    phone: "01712345678",
    isDefault: true,
  },
  {
    id: "addr-office",
    label: "Office",
    city: "Dhaka",
    area: "Banani",
    streetAddress: "Level 4, House 28, Road 11",
    phone: "01712345678",
    isDefault: false,
  },
];

export const DEFAULT_PAST_ORDERS: CustomerOrder[] = [
  {
    id: "FD-1038",
    idempotencyKey: "seed-fd-1038",
    restaurantId: "sultan-handi-dhanmondi",
    restaurantName: "Nawab Handi Kitchen",
    restaurantArea: "Dhanmondi, Dhaka",
    status: "delivered",
    items: [
      {
        itemId: "nawab-kacchi-single",
        name: "Basmati Mutton Kacchi",
        variant: "1:1 Regular",
        unitPriceBdt: 340,
        quantity: 2,
      },
      {
        itemId: "nawab-borhani",
        name: "Mint Spiced Borhani",
        variant: "500 ml Bottle",
        unitPriceBdt: 90,
        quantity: 2,
      },
    ],
    subtotalBdt: 860,
    deliveryFeeBdt: DEFAULT_DELIVERY_FEE,
    totalBdt: 910,
    commissionAmount: 0,
    paymentMethod: "Cash on Delivery",
    deliveryAddress: "House 14, Road 6, Block C, Dhanmondi, Dhaka",
    customerPhone: "01712345678",
    createdAtIso: "2026-11-10T13:20:00.000Z",
    updatedAtIso: "2026-11-10T13:55:00.000Z",
  },
  {
    id: "FD-1024",
    idempotencyKey: "seed-fd-1024",
    restaurantId: "flame-yard-banani",
    restaurantName: "Flame Yard Grill",
    restaurantArea: "Banani, Dhaka",
    status: "delivered",
    items: [
      {
        itemId: "flame-double-smash",
        name: "Double Smash Beef Burger",
        variant: "With Seasoned Fries",
        unitPriceBdt: 410,
        quantity: 1,
      },
    ],
    subtotalBdt: 410,
    deliveryFeeBdt: DEFAULT_DELIVERY_FEE,
    totalBdt: 460,
    commissionAmount: 0,
    paymentMethod: "Cash on Delivery",
    deliveryAddress: "Level 4, House 28, Road 11, Banani, Dhaka",
    customerPhone: "01712345678",
    createdAtIso: "2026-11-06T19:40:00.000Z",
    updatedAtIso: "2026-11-06T20:10:00.000Z",
  },
];

const STORE_EVENT = "fedoo:customer-store";

interface CachedEntry<T> {
  raw: string | null;
  value: T;
}

let cachedSession: CachedEntry<CustomerSession | null> | null = null;
let cachedAddresses: CachedEntry<CustomerAddress[]> | null = null;
let cachedOrders: CachedEntry<CustomerOrder[]> | null = null;

function emitStoreChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STORE_EVENT));
}

export function subscribeCustomerStore(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener(STORE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(STORE_EVENT, handler);
  };
}

function safeReadRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWriteJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in private browsing
  }
}

export function getCustomerSession(): CustomerSession | null {
  if (typeof window === "undefined") return null;
  const raw = safeReadRaw(SESSION_KEY);
  if (cachedSession && cachedSession.raw === raw) {
    return cachedSession.value;
  }
  let parsed: CustomerSession | null = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw) as CustomerSession;
    } catch {
      parsed = null;
    }
  }
  cachedSession = { raw, value: parsed };
  return parsed;
}

export function getServerCustomerSession(): CustomerSession | null {
  return null;
}

export function saveCustomerSession(session: CustomerSession): void {
  safeWriteJson(SESSION_KEY, session);
  cachedSession = null;
  emitStoreChange();
}

export function clearCustomerSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
  cachedSession = null;
  emitStoreChange();
}

export function getCustomerAddresses(): CustomerAddress[] {
  if (typeof window === "undefined") return DEFAULT_ADDRESSES;
  const raw = safeReadRaw(ADDRESSES_KEY);
  if (cachedAddresses && cachedAddresses.raw === raw) {
    return cachedAddresses.value;
  }
  let parsed: CustomerAddress[] | null = null;
  if (raw) {
    try {
      const candidate = JSON.parse(raw) as CustomerAddress[];
      if (Array.isArray(candidate)) {
        parsed = candidate;
      }
    } catch {
      parsed = null;
    }
  }
  const value = parsed ?? DEFAULT_ADDRESSES;
  cachedAddresses = { raw, value };
  return value;
}

export function getServerCustomerAddresses(): CustomerAddress[] {
  return DEFAULT_ADDRESSES;
}

export function saveCustomerAddresses(addresses: CustomerAddress[]): void {
  safeWriteJson(ADDRESSES_KEY, addresses);
  cachedAddresses = null;
  emitStoreChange();
}

export function getCustomerOrders(): CustomerOrder[] {
  if (typeof window === "undefined") return DEFAULT_PAST_ORDERS;
  const raw = safeReadRaw(ORDERS_KEY);
  if (cachedOrders && cachedOrders.raw === raw) {
    return cachedOrders.value;
  }
  let parsed: CustomerOrder[] | null = null;
  if (raw) {
    try {
      const candidate = JSON.parse(raw) as CustomerOrder[];
      if (Array.isArray(candidate)) {
        parsed = candidate;
      }
    } catch {
      parsed = null;
    }
  }
  const value = parsed ?? DEFAULT_PAST_ORDERS;
  cachedOrders = { raw, value };
  return value;
}

export function getServerCustomerOrders(): CustomerOrder[] {
  return DEFAULT_PAST_ORDERS;
}

export function saveCustomerOrders(orders: CustomerOrder[]): void {
  safeWriteJson(ORDERS_KEY, orders);
  cachedOrders = null;
  emitStoreChange();
}

export function createNameFromEmail(email: string): string {
  const prefix = email.split("@")[0] ?? "Customer";
  const cleaned = prefix.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Fedoo Customer";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
