import React, { useState, useEffect, useMemo } from 'react';
import { DashboardStats } from './DashboardStats';
import { SubscriptionList } from './SubscriptionList';
import { SubscriptionForm } from './SubscriptionForm';
import { Subscription } from '@/lib/types';
import { format, addMonths } from 'date-fns';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 初始模擬資料 (實際專案中應自 Supabase 取得)
const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1',
    name: 'Netflix',
    startDate: format(addMonths(new Date(), -5), 'yyyy-MM-15'),
    category: '影音娛樂',
    cycle: 'monthly',
    amount: 390,
    currency: 'TWD',
    nextBillingDate: format(addMonths(new Date(), 0), 'yyyy-MM-15'), // 這個月或下個月
    status: 'active',
  },
  {
    id: '2',
    name: 'ChatGPT Plus',
    startDate: format(addMonths(new Date(), -2), 'yyyy-MM-dd'),
    category: '程式軟體',
    cycle: 'monthly',
    amount: 20,
    currency: 'USD',
    nextBillingDate: format(new Date(new Date().setDate(new Date().getDate() + 3)), 'yyyy-MM-dd'), // 3 天後 (觸發提醒)
    status: 'active',
  },
  {
    id: '3',
    name: 'Spotify',
    startDate: format(addMonths(new Date(), -10), 'yyyy-MM-28'),
    category: '影音娛樂',
    cycle: 'monthly',
    amount: 149,
    currency: 'TWD',
    nextBillingDate: format(addMonths(new Date(), 0), 'yyyy-MM-28'),
    status: 'active',
  },
  {
    id: '4',
    name: 'AWS',
    startDate: format(addMonths(new Date(), -12), 'yyyy-MM-01'),
    category: '程式軟體',
    cycle: 'monthly',
    amount: 15,
    currency: 'USD',
    nextBillingDate: format(addMonths(new Date(), 0), 'yyyy-MM-01'),
    status: 'active',
  },
  {
    id: '5',
    name: '1Password',
    startDate: format(addMonths(new Date(), -1), 'yyyy-MM-15'),
    category: '日常生活',
    cycle: 'yearly',
    amount: 35.88,
    currency: 'USD',
    nextBillingDate: format(new Date(new Date().setMonth(new Date().getMonth() + 5)), 'yyyy-MM-dd'),
    status: 'active',
  }
];

export const Dashboard: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(32.5);
  const [orderMonthFilter, setOrderMonthFilter] = useState<string>('all');

  useEffect(() => {
    // 取得即時匯率
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates.TWD) {
          setExchangeRate(data.rates.TWD);
        }
      })
      .catch(err => console.error('Failed to fetch exchange rate', err));
  }, []);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setSubscriptions(MOCK_SUBSCRIPTIONS);
    };

    fetchSubscriptions();
  }, []);

  const orderMonths = useMemo(() => {
    const months = new Set<string>();
    subscriptions.forEach(sub => {
      if (sub.startDate) {
        months.add(sub.startDate.substring(0, 7)); // 'YYYY-MM'
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    if (orderMonthFilter === 'all') return subscriptions;
    return subscriptions.filter(sub => sub.startDate && sub.startDate.startsWith(orderMonthFilter));
  }, [subscriptions, orderMonthFilter]);

  const handleAddSubscription = (newSub: Omit<Subscription, 'id' | 'status'>) => {
    const subscription: Subscription = {
      ...newSub,
      id: Math.random().toString(36).substr(2, 9),
      status: 'active'
    };
    setSubscriptions(prev => [subscription, ...prev]);
  };

  const handleEditSubscription = (updatedSub: Subscription) => {
    setSubscriptions(prev => prev.map(sub => sub.id === updatedSub.id ? updatedSub : sub));
  };

  const handleDeleteSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
    toast.success('已刪除訂閱');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <header className="relative flex flex-col items-center justify-center mb-10 gap-4 text-center mt-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-repeat text-zinc-900 dark:text-white"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
            數位訂閱庫
          </h1>
        </div>
        <div className="w-full sm:w-auto md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2">
          <SubscriptionForm onAdd={handleAddSubscription} exchangeRate={exchangeRate} />
        </div>
      </header>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <h2 className="text-lg font-medium">訂閱分析與統計</h2>
        <Select value={orderMonthFilter} onValueChange={setOrderMonthFilter}>
          <SelectTrigger className="w-[180px]">
             <SelectValue placeholder="選擇訂購月份" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有訂購月份</SelectItem>
            {orderMonths.map(month => (
              <SelectItem key={month} value={month}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DashboardStats subscriptions={filteredSubscriptions} exchangeRate={exchangeRate} setExchangeRate={setExchangeRate} />
      <SubscriptionList 
        subscriptions={filteredSubscriptions} 
        onEdit={handleEditSubscription}
        onDelete={handleDeleteSubscription}
        exchangeRate={exchangeRate}
      />
      <Toaster />
    </div>
  );
};
