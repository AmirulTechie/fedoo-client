import { Suspense } from "react";
import type { Metadata } from "next";
import CustomerDashboard from "@/components/CustomerDashboard";

export const metadata: Metadata = {
  title: "My Account — Fedoo",
  description:
    "Browse local kitchens, place Cash on Delivery orders, track live delivery progress, and manage saved addresses on Fedoo.",
};

function CustomerDashboardFallback() {
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

export default function CustomerPage() {
  return (
    <Suspense fallback={<CustomerDashboardFallback />}>
      <CustomerDashboard />
    </Suspense>
  );
}
