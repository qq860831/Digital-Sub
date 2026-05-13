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
import { Button } from '@/components/ui/button';


import { User } from '@supabase/supabase-js';
import { Auth } from './Auth';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";


interface DashboardProps {
  user: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
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
    if (!user) {
      const localData = localStorage.getItem('subscriptions');
      if (localData) {
        setSubscriptions(JSON.parse(localData));
      }
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('next_billing_date', { ascending: true });

    if (error) {
      // 靜默處理讀取錯誤，避免彈窗干擾
      console.error('Fetch error:', error);
    } else if (data) {
      if (data.length === 0) {
        // 如果資料庫是空的，自動恢復原始資料
        await autoSeedData();
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
          status: item.status
        }));
        setSubscriptions(mappedData);
      }
    }
    setLoading(false);
  };

  const autoSeedData = async () => {
    const MOCK_DATA = [
      { name: 'Netflix', category: '影音娛樂', billing_cycle: 'monthly', amount: 390, currency: 'TWD', start_date: '2025-12-15', next_billing_date: '2026-05-15', status: 'active' },
      { name: 'ChatGPT Plus', category: '程式軟體', billing_cycle: 'monthly', amount: 20, currency: 'USD', start_date: '2026-03-13', next_billing_date: '2026-05-16', status: 'active' },
      { name: 'Spotify', category: '影音娛樂', billing_cycle: 'monthly', amount: 149, currency: 'TWD', start_date: '2025-07-28', next_billing_date: '2026-05-28', status: 'active' },
      { name: 'AWS', category: '程式軟體', billing_cycle: 'monthly', amount: 15, currency: 'USD', start_date: '2025-05-01', next_billing_date: '2026-06-01', status: 'active' },
      { name: '1Password', category: '日常生活', billing_cycle: 'yearly', amount: 35.88, currency: 'USD', start_date: '2026-04-15', next_billing_date: '2027-04-15', status: 'active' }
    ];
    
    const { error } = await supabase.from('subscriptions').insert(MOCK_DATA);
    if (!error) {
      // 成功後重新讀取
      const { data: newData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('next_billing_date', { ascending: true });
      
      if (newData) {
        const mappedData = newData.map((item: any) => ({
          id: item.id,
          name: item.name,
          startDate: item.start_date,
          category: item.category,
          cycle: item.billing_cycle,
          amount: item.amount,
          currency: item.currency,
          nextBillingDate: item.next_billing_date,
          notes: item.notes,
          status: item.status
        }));
        setSubscriptions(mappedData);
      }
    }
  };


  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    }
  }, [user]);

  useEffect(() => {
    const migrateLocalData = async () => {
      const localData = localStorage.getItem('subscriptions');
      if (localData) {
        try {
          const subs = JSON.parse(localData);
          if (Array.isArray(subs) && subs.length > 0) {
            toast.info('正在遷移本地資料...');
            
            const toInsert = subs.map(sub => ({
              user_id: user.id,
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
            
            if (!error) {
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
    if (!user) {
      const guestSub: Subscription = {
        ...newSub,
        id: crypto.randomUUID(),
        status: 'active'
      };
      const updatedList = [guestSub, ...subscriptions];
      setSubscriptions(updatedList);
      localStorage.setItem('subscriptions', JSON.stringify(updatedList));
      toast.success('已新增訂閱 (儲存於本地)');
      return;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([
        {
          user_id: user.id,
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
      .select();

    if (error) {
      toast.error(`新增失敗: ${error.message}`);
      console.error('Insert error:', error);
    } else if (data && data.length > 0) {
      const inserted = data[0];
      const mappedSub: Subscription = {
        id: inserted.id,
        name: inserted.name,
        startDate: inserted.start_date,
        category: inserted.category,
        cycle: inserted.billing_cycle,
        amount: inserted.amount,
        currency: inserted.currency,
        nextBillingDate: inserted.next_billing_date,
        notes: inserted.notes,
        status: inserted.status
      };
      setSubscriptions(prev => [mappedSub, ...prev]);
      toast.success('已新增訂閱');
    }
  };


  const handleEditSubscription = async (updatedSub: Subscription) => {
    if (!user) {
      const updatedList = subscriptions.map(sub => sub.id === updatedSub.id ? updatedSub : sub);
      setSubscriptions(updatedList);
      localStorage.setItem('subscriptions', JSON.stringify(updatedList));
      toast.success('已更新訂閱 (本地)');
      return;
    }

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
    if (!user) {
      const updatedList = subscriptions.filter(sub => sub.id !== id);
      setSubscriptions(updatedList);
      localStorage.setItem('subscriptions', JSON.stringify(updatedList));
      toast.success('已刪除訂閱 (本地)');
      return;
    }

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
      <header className="relative flex flex-col md:flex-row items-center justify-between mb-12 gap-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl border border-white dark:border-zinc-800/50 shadow-xl shadow-zinc-200/20 dark:shadow-none mt-4">
        <div className="flex flex-col items-center md:items-start gap-2">
          <h1 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-zinc-900 dark:bg-white rounded-xl shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-zinc-900"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
            </div>
            數位訂閱庫
          </h1>
          {user ? (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 truncate max-w-[150px] sm:max-w-none">{user.email}</span>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors ml-2"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-zinc-300 animate-pulse"></div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">訪客模式 (未同步)</span>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white hover:underline ml-2">
                    登入以同步
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md p-0 border-none bg-transparent shadow-none">
                  <Auth />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
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
