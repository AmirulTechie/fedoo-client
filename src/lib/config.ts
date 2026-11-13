export const TRIAL_DAYS = 15;

export const DEFAULT_DELIVERY_FEE = 50;

export const COMMISSION_RATE = 0;

export const CURRENCY = "BDT";

export const PAYMENT_METHODS = ["Cash on Delivery"] as const;

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPriceBdt: number;
  summary: string;
}

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Single Kitchen",
    monthlyPriceBdt: 1500,
    summary: "1 outlet, unlimited menu items, 0% order commission",
  },
  {
    id: "growth",
    name: "Multi-Branch",
    monthlyPriceBdt: 3000,
    summary: "Up to 5 outlets, priority onboarding, 0% order commission",
  },
];
