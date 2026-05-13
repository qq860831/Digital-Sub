import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Subscription, EXCHANGE_RATES } from '@/lib/types';
import { Wallet, CreditCard, PieChart as PieChartIcon } from 'lucide-react';

interface Props {
  subscriptions: Subscription[];
  exchangeRate?: number;
  setExchangeRate?: (rate: number) => void;
}

export const DashboardStats: React.FC<Props> = ({ subscriptions, exchangeRate = 32.5, setExchangeRate }) => {
  const activeSubs = subscriptions.filter(s => s.status === 'active');

  const { monthlyTotal, yearlyTotal, monthlyTwd, monthlyUsd, yearlyTwd, yearlyUsd, categoryData } = useMemo(() => {
    let monthlyTotalTwd = 0;
    let mTwd = 0;
    let mUsd = 0;
    const categoryTotals: Record<string, number> = {};

    activeSubs.forEach(sub => {
      const rate = sub.currency === 'USD' ? exchangeRate : 1;
      const amountInTwd = sub.amount * rate;
      
      const monthlyAmountTwd = sub.cycle === 'yearly' ? amountInTwd / 12 : amountInTwd;
      const monthlyAmountActual = sub.cycle === 'yearly' ? sub.amount / 12 : sub.amount;

      monthlyTotalTwd += monthlyAmountTwd;

      if (sub.currency === 'TWD') {
        mTwd += monthlyAmountActual;
      } else if (sub.currency === 'USD') {
        mUsd += monthlyAmountActual;
      }

      if (sub.category) {
        categoryTotals[sub.category] = (categoryTotals[sub.category] || 0) + monthlyAmountTwd;
      } else {
        categoryTotals['未分類'] = (categoryTotals['未分類'] || 0) + monthlyAmountTwd;
      }
    });

    const yearlyTotalTwd = monthlyTotalTwd * 12;
    const yTwd = mTwd * 12;
    const yUsd = mUsd * 12;
    
    const CATEGORY_COLORS: Record<string, string> = {
      '日常生活': '#64748b', // slate-500
      '影音娛樂': '#9ca3af', // gray-400
      '程式軟體': '#71717a', // zinc-500
      '圖文設計': '#a8a29e', // stone-400
    };
    const DEFAULT_COLOR = '#737373'; // neutral-500

    const chartData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Math.round(value),
      color: CATEGORY_COLORS[name] || DEFAULT_COLOR
    }));

    return { 
      monthlyTotal: Math.round(monthlyTotalTwd), 
      yearlyTotal: Math.round(yearlyTotalTwd),
      monthlyTwd: Math.round(mTwd),
      monthlyUsd: Math.round(mUsd * 10) / 10,
      yearlyTwd: Math.round(yTwd),
      yearlyUsd: Math.round(yUsd * 10) / 10,
      categoryData: chartData
    };
  }, [activeSubs]);

  return (
    <div className="mb-8">
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 h-auto p-1">
          <TabsTrigger value="monthly" className="flex items-center gap-2 py-2">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">每月支出</span>
            <span className="sm:hidden">每月</span>
          </TabsTrigger>
          <TabsTrigger value="yearly" className="flex items-center gap-2 py-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">年度支出</span>
            <span className="sm:hidden">年度</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2 py-2">
            <PieChartIcon className="w-4 h-4" />
            <span className="hidden sm:inline">支出類別</span>
            <span className="sm:hidden">類別</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly">
          <Card className="overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-none border-none bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80">本月預計總支出 (TWD)</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex text-[10px] items-center gap-1.5 font-bold border border-white/20 dark:border-black/20 rounded-full px-2.5 py-1 bg-white/10 dark:bg-black/5 backdrop-blur-md">
                   USDRate:
                  <input 
                    type="number" 
                    value={exchangeRate || ''} 
                    onChange={(e) => setExchangeRate?.(Number(e.target.value))}
                    className="w-10 bg-transparent text-white dark:text-zinc-900 font-black focus:outline-none text-center"
                    step="0.1"
                  />
                </div>
                <Wallet className="w-4 h-4 opacity-60" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black tracking-tighter py-6 flex items-baseline gap-2">
                <span className="text-2xl opacity-60">NT$</span>
                {monthlyTotal.toLocaleString()}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-white/10 dark:bg-black/5 p-3 rounded-2xl backdrop-blur-sm border border-white/10 dark:border-black/5">
                   <div className="text-[10px] font-bold opacity-60 uppercase mb-1">台幣項目</div>
                   <div className="font-bold text-lg">NT$ {monthlyTwd.toLocaleString()}</div>
                </div>
                <div className="bg-white/10 dark:bg-black/5 p-3 rounded-2xl backdrop-blur-sm border border-white/10 dark:border-black/5">
                   <div className="text-[10px] font-bold opacity-60 uppercase mb-1">美金項目</div>
                   <div className="font-bold text-lg">$ {monthlyUsd.toLocaleString()}</div>
                </div>
              </div>
              <p className="text-[10px] opacity-50 mt-4 font-medium italic">包含所有訂閱項目的每月平攤額度</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yearly">
          <Card className="overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-none border-none bg-gradient-to-br from-indigo-900 to-violet-900 dark:from-indigo-100 dark:to-violet-200 text-white dark:text-indigo-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80">年度預估總支出 (TWD)</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex text-[10px] items-center gap-1.5 font-bold border border-white/20 dark:border-black/20 rounded-full px-2.5 py-1 bg-white/10 dark:bg-black/5 backdrop-blur-md">
                   USDRate:
                  <input 
                    type="number" 
                    value={exchangeRate || ''} 
                    onChange={(e) => setExchangeRate?.(Number(e.target.value))}
                    className="w-10 bg-transparent text-white dark:text-indigo-950 font-black focus:outline-none text-center"
                    step="0.1"
                  />
                </div>
                <CreditCard className="w-4 h-4 opacity-60" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black tracking-tighter py-6 flex items-baseline gap-2">
                <span className="text-2xl opacity-60">NT$</span>
                {yearlyTotal.toLocaleString()}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-white/10 dark:bg-black/5 p-3 rounded-2xl backdrop-blur-sm border border-white/10 dark:border-black/5">
                   <div className="text-[10px] font-bold opacity-60 uppercase mb-1">台幣年度</div>
                   <div className="font-bold text-lg">NT$ {yearlyTwd.toLocaleString()}</div>
                </div>
                <div className="bg-white/10 dark:bg-black/5 p-3 rounded-2xl backdrop-blur-sm border border-white/10 dark:border-black/5">
                   <div className="text-[10px] font-bold opacity-60 uppercase mb-1">美金年度</div>
                   <div className="font-bold text-lg">$ {yearlyUsd.toLocaleString()}</div>
                </div>
              </div>
              <p className="text-[10px] opacity-50 mt-4 font-medium italic">目前所有有效訂閱項目的年化總計</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="shadow-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">支出類別分佈</CardTitle>
              <PieChartIcon className="w-4 h-4 text-zinc-400" />
            </CardHeader>
            <CardContent className="h-[250px] p-0 pb-4 mt-4">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => [`NT$ ${value}`, '金額']} 
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <div className="h-full flex items-center justify-center text-sm text-gray-400">目前尚無數據</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
