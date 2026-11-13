"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { PAYMENT_METHODS } from "@/lib/config";
import {
  getCustomerAddresses,
  getCustomerOrders,
  getCustomerSession,
  getServerCustomerAddresses,
  getServerCustomerSession,
  saveCustomerOrders,
  subscribeCustomerStore,
  type CustomerOrder,
} from "@/lib/customer-session";
import { formatBDT, type FeaturedRestaurant } from "@/lib/landing-data";

interface RestaurantDrawerProps {
  restaurant: FeaturedRestaurant | null;
  onClose: () => void;
}

export default function RestaurantDrawer({
  restaurant,
  onClose,
}: RestaurantDrawerProps) {
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

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderReference, setOrderReference] = useState<string | null>(null);
  const [orderNonce, setOrderNonce] = useState(1);

  if (!restaurant) return null;

  const defaultAddress = addresses.find((addr) => addr.isDefault) ?? addresses[0];

  const handleUseSavedDetails = () => {
    if (session) {
      setCustomerName(session.name);
      setPhone(session.phone);
    }
    if (defaultAddress) {
      setPhone(defaultAddress.phone);
      setAddress(
        `${defaultAddress.streetAddress}, ${defaultAddress.area}, ${defaultAddress.city}`
      );
    }
    setFormError(null);
  };

  const updateQty = (itemId: string, delta: number) => {
    setOrderReference(null);
    setFormError(null);
    setQuantities((prev) => {
      const next = Math.max(0, (prev[itemId] ?? 0) + delta);
      return { ...prev, [itemId]: next };
    });
  };

  const selectedItems = restaurant.menu
    .map((item) => ({
      ...item,
      qty: quantities[item.id] ?? 0,
    }))
    .filter((item) => item.qty > 0);

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.priceBdt * item.qty,
    0
  );
  const total = subtotal > 0 ? subtotal + restaurant.deliveryFeeBdt : 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (selectedItems.length === 0) {
      setFormError("Please add at least one item from the menu first.");
      return;
    }

    if (customerName.trim().length < 2) {
      setFormError("Please enter your full name.");
      return;
    }

    const normalizedPhone = phone.trim();
    if (!/^01[3-9]\d{8}$/.test(normalizedPhone)) {
      setFormError("Enter a valid 11-digit Bangladesh mobile number starting with 01.");
      return;
    }

    if (address.trim().length < 8) {
      setFormError("Please provide your house, road, and area details for delivery.");
      return;
    }

    setSubmitting(true);
    const idempotencyKey = `drawer-${restaurant.id}-${orderNonce}`;
    window.setTimeout(() => {
      const existing = getCustomerOrders();
      if (!existing.some((order) => order.idempotencyKey === idempotencyKey)) {
        const nowIso = new Date().toISOString();
        const nextId = `FD-${Math.floor(1100 + Math.random() * 8800)}`;
        const newOrder: CustomerOrder = {
          id: nextId,
          idempotencyKey,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          restaurantArea: `${restaurant.area}, ${restaurant.city}`,
          status: "pending",
          items: selectedItems.map((item) => ({
            itemId: item.id,
            name: item.name,
            variant: item.variant,
            unitPriceBdt: item.priceBdt,
            quantity: item.qty,
          })),
          subtotalBdt: subtotal,
          deliveryFeeBdt: restaurant.deliveryFeeBdt,
          totalBdt: total,
          commissionAmount: 0,
          paymentMethod: PAYMENT_METHODS[0],
          deliveryAddress: address.trim(),
          customerPhone: normalizedPhone,
          createdAtIso: nowIso,
          updatedAtIso: nowIso,
        };
        saveCustomerOrders([newOrder, ...existing]);
        setOrderReference(nextId);
        setOrderNonce((n) => n + 1);
      }
      setSubmitting(false);
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-zinc-950/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-restaurant-title"
    >
      <div className="flex h-[92dvh] sm:h-full w-full sm:max-w-lg flex-col rounded-t-2xl sm:rounded-none bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 sm:px-5 py-3.5 sm:py-4">
          <div className="min-w-0">
            <p className="truncate text-xs text-zinc-500">
              {restaurant.area}, {restaurant.city} · {restaurant.prepWindow}
            </p>
            <h2
              id="drawer-restaurant-title"
              className="truncate font-[family-name:var(--font-plus-jakarta)] text-base sm:text-lg font-bold text-zinc-950"
            >
              {restaurant.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close restaurant menu"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B01833] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 sm:py-5 space-y-6">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-100">
            <Image
              src={restaurant.image}
              alt={restaurant.imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              referrerPolicy="no-referrer"
              className="object-cover"
            />
          </div>

          <section aria-label="Menu items">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-[family-name:var(--font-plus-jakarta)] text-base font-semibold text-zinc-950">
                Menu
              </h3>
              <span className="text-xs text-zinc-500">
                {PAYMENT_METHODS[0]} · {restaurant.prepWindow}
              </span>
            </div>

            <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
              {restaurant.menu.map((item) => {
                const qty = quantities[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-950">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-500">{item.variant}</p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                        {item.description}
                      </p>
                      <p className="mt-2 text-sm font-semibold tabular-nums text-zinc-950">
                        {formatBDT(item.priceBdt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center justify-end sm:pt-1">
                      {qty > 0 ? (
                        <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50">
                          <button
                            type="button"
                            aria-label={`Remove one ${item.name}`}
                            onClick={() => updateQty(item.id, -1)}
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
                            onClick={() => updateQty(item.id, 1)}
                            className="inline-flex h-11 w-11 items-center justify-center text-zinc-700 hover:bg-zinc-100 rounded-r-lg cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="min-h-11 px-4 py-2 text-xs font-semibold text-[#B01833] border border-[#B01833]/30 bg-white rounded-lg hover:bg-rose-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-label="Cash on delivery checkout preview" className="space-y-4 pb-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between text-zinc-600">
                <span>Food subtotal</span>
                <span className="tabular-nums font-medium text-zinc-950">
                  {formatBDT(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <span>Delivery fee</span>
                <span className="tabular-nums font-medium text-zinc-950">
                  {subtotal > 0 ? formatBDT(restaurant.deliveryFeeBdt) : formatBDT(0)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-200 pt-2 font-semibold text-zinc-950">
                <span>Total (Cash on Delivery)</span>
                <span className="tabular-nums">{formatBDT(total)}</span>
              </div>
            </div>

            {orderReference ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700 mt-0.5" />
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold">
                        Order {orderReference} confirmed
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                        {restaurant.name} received your Cash on Delivery order for{" "}
                        {formatBDT(total)}. Track progress in real time from your customer dashboard.
                      </p>
                    </div>
                    <Link
                      href="/customer?tab=tracking"
                      onClick={onClose}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#B01833] px-4 py-2 text-xs font-semibold text-white hover:bg-[#911329] transition-colors whitespace-nowrap"
                    >
                      Track Live Order
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-[family-name:var(--font-plus-jakarta)] text-sm font-semibold text-zinc-950">
                    Delivery Details (Cash on Delivery)
                  </h3>
                  {(session || defaultAddress) && (
                    <button
                      type="button"
                      onClick={handleUseSavedDetails}
                      className="text-xs font-semibold text-[#B01833] hover:underline whitespace-nowrap cursor-pointer"
                    >
                      Use saved details
                    </button>
                  )}
                </div>

                {formError && (
                  <p
                    role="alert"
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800"
                  >
                    {formError}
                  </p>
                )}

                <div>
                  <label
                    htmlFor="preview-name"
                    className="mb-1 block text-xs font-medium text-zinc-700"
                  >
                    Full Name
                  </label>
                  <input
                    id="preview-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Tariqul Islam"
                    className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="preview-phone"
                    className="mb-1 block text-xs font-medium text-zinc-700"
                  >
                    Mobile Number
                  </label>
                  <input
                    id="preview-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01712345678"
                    className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="preview-address"
                    className="mb-1 block text-xs font-medium text-zinc-700"
                  >
                    Delivery Address in {restaurant.area}
                  </label>
                  <input
                    id="preview-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House 14, Road 6, Block C"
                    className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-[#B01833] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#911329] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {submitting
                    ? "Placing Order..."
                    : `Place Cash Order (${formatBDT(total)})`}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
