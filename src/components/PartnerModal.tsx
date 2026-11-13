"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { BANGLADESH_CITIES } from "@/lib/landing-data";

interface PartnerModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PartnerModal({ open, onClose }: PartnerModalProps) {
  const [restaurantName, setRestaurantName] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRestaurant, setSubmittedRestaurant] = useState<string | null>(
    null
  );

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (restaurantName.trim().length < 2) {
      setError("Please enter your restaurant or kitchen name.");
      return;
    }

    if (!/^01[3-9]\d{8}$/.test(phone.trim())) {
      setError(
        "Enter a valid 11-digit Bangladesh mobile number starting with 01."
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSubmittedRestaurant(`${restaurantName.trim()} (${city})`);
      setRestaurantName("");
      setPhone("");
      setEmail("");
    }, 350);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="partner-modal-title"
    >
      <div className="w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="partner-modal-title"
              className="font-[family-name:var(--font-plus-jakarta)] text-xl font-bold text-zinc-950"
            >
              Partner with Fedoo
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Share your kitchen details and our local onboarding team will reach out.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close partner dialog"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submittedRestaurant ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700 mt-0.5" />
              <div>
                <p className="font-semibold">Application received</p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                  Thank you! Our team received your request for{" "}
                  {submittedRestaurant} and will contact you shortly to complete
                  onboarding.
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
                htmlFor="modal-partner-name"
                className="mb-1 block text-xs font-medium text-zinc-700"
              >
                Restaurant Name
              </label>
              <input
                id="modal-partner-name"
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Dhanmondi Spice House"
                className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="modal-partner-city"
                className="mb-1 block text-xs font-medium text-zinc-700"
              >
                City
              </label>
              <select
                id="modal-partner-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
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
                htmlFor="modal-partner-phone"
                className="mb-1 block text-xs font-medium text-zinc-700"
              >
                Owner Mobile Number
              </label>
              <input
                id="modal-partner-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01712345678"
                className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="modal-partner-email"
                className="mb-1 block text-xs font-medium text-zinc-700"
              >
                Email Address
              </label>
              <input
                id="modal-partner-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@kitchen.bd"
                className="w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-11 rounded-lg bg-[#B01833] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#911329] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting ? "Sending Request..." : "Submit Restaurant"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
