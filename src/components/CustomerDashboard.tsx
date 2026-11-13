"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MotionConfig } from "motion/react";
import {
  Bike,
  CheckCircle2,
  ChefHat,
  Clock,
  LogOut,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import FedooLogo from "@/components/FedooLogo";
import { PAYMENT_METHODS } from "@/lib/config";
import {
  clearCustomerSession,
  createNameFromEmail,
  getCustomerAddresses,
  getCustomerOrders,
  getCustomerSession,
  getServerCustomerAddresses,
  getServerCustomerOrders,
  getServerCustomerSession,
  saveCustomerAddresses,
  saveCustomerOrders,
  saveCustomerSession,
  subscribeCustomerStore,
  type CustomerAddress,
  type CustomerOrder,
} from "@/lib/customer-session";
import {
  BANGLADESH_CITIES,
  CUISINE_CATEGORIES,
  FEATURED_RESTAURANTS,
  formatBDT,
  type CuisineCategory,
  type FeaturedRestaurant,
} from "@/lib/landing-data";
import {
  ACTIVE_ORDER_STEPS,
  ORDER_STATUS_LABELS,
  canTransition,
  type OrderStatus,
} from "@/lib/orderStatus";

type CustomerTab = "browse" | "tracking" | "history" | "addresses";

const VALID_TABS: readonly CustomerTab[] = [
  "browse",
  "tracking",
  "history",
  "addresses",
];

const emptySubscribe = () => () => {};

function isTerminalStatus(status: OrderStatus): boolean {
  return status === "delivered" || status === "rejected" || status === "cancelled";
}

function getNextKitchenStatus(current: OrderStatus): OrderStatus | null {
  if (current === "pending") return "accepted";
  if (current === "accepted") return "preparing";
  if (current === "preparing") return "out_for_delivery";
  if (current === "out_for_delivery") return "delivered";
  return null;
}

function formatOrderDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "Recent";
  return parsed.toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StepIcon({ step }: { step: OrderStatus }) {
  if (step === "pending") return <Clock className="h-4 w-4" />;
  if (step === "accepted") return <CheckCircle2 className="h-4 w-4" />;
  if (step === "preparing") return <ChefHat className="h-4 w-4" />;
  if (step === "out_for_delivery") return <Bike className="h-4 w-4" />;
  return <PackageCheck className="h-4 w-4" />;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const session = useSyncExternalStore(
    subscribeCustomerStore,
    getCustomerSession,
    getServerCustomerSession
  );
  const addresses = useSyncExternalStore(
    subscribeCustomerStore,
    getCustomerAddresses,
    getServerCustomerAddresses
  );
  const orders = useSyncExternalStore(
    subscribeCustomerStore,
    getCustomerOrders,
    getServerCustomerOrders
  );

  const rawTab = searchParams.get("tab");
  const initialTab: CustomerTab =
    rawTab && VALID_TABS.includes(rawTab as CustomerTab)
      ? (rawTab as CustomerTab)
      : "browse";

  const [activeTab, setActiveTab] = useState<CustomerTab>(initialTab);

  // Unauthenticated sign-in form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Browse & Checkout state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] =
    useState<CuisineCategory>("All");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(
    FEATURED_RESTAURANTS[0].id
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [checkoutPhoneOverride, setCheckoutPhoneOverride] = useState<string | null>(
    null
  );
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [idempotencyNonce, setIdempotencyNonce] = useState<number>(1);

  // Live tracking polling indicator state
  const [lastPolledTime, setLastPolledTime] = useState<string>("Just now");
  const [trackingNotice, setTrackingNotice] = useState<string | null>(null);

  // History reorder notice
  const [historyNotice, setHistoryNotice] = useState<string | null>(null);

  // Address creation state
  const [addrLabel, setAddrLabel] = useState("");
  const [addrCity, setAddrCity] = useState<string>(BANGLADESH_CITIES[0].city);
  const [addrArea, setAddrArea] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrError, setAddrError] = useState<string | null>(null);
  const [addrSuccess, setAddrSuccess] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const defaultAddress =
    addresses.find((addr) => addr.isDefault) ?? addresses[0] ?? null;

  const activeDeliveryAddress =
    addresses.find((addr) => addr.id === selectedAddressId) ?? defaultAddress;

  const checkoutPhone =
    checkoutPhoneOverride ??
    activeDeliveryAddress?.phone ??
    session?.phone ??
    "01712345678";

  const selectedRestaurant: FeaturedRestaurant =
    FEATURED_RESTAURANTS.find((r) => r.id === selectedRestaurantId) ??
    FEATURED_RESTAURANTS[0];

  const filteredRestaurants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FEATURED_RESTAURANTS.filter((restaurant) => {
      const cuisineMatch =
        selectedCuisine === "All" || restaurant.cuisine === selectedCuisine;
      if (!cuisineMatch) return false;
      if (!q) return true;
      return (
        restaurant.name.toLowerCase().includes(q) ||
        restaurant.area.toLowerCase().includes(q) ||
        restaurant.city.toLowerCase().includes(q) ||
        restaurant.signatureDish.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCuisine]);

  const cartItems = selectedRestaurant.menu
    .map((item) => ({
      ...item,
      qty: quantities[item.id] ?? 0,
    }))
    .filter((item) => item.qty > 0);

  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + item.priceBdt * item.qty,
    0
  );
  const cartDeliveryFee =
    cartSubtotal > 0 ? selectedRestaurant.deliveryFeeBdt : 0;
  const cartTotal = cartSubtotal + cartDeliveryFee;

  const activeOrder: CustomerOrder | null =
    orders.find((order) => !isTerminalStatus(order.status)) ?? null;

  const activeOrderId = activeOrder?.id ?? "";
  const activeOrderStatus = activeOrder?.status ?? "";
  const hasSession = Boolean(session);

  // 10-second polling for customer order tracking (per AGENTS.md)
  useEffect(() => {
    if (!isHydrated || !hasSession || !activeOrderId) return;

    const timer = window.setInterval(() => {
      // Re-reads latest order state from storage (simulating 10s GET /api/orders/[id])
      getCustomerOrders();
      setLastPolledTime(
        new Date().toLocaleTimeString("en-BD", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 10000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isHydrated, hasSession, activeOrderId, activeOrderStatus]);

  const switchTab = (tab: CustomerTab) => {
    setActiveTab(tab);
    setCheckoutError(null);
    setTrackingNotice(null);
    setHistoryNotice(null);
    setAddrError(null);
    setAddrSuccess(null);
    router.replace(`/customer?tab=${tab}`, { scroll: false });
  };

  const handleSignInSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
      setLoginError("Please enter a valid email address.");
      return;
    }

    if (loginPassword.length < 6) {
      setLoginError("Password must be at least 6 characters.");
      return;
    }

    setLoggingIn(true);
    const cleanEmail = loginEmail.trim();
    window.setTimeout(() => {
      saveCustomerSession({
        id: `cust-${cleanEmail.toLowerCase()}`,
        name: createNameFromEmail(cleanEmail),
        email: cleanEmail,
        phone: "01712345678",
      });
      setLoggingIn(false);
    }, 200);
  };

  const handleDemoSignIn = () => {
    setLoginError(null);
    setLoggingIn(true);
    window.setTimeout(() => {
      saveCustomerSession({
        id: "cust-tariqul@fedoo.bd",
        name: "Tariqul Islam",
        email: "tariqul@fedoo.bd",
        phone: "01712345678",
      });
      setLoggingIn(false);
    }, 150);
  };

  const handleSignOut = () => {
    clearCustomerSession();
    router.push("/");
  };

  const handleSelectRestaurant = (restaurantId: string) => {
    if (restaurantId === selectedRestaurantId) return;
    setSelectedRestaurantId(restaurantId);
    setQuantities({});
    setCheckoutError(null);
    setCheckoutSuccess(null);
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCheckoutError(null);
    setCheckoutSuccess(null);
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] ?? 0) + delta),
    }));
  };

  const handlePlaceOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCheckoutError(null);
    setCheckoutSuccess(null);

    if (cartItems.length === 0) {
      setCheckoutError("Add at least one item to your cart before placing an order.");
      return;
    }

    if (!activeDeliveryAddress) {
      setCheckoutError("Please add a delivery address in the Addresses tab first.");
      return;
    }

    const trimmedPhone = checkoutPhone.trim();
    if (!/^01[3-9]\d{8}$/.test(trimmedPhone)) {
      setCheckoutError("Enter a valid 11-digit Bangladesh mobile number starting with 01.");
      return;
    }

    const idempotencyKey = `cust-${selectedRestaurant.id}-${idempotencyNonce}`;
    const currentOrders = getCustomerOrders();
    if (currentOrders.some((order) => order.idempotencyKey === idempotencyKey)) {
      setCheckoutError("This order was already submitted.");
      return;
    }

    setPlacingOrder(true);
    window.setTimeout(() => {
      const latestOrders = getCustomerOrders();
      if (!latestOrders.some((order) => order.idempotencyKey === idempotencyKey)) {
        // Recalculate prices from authoritative menu definitions
        const recalculatedItems = cartItems.map((item) => {
          const catalogItem = selectedRestaurant.menu.find(
            (m) => m.id === item.id
          );
          const unitPrice = catalogItem ? catalogItem.priceBdt : item.priceBdt;
          return {
            itemId: item.id,
            name: item.name,
            variant: item.variant,
            unitPriceBdt: unitPrice,
            quantity: item.qty,
          };
        });
        const subtotalBdt = recalculatedItems.reduce(
          (sum, item) => sum + item.unitPriceBdt * item.quantity,
          0
        );
        const deliveryFeeBdt = selectedRestaurant.deliveryFeeBdt;
        const totalBdt = subtotalBdt + deliveryFeeBdt;
        const nowIso = new Date().toISOString();

        const newOrder: CustomerOrder = {
          id: `FD-${Math.floor(1100 + Math.random() * 8800)}`,
          idempotencyKey,
          restaurantId: selectedRestaurant.id,
          restaurantName: selectedRestaurant.name,
          restaurantArea: `${selectedRestaurant.area}, ${selectedRestaurant.city}`,
          status: "pending",
          items: recalculatedItems,
          subtotalBdt,
          deliveryFeeBdt,
          totalBdt,
          commissionAmount: 0,
          paymentMethod: PAYMENT_METHODS[0],
          deliveryAddress: `${activeDeliveryAddress.streetAddress}, ${activeDeliveryAddress.area}, ${activeDeliveryAddress.city}`,
          customerPhone: trimmedPhone,
          createdAtIso: nowIso,
          updatedAtIso: nowIso,
        };

        saveCustomerOrders([newOrder, ...latestOrders]);
        setCheckoutSuccess(
          `Order ${newOrder.id} placed for ${formatBDT(totalBdt)} (Cash on Delivery).`
        );
      }

      setQuantities({});
      setIdempotencyNonce((n) => n + 1);
      setPlacingOrder(false);
      switchTab("tracking");
    }, 300);
  };

  const handleCancelOrder = (order: CustomerOrder) => {
    if (!canTransition(order.status, "cancelled", "customer")) {
      setTrackingNotice(
        "This kitchen has already started preparing your food, so it cannot be cancelled now."
      );
      return;
    }

    const updated = orders.map((item) =>
      item.id === order.id
        ? {
            ...item,
            status: "cancelled" as OrderStatus,
            updatedAtIso: new Date().toISOString(),
          }
        : item
    );
    saveCustomerOrders(updated);
    setTrackingNotice(`Order ${order.id} has been cancelled.`);
  };

  const handleAdvanceKitchenDemo = (order: CustomerOrder) => {
    const nextStatus = getNextKitchenStatus(order.status);
    if (!nextStatus || !canTransition(order.status, nextStatus, "owner")) {
      return;
    }

    const updated = orders.map((item) =>
      item.id === order.id
        ? {
            ...item,
            status: nextStatus,
            updatedAtIso: new Date().toISOString(),
          }
        : item
    );
    saveCustomerOrders(updated);
    setLastPolledTime(
      new Date().toLocaleTimeString("en-BD", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
    setTrackingNotice(
      `Order ${order.id} updated to: ${ORDER_STATUS_LABELS[nextStatus]}.`
    );
  };

  const handleManualRefresh = () => {
    getCustomerOrders();
    setLastPolledTime(
      new Date().toLocaleTimeString("en-BD", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
    setTrackingNotice("Status synced with kitchen.");
  };

  const handleReorder = (order: CustomerOrder) => {
    const restaurant = FEATURED_RESTAURANTS.find(
      (r) => r.id === order.restaurantId
    );
    if (!restaurant) {
      setHistoryNotice("This kitchen is currently unavailable for reorder.");
      return;
    }

    const nextQuantities: Record<string, number> = {};
    for (const item of order.items) {
      const stillExists = restaurant.menu.some((m) => m.id === item.itemId);
      if (stillExists) {
        nextQuantities[item.itemId] = item.quantity;
      }
    }

    setSelectedRestaurantId(restaurant.id);
    setQuantities(nextQuantities);
    setCheckoutSuccess(
      `Loaded ${order.items.length} item(s) from ${restaurant.name} into your cart.`
    );
    switchTab("browse");
  };

  const handleSetDefaultAddress = (addressId: string) => {
    const updated = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === addressId,
    }));
    saveCustomerAddresses(updated);
    setSelectedAddressId(addressId);
    setAddrSuccess("Default delivery address updated.");
  };

  const handleDeleteAddress = (addressId: string) => {
    const remaining = addresses.filter((addr) => addr.id !== addressId);
    if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
      remaining[0] = { ...remaining[0], isDefault: true };
    }
    saveCustomerAddresses(remaining);
    setAddrSuccess("Address removed.");
  };

  const handleAddAddress = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddrError(null);
    setAddrSuccess(null);

    if (addrLabel.trim().length < 2) {
      setAddrError("Enter a short label such as Home, Office, or Hostel.");
      return;
    }
    if (addrArea.trim().length < 2) {
      setAddrError("Enter your neighborhood or area name.");
      return;
    }
    if (addrStreet.trim().length < 6) {
      setAddrError("Enter house, road, and floor details.");
      return;
    }
    if (!/^01[3-9]\d{8}$/.test(addrPhone.trim())) {
      setAddrError("Enter a valid 11-digit Bangladesh mobile number starting with 01.");
      return;
    }

    setSavingAddress(true);
    window.setTimeout(() => {
      const newAddress: CustomerAddress = {
        id: `addr-${Date.now()}`,
        label: addrLabel.trim(),
        city: addrCity,
        area: addrArea.trim(),
        streetAddress: addrStreet.trim(),
        phone: addrPhone.trim(),
        isDefault: addresses.length === 0,
      };
      saveCustomerAddresses([...addresses, newAddress]);
      setAddrLabel("");
      setAddrArea("");
      setAddrStreet("");
      setAddrPhone("");
      setSavingAddress(false);
      setAddrSuccess("New delivery address saved.");
    }, 200);
  };

  // Loading skeleton prior to client hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="h-16 border-b border-zinc-200 bg-white px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="h-7 w-24 rounded bg-zinc-200" />
          <div className="h-9 w-28 rounded-lg bg-zinc-200" />
        </div>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="h-24 rounded-2xl border border-zinc-200 bg-white p-6" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="h-64 rounded-2xl border border-zinc-200 bg-white" />
            <div className="h-64 rounded-2xl border border-zinc-200 bg-white" />
            <div className="h-64 rounded-2xl border border-zinc-200 bg-white" />
          </div>
        </main>
      </div>
    );
  }

  // Unauthenticated view
  if (!session) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
          <header className="border-b border-zinc-200 bg-white">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link
                href="/"
                aria-label="Fedoo home"
                className="inline-flex items-center shrink-0"
              >
                <FedooLogo size="md" />
              </Link>
              <Link
                href="/"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-950 whitespace-nowrap"
              >
                Back to Homepage
              </Link>
            </div>
          </header>

          <main className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
              <h1 className="font-[family-name:var(--font-plus-jakarta)] text-2xl font-bold text-zinc-950">
                Sign in to your Fedoo account
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Order from neighborhood kitchens, track Cash on Delivery riders, and manage your saved addresses across Bangladesh.
              </p>

              <form onSubmit={handleSignInSubmit} className="mt-6 space-y-4" noValidate>
                {loginError && (
                  <p
                    role="alert"
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800"
                  >
                    {loginError}
                  </p>
                )}

                <div>
                  <label
                    htmlFor="customer-login-email"
                    className="mb-1 block text-xs font-medium text-zinc-700"
                  >
                    Email Address
                  </label>
                  <input
                    id="customer-login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="tariqul@example.com"
                    className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="customer-login-password"
                    className="mb-1 block text-xs font-medium text-zinc-700"
                  >
                    Password
                  </label>
                  <input
                    id="customer-login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full min-h-11 rounded-lg bg-[#B01833] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#911329] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {loggingIn ? "Signing In..." : "Sign In"}
                </button>

                <button
                  type="button"
                  disabled={loggingIn}
                  onClick={handleDemoSignIn}
                  className="w-full min-h-11 rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  Continue with Demo Customer
                </button>
              </form>
            </div>
          </main>
        </div>
      </MotionConfig>
    );
  }

  const tabs: { id: CustomerTab; label: string }[] = [
    { id: "browse", label: "Browse" },
    { id: "tracking", label: activeOrder ? "Live Order (1)" : "Live Order" },
    { id: "history", label: `Order History (${orders.length})` },
    { id: "addresses", label: `Addresses (${addresses.length})` },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-900 flex flex-col">
        {/* 3-Zone Top Bar */}
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              aria-label="Fedoo homepage"
              className="inline-flex items-center shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B01833]"
            >
              <FedooLogo size="md" />
            </Link>

            <nav
              aria-label="Customer account navigation"
              className="hidden md:flex items-center gap-2"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => switchTab(tab.id)}
                    className={`min-h-10 rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isActive
                        ? "bg-zinc-950 text-white"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-600">
                <User className="h-4 w-4 text-zinc-500" />
                <span className="font-medium text-zinc-900 max-w-32 truncate">
                  {session.name}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-zinc-700 hover:bg-zinc-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile Tab Bar */}
          <nav
            aria-label="Customer account mobile tabs"
            className="md:hidden border-t border-zinc-200 bg-white px-4 py-2 overflow-x-auto no-scrollbar"
          >
            <div className="flex items-center gap-2 min-w-max">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => switchTab(tab.id)}
                    className={`min-h-10 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#B01833] text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {/* Customer Context Strip */}
          <section
            aria-label="Account summary"
            className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-500">
                Customer Portal · {session.email}
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-plus-jakarta)] text-xl sm:text-2xl font-bold text-zinc-950">
                Welcome back, {session.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-zinc-600">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#B01833]" />
                  {activeDeliveryAddress
                    ? `${activeDeliveryAddress.label}: ${activeDeliveryAddress.streetAddress}, ${activeDeliveryAddress.area}, ${activeDeliveryAddress.city}`
                    : "No saved address yet"}
                </span>
                <button
                  type="button"
                  onClick={() => switchTab("addresses")}
                  className="font-semibold text-[#B01833] hover:underline whitespace-nowrap cursor-pointer"
                >
                  Change address
                </button>
              </div>
            </div>

            {activeOrder ? (
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 shrink-0">
                <div>
                  <p className="text-xs text-zinc-500">
                    Active Order {activeOrder.id}
                  </p>
                  <p className="text-sm font-semibold text-zinc-950">
                    {ORDER_STATUS_LABELS[activeOrder.status]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => switchTab("tracking")}
                  className="min-h-10 rounded-lg bg-[#B01833] px-4 py-2 text-xs font-semibold text-white hover:bg-[#911329] whitespace-nowrap cursor-pointer"
                >
                  Track Order
                </button>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-zinc-600 shrink-0">
                Payment method: <span className="font-semibold text-zinc-950">{PAYMENT_METHODS[0]}</span>
              </div>
            )}
          </section>

          {/* TAB 1: BROWSE & ORDER */}
          {activeTab === "browse" && (
            <div className="grid gap-6 lg:grid-cols-12 items-start">
              {/* Left: Kitchen Discovery & Menu */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 space-y-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search restaurants, areas, or dishes (e.g. Kacchi, Banani, Burger)"
                      className="w-full min-h-11 rounded-xl border border-zinc-300 bg-white pl-10 pr-4 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                    {CUISINE_CATEGORIES.map((cuisine) => {
                      const active = selectedCuisine === cuisine;
                      return (
                        <button
                          key={cuisine}
                          type="button"
                          onClick={() => setSelectedCuisine(cuisine)}
                          className={`min-h-10 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                            active
                              ? "bg-[#B01833] text-white"
                              : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          {cuisine}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {filteredRestaurants.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
                    <p className="font-[family-name:var(--font-plus-jakarta)] text-base font-semibold text-zinc-950">
                      No kitchens match your filter
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Try clearing your search or choosing another cuisine category.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCuisine("All");
                      }}
                      className="mt-4 min-h-10 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {filteredRestaurants.map((restaurant) => {
                      const isSelected = restaurant.id === selectedRestaurant.id;
                      return (
                        <article
                          key={restaurant.id}
                          className={`overflow-hidden rounded-2xl border bg-white transition-colors ${
                            isSelected
                              ? "border-[#B01833] ring-1 ring-[#B01833]"
                              : "border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <div className="relative aspect-[16/10] w-full bg-zinc-100">
                            <Image
                              src={restaurant.image}
                              alt={restaurant.imageAlt}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              referrerPolicy="no-referrer"
                              className="object-cover"
                            />
                          </div>

                          <div className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h2 className="truncate font-[family-name:var(--font-plus-jakarta)] text-base font-bold text-zinc-950">
                                  {restaurant.name}
                                </h2>
                                <p className="truncate text-xs text-zinc-500">
                                  {restaurant.area}, {restaurant.city} · {restaurant.prepWindow}
                                </p>
                              </div>
                              <span className="text-xs font-semibold tabular-nums text-zinc-950 shrink-0">
                                {formatBDT(restaurant.startingPriceBdt)}+
                              </span>
                            </div>

                            <p className="text-xs text-zinc-600 truncate">
                              {restaurant.signatureDish} · {restaurant.cuisine}
                            </p>

                            <button
                              type="button"
                              onClick={() => handleSelectRestaurant(restaurant.id)}
                              className={`mt-2 w-full min-h-10 rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-[#B01833] text-white"
                                  : "border border-zinc-200 bg-zinc-50 text-zinc-900 hover:bg-zinc-100"
                              }`}
                            >
                              {isSelected ? "Viewing Menu" : "View Menu & Order"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {/* Selected Kitchen Menu List */}
                <section
                  aria-label="Selected restaurant menu"
                  className="rounded-2xl border border-zinc-200 bg-white overflow-hidden"
                >
                  <div className="border-b border-zinc-200 px-4 sm:px-5 py-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-zinc-500">
                        {selectedRestaurant.area}, {selectedRestaurant.city} · {selectedRestaurant.prepWindow}
                      </p>
                      <h2 className="font-[family-name:var(--font-plus-jakarta)] text-lg font-bold text-zinc-950">
                        {selectedRestaurant.name} Menu
                      </h2>
                    </div>
                    <span className="text-xs text-zinc-600">
                      Delivery {formatBDT(selectedRestaurant.deliveryFeeBdt)}
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-200">
                    {selectedRestaurant.menu.map((item) => {
                      const qty = quantities[item.id] ?? 0;
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-950">
                              {item.name}
                            </p>
                            <p className="text-xs text-zinc-500">{item.variant}</p>
                            <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                              {item.description}
                            </p>
                            <p className="mt-1.5 text-sm font-semibold tabular-nums text-zinc-950">
                              {formatBDT(item.priceBdt)}
                            </p>
                          </div>

                          <div className="flex items-center justify-end shrink-0">
                            {qty > 0 ? (
                              <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50">
                                <button
                                  type="button"
                                  aria-label={`Remove one ${item.name}`}
                                  onClick={() => handleUpdateQty(item.id, -1)}
                                  className="inline-flex h-11 w-11 items-center justify-center text-zinc-700 hover:bg-zinc-100 rounded-l-lg cursor-pointer"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-8 text-center text-sm font-semibold tabular-nums text-zinc-950">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Add one ${item.name}`}
                                  onClick={() => handleUpdateQty(item.id, 1)}
                                  className="inline-flex h-11 w-11 items-center justify-center text-zinc-700 hover:bg-zinc-100 rounded-r-lg cursor-pointer"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.id, 1)}
                                className="min-h-11 rounded-lg border border-[#B01833]/30 bg-white px-4 py-2 text-xs font-semibold text-[#B01833] hover:bg-rose-50 transition-colors whitespace-nowrap cursor-pointer"
                              >
                                Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Right: Sticky Cash on Delivery Cart & Checkout */}
              <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 rounded-2xl border border-zinc-200 bg-white p-5 space-y-5">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-4">
                  <div>
                    <h2 className="font-[family-name:var(--font-plus-jakarta)] text-base font-bold text-zinc-950">
                      Your Cart
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {selectedRestaurant.name}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-zinc-600 tabular-nums">
                    {cartItems.reduce((sum, item) => sum + item.qty, 0)} item(s)
                  </span>
                </div>

                {checkoutSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-900">
                    {checkoutSuccess}
                  </div>
                )}

                {cartItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-center">
                    <p className="text-sm font-medium text-zinc-900">
                      Your cart is empty
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Select dishes from {selectedRestaurant.name} on the left to build your order.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-950 truncate">
                            {item.qty} x {item.name}
                          </p>
                          <p className="text-xs text-zinc-500">{item.variant}</p>
                        </div>
                        <span className="font-medium tabular-nums text-zinc-950 shrink-0">
                          {formatBDT(item.priceBdt * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between text-zinc-600">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-medium text-zinc-950">
                      {formatBDT(cartSubtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-600">
                    <span>Delivery fee</span>
                    <span className="tabular-nums font-medium text-zinc-950">
                      {formatBDT(cartDeliveryFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-200 pt-2 font-semibold text-zinc-950">
                    <span>Total ({PAYMENT_METHODS[0]})</span>
                    <span className="tabular-nums">{formatBDT(cartTotal)}</span>
                  </div>
                </div>

                <form onSubmit={handlePlaceOrder} className="space-y-4" noValidate>
                  {checkoutError && (
                    <p
                      role="alert"
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800"
                    >
                      {checkoutError}
                    </p>
                  )}

                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <label
                        htmlFor="checkout-address"
                        className="block text-xs font-medium text-zinc-700"
                      >
                        Delivery Address
                      </label>
                      <button
                        type="button"
                        onClick={() => switchTab("addresses")}
                        className="text-xs font-semibold text-[#B01833] hover:underline cursor-pointer"
                      >
                        Add new
                      </button>
                    </div>
                    {addresses.length === 0 ? (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        Add a delivery address in the Addresses tab to continue.
                      </p>
                    ) : (
                      <select
                        id="checkout-address"
                        value={activeDeliveryAddress?.id ?? ""}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 focus:border-[#B01833] focus:outline-none"
                      >
                        {addresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {addr.label}: {addr.streetAddress}, {addr.area}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-phone"
                      className="mb-1 block text-xs font-medium text-zinc-700"
                    >
                      Contact Mobile Number
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      value={checkoutPhone}
                      onChange={(e) => setCheckoutPhoneOverride(e.target.value)}
                      placeholder="01712345678"
                      className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={placingOrder || cartItems.length === 0}
                    className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-[#B01833] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#911329] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {placingOrder
                      ? "Placing Cash Order..."
                      : `Place Cash Order (${formatBDT(cartTotal)})`}
                  </button>
                </form>
              </aside>
            </div>
          )}

          {/* TAB 2: LIVE ORDER TRACKING (10s polling) */}
          {activeTab === "tracking" && (
            <section
              aria-label="Live order tracking"
              className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-6"
            >
              {!activeOrder ? (
                <div className="py-10 text-center max-w-md mx-auto space-y-3">
                  <p className="font-[family-name:var(--font-plus-jakarta)] text-lg font-bold text-zinc-950">
                    No active order right now
                  </p>
                  <p className="text-sm text-zinc-600">
                    When you place a Cash on Delivery order, live status updates appear here every 10 seconds until delivery.
                  </p>
                  <div className="pt-2 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => switchTab("browse")}
                      className="min-h-11 rounded-lg bg-[#B01833] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#911329] cursor-pointer"
                    >
                      Browse Kitchens
                    </button>
                    <button
                      type="button"
                      onClick={() => switchTab("history")}
                      className="min-h-11 rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 cursor-pointer"
                    >
                      View Order History
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
                    <div>
                      <p className="text-xs font-medium text-zinc-500">
                        Order {activeOrder.id} · {activeOrder.paymentMethod}
                      </p>
                      <h2 className="mt-1 font-[family-name:var(--font-plus-jakarta)] text-xl font-bold text-zinc-950">
                        {ORDER_STATUS_LABELS[activeOrder.status]}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-600">
                        {activeOrder.restaurantName} · {activeOrder.restaurantArea}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-zinc-500 tabular-nums">
                        Auto-polling every 10s · Last checked {lastPolledTime}
                      </span>
                      <button
                        type="button"
                        onClick={handleManualRefresh}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                      </button>
                    </div>
                  </div>

                  {trackingNotice && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900">
                      {trackingNotice}
                    </div>
                  )}

                  {/* Stepper */}
                  <div className="grid gap-3 sm:grid-cols-5">
                    {ACTIVE_ORDER_STEPS.map((step, index) => {
                      const currentIndex = ACTIVE_ORDER_STEPS.indexOf(
                        activeOrder.status
                      );
                      const isDone = currentIndex >= index;
                      const isCurrent = activeOrder.status === step;

                      return (
                        <div
                          key={step}
                          className={`rounded-xl border p-3.5 transition-colors ${
                            isCurrent
                              ? "border-[#B01833] bg-rose-50/50"
                              : isDone
                                ? "border-zinc-300 bg-zinc-50"
                                : "border-zinc-200 bg-white opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                                isDone
                                  ? "bg-[#B01833] text-white"
                                  : "bg-zinc-100 text-zinc-500"
                              }`}
                            >
                              <StepIcon step={step} />
                            </span>
                            <span className="text-xs font-medium tabular-nums text-zinc-500">
                              0{index + 1}
                            </span>
                          </div>
                          <p className="mt-3 text-xs font-semibold text-zinc-950">
                            {ORDER_STATUS_LABELS[step]}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Receipt & Actions */}
                  <div className="grid gap-6 md:grid-cols-2 pt-2">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                      <h3 className="font-[family-name:var(--font-plus-jakarta)] text-sm font-semibold text-zinc-950">
                        Order Items
                      </h3>
                      <div className="space-y-2 text-sm">
                        {activeOrder.items.map((item) => (
                          <div
                            key={`${item.itemId}-${item.variant}`}
                            className="flex items-start justify-between gap-3"
                          >
                            <div>
                              <p className="font-medium text-zinc-950">
                                {item.quantity} x {item.name}
                              </p>
                              <p className="text-xs text-zinc-500">{item.variant}</p>
                            </div>
                            <span className="tabular-nums font-medium text-zinc-950">
                              {formatBDT(item.unitPriceBdt * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-zinc-200 pt-3 space-y-1.5 text-sm">
                        <div className="flex justify-between text-zinc-600">
                          <span>Subtotal</span>
                          <span className="tabular-nums">
                            {formatBDT(activeOrder.subtotalBdt)}
                          </span>
                        </div>
                        <div className="flex justify-between text-zinc-600">
                          <span>Delivery fee</span>
                          <span className="tabular-nums">
                            {formatBDT(activeOrder.deliveryFeeBdt)}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-zinc-950 pt-1">
                          <span>Payable on Delivery</span>
                          <span className="tabular-nums">
                            {formatBDT(activeOrder.totalBdt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-4 flex flex-col justify-between gap-4">
                      <div className="space-y-2 text-sm">
                        <h3 className="font-[family-name:var(--font-plus-jakarta)] text-sm font-semibold text-zinc-950">
                          Delivery Details
                        </h3>
                        <p className="text-zinc-700">{activeOrder.deliveryAddress}</p>
                        <p className="text-xs text-zinc-500">
                          Contact: {activeOrder.customerPhone}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-200">
                        {getNextKitchenStatus(activeOrder.status) && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceKitchenDemo(activeOrder)}
                            className="min-h-10 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 cursor-pointer"
                          >
                            Advance Kitchen Step (Demo)
                          </button>
                        )}

                        {canTransition(activeOrder.status, "cancelled", "customer") && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(activeOrder)}
                            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 cursor-pointer"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {/* TAB 3: ORDER HISTORY */}
          {activeTab === "history" && (
            <section aria-label="Order history" className="space-y-4">
              {historyNotice && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
                  {historyNotice}
                </div>
              )}

              {orders.length === 0 ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
                  <p className="font-[family-name:var(--font-plus-jakarta)] text-base font-semibold text-zinc-950">
                    No orders yet
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Place your first Cash on Delivery meal order to see your receipts here.
                  </p>
                  <button
                    type="button"
                    onClick={() => switchTab("browse")}
                    className="mt-4 min-h-10 rounded-lg bg-[#B01833] px-4 py-2 text-sm font-semibold text-white hover:bg-[#911329] cursor-pointer"
                  >
                    Browse Kitchens
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <article
                      key={order.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <p className="text-xs text-zinc-500">
                          {order.id} · {formatOrderDate(order.createdAtIso)} · {ORDER_STATUS_LABELS[order.status]}
                        </p>
                        <h2 className="font-[family-name:var(--font-plus-jakarta)] text-base font-bold text-zinc-950">
                          {order.restaurantName}
                        </h2>
                        <p className="text-xs text-zinc-600">
                          {order.items
                            .map((item) => `${item.quantity}x ${item.name}`)
                            .join(", ")}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          Delivered to {order.deliveryAddress}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                        <span className="text-base font-bold tabular-nums text-zinc-950">
                          {formatBDT(order.totalBdt)}
                        </span>
                        <div className="flex items-center gap-2">
                          {!isTerminalStatus(order.status) && (
                            <button
                              type="button"
                              onClick={() => switchTab("tracking")}
                              className="min-h-10 rounded-lg bg-[#B01833] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#911329] cursor-pointer"
                            >
                              Track
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100 cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reorder
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 4: SAVED ADDRESSES */}
          {activeTab === "addresses" && (
            <div className="grid gap-6 lg:grid-cols-12 items-start">
              <section
                aria-label="Saved delivery addresses"
                className="lg:col-span-7 space-y-4"
              >
                {addrSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900">
                    {addrSuccess}
                  </div>
                )}

                {addresses.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
                    <p className="font-[family-name:var(--font-plus-jakarta)] text-base font-semibold text-zinc-950">
                      No saved addresses
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Add your home or office address using the form so Cash on Delivery checkout takes one tap.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {addresses.map((addr) => (
                      <article
                        key={addr.id}
                        className={`rounded-2xl border bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          addr.isDefault ? "border-[#B01833]" : "border-zinc-200"
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-500">
                            {addr.city} · {addr.area}
                            {addr.isDefault ? " · Default" : ""}
                          </p>
                          <h2 className="font-[family-name:var(--font-plus-jakarta)] text-base font-bold text-zinc-950">
                            {addr.label}
                          </h2>
                          <p className="text-sm text-zinc-700">
                            {addr.streetAddress}
                          </p>
                          <p className="text-xs text-zinc-500">
                            Mobile: {addr.phone}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="min-h-10 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 cursor-pointer"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label={`Remove ${addr.label} address`}
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <aside className="lg:col-span-5 rounded-2xl border border-zinc-200 bg-white p-5">
                <h2 className="font-[family-name:var(--font-plus-jakarta)] text-base font-bold text-zinc-950">
                  Add New Address
                </h2>
                <p className="mt-1 text-xs text-zinc-600">
                  Save home, office, or campus locations for faster Cash on Delivery checkout.
                </p>

                <form onSubmit={handleAddAddress} className="mt-4 space-y-4" noValidate>
                  {addrError && (
                    <p
                      role="alert"
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800"
                    >
                      {addrError}
                    </p>
                  )}

                  <div>
                    <label
                      htmlFor="addr-label"
                      className="mb-1 block text-xs font-medium text-zinc-700"
                    >
                      Address Label
                    </label>
                    <input
                      id="addr-label"
                      type="text"
                      value={addrLabel}
                      onChange={(e) => setAddrLabel(e.target.value)}
                      placeholder="Home, Office, or Hall"
                      className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="addr-city"
                        className="mb-1 block text-xs font-medium text-zinc-700"
                      >
                        City
                      </label>
                      <select
                        id="addr-city"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 focus:border-[#B01833] focus:outline-none"
                      >
                        {BANGLADESH_CITIES.map((item) => (
                          <option key={item.id} value={item.city}>
                            {item.city}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="addr-area"
                        className="mb-1 block text-xs font-medium text-zinc-700"
                      >
                        Neighborhood / Area
                      </label>
                      <input
                        id="addr-area"
                        type="text"
                        value={addrArea}
                        onChange={(e) => setAddrArea(e.target.value)}
                        placeholder="Dhanmondi"
                        className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="addr-street"
                      className="mb-1 block text-xs font-medium text-zinc-700"
                    >
                      House, Road & Floor
                    </label>
                    <input
                      id="addr-street"
                      type="text"
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      placeholder="House 14, Road 6, 3rd Floor"
                      className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="addr-phone"
                      className="mb-1 block text-xs font-medium text-zinc-700"
                    >
                      Delivery Mobile Number
                    </label>
                    <input
                      id="addr-phone"
                      type="tel"
                      value={addrPhone}
                      onChange={(e) => setAddrPhone(e.target.value)}
                      placeholder="01712345678"
                      className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="w-full min-h-11 rounded-lg bg-[#B01833] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#911329] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {savingAddress ? "Saving Address..." : "Save Address"}
                  </button>
                </form>
              </aside>
            </div>
          )}
        </main>
      </div>
    </MotionConfig>
  );
}
