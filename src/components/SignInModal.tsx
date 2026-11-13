"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import {
  createNameFromEmail,
  saveCustomerSession,
} from "@/lib/customer-session";

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SignInModal({ open, onClose }: SignInModalProps) {
  const router = useRouter();
  const [role, setRole] = useState<"customer" | "owner">("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signedInOwner, setSignedInOwner] = useState<string | null>(null);

  if (!open) return null;

  const completeCustomerLogin = (customerEmail: string, customName?: string) => {
    const cleanEmail = customerEmail.trim();
    saveCustomerSession({
      id: `cust-${cleanEmail.toLowerCase()}`,
      name: customName ?? createNameFromEmail(cleanEmail),
      email: cleanEmail,
      phone: "01712345678",
    });
    setSubmitting(false);
    onClose();
    router.push("/customer");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      if (role === "customer") {
        completeCustomerLogin(email);
      } else {
        setSubmitting(false);
        setSignedInOwner(email.trim());
      }
    }, 250);
  };

  const handleDemoCustomerLogin = () => {
    setError(null);
    setSubmitting(true);
    window.setTimeout(() => {
      completeCustomerLogin("tariqul@fedoo.bd", "Tariqul Islam");
    }, 200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
    >
      <div className="w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="signin-modal-title"
              className="font-[family-name:var(--font-plus-jakarta)] text-xl font-bold text-zinc-950"
            >
              Sign in to Fedoo
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Access your customer orders or restaurant kitchen portal.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => {
              setRole("customer");
              setSignedInOwner(null);
              setError(null);
            }}
            className={`min-h-11 rounded-md px-3 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              role === "customer"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("owner");
              setSignedInOwner(null);
              setError(null);
            }}
            className={`min-h-11 rounded-md px-3 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              role === "owner"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            Restaurant Owner
          </button>
        </div>

        {signedInOwner ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700 mt-0.5" />
              <div>
                <p className="font-semibold">Owner portal preview ready</p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                  Signed in as {signedInOwner} (Restaurant Owner). The owner kitchen dashboard is the next build slice.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800"
              >
                {error}
              </p>
            )}

            <div>
              <label
                htmlFor="signin-email"
                className="mb-1 block text-xs font-medium text-zinc-700"
              >
                Email Address
              </label>
              <input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  role === "owner" ? "owner@nawabhandi.bd" : "customer@example.com"
                }
                className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="signin-password"
                className="mb-1 block text-xs font-medium text-zinc-700"
              >
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-11 rounded-lg bg-[#B01833] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#911329] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting
                ? "Signing In..."
                : `Continue as ${role === "owner" ? "Restaurant Owner" : "Customer"}`}
            </button>

            {role === "customer" && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleDemoCustomerLogin}
                className="w-full min-h-11 rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-60 transition-colors cursor-pointer"
              >
                Use Demo Customer Account
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
