export interface Subscription {
  id: string;
  name: string;
  startDate: string;
  category: string;
  cycle: 'monthly' | 'yearly';
  amount: number;
  currency: 'TWD' | 'USD';
  nextBillingDate: string;
  paymentMethod?: string;
  notes?: string;
  status: 'active' | 'cancelled';
}

export const EXCHANGE_RATES: Record<string, number> = {
  TWD: 1,
  USD: 32.5,
};
