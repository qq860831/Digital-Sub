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
import { supabase } from '@/lib/supabase';

export const Dashboard: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchSubscriptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('next_billing_date', { ascending: true });

    if (error) {
      toast.error('無法讀取資料');
      console.error(error);
    } else {
      const mappedData = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        startDate: item.start_date,
        category: item.category,
        cycle: item.billing_cycle,
        amount: item.amount,
        currency: item.currency,
        nextBillingDate: item.next_billing_date,
        notes: item.notes,
        status: item.status,
        user_id: item.user_id
      }));
      setSubscriptions(mappedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    const migrateLocalData = async () => {
      const localData = localStorage.getItem('subscriptions');
      if (localData) {
        try {
          const subs = JSON.parse(localData);
          if (Array.isArray(subs) && subs.length > 0) {
            toast.info('發現本地舊資料，正在同步至雲端...');
            
            const toInsert = subs.map(sub => ({
              name: sub.name,
              category: sub.category,
              billing_cycle: sub.cycle || sub.billing_cycle || 'monthly',
              amount: sub.amount,
              currency: sub.currency || 'TWD',
              start_date: sub.startDate || sub.start_date || new Date().toISOString().split('T')[0],
              next_billing_date: sub.nextBillingDate || sub.next_billing_date || new Date().toISOString().split('T')[0],
              notes: sub.notes || '',
              status: sub.status || 'active'
            }));

            const { error } = await supabase.from('subscriptions').insert(toInsert);
            
            if (error) {
              console.error('Migration insert error:', error);
            } else {
              toast.success('同步完成！');
              localStorage.removeItem('subscriptions');
              fetchSubscriptions();
            }
          }
        } catch (e) {
          console.error('Migration failed', e);
        }
      }
    };
    
    migrateLocalData();
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

  const handleAddSubscription = async (newSub: Omit<Subscription, 'id' | 'status'>) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([
        {
          name: newSub.name,
          category: newSub.category,
          billing_cycle: newSub.cycle,
          amount: newSub.amount,
          currency: newSub.currency,
          start_date: newSub.startDate,
          next_billing_date: newSub.nextBillingDate,
          notes: newSub.notes,
          status: 'active'
        }
      ])
      .select()
      .single();

    if (error) {
      toast.error('新增失敗');
      console.error(error);
    } else {
      const mappedSub: Subscription = {
        id: data.id,
        name: data.name,
        startDate: data.start_date,
        category: data.category,
        cycle: data.billing_cycle,
        amount: data.amount,
        currency: data.currency,
        nextBillingDate: data.next_billing_date,
        notes: data.notes,
        status: data.status,
        user_id: data.user_id
      };
      setSubscriptions(prev => [mappedSub, ...prev]);
      toast.success('已新增訂閱');
    }
  };

  const handleEditSubscription = async (updatedSub: Subscription) => {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        name: updatedSub.name,
        category: updatedSub.category,
        billing_cycle: updatedSub.cycle,
        amount: updatedSub.amount,
        currency: updatedSub.currency,
        start_date: updatedSub.startDate,
        next_billing_date: updatedSub.nextBillingDate,
        notes: updatedSub.notes,
        status: updatedSub.status
      })
      .eq('id', updatedSub.id);

    if (error) {
      toast.error('更新失敗');
      console.error(error);
    } else {
      setSubscriptions(prev => prev.map(sub => sub.id === updatedSub.id ? updatedSub : sub));
      toast.success('已更新訂閱');
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('刪除失敗');
      console.error(error);
    } else {
      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
      toast.success('已刪除訂閱');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <header className="relative flex flex-col items-center justify-center mb-10 gap-4 text-center mt-4">
        <div className="flex items-center gap-4">
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
