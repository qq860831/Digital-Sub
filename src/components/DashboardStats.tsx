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
          <Card className="shadow-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 shrink-0">本月預計總支出 (TWD)</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex text-xs text-zinc-500 items-center gap-1.5 font-medium border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1">
                  即時匯率: 1 USD = 
                  <input 
                    type="number" 
                    value={exchangeRate || ''} 
                    onChange={(e) => setExchangeRate?.(Number(e.target.value))}
                    className="w-12 bg-transparent text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:outline-none rounded pl-1 pr-0 py-0.5"
                    step="0.1"
                  />
                  TWD
                </div>
                <Wallet className="w-4 h-4 text-zinc-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight py-4">NT$ {monthlyTotal.toLocaleString()}</div>
              <div className="flex gap-4 text-sm mt-2 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">台幣:</span>
                  <span>NT$ {monthlyTwd.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">美金:</span>
                  <span>$ {monthlyUsd.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">包含所有月訂閱與年訂閱的分攤。</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yearly">
          <Card className="shadow-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 shrink-0">年度預估總支出 (TWD)</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex text-xs text-zinc-500 items-center gap-1.5 font-medium border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1">
                  即時匯率: 1 USD = 
                  <input 
                    type="number" 
                    value={exchangeRate || ''} 
                    onChange={(e) => setExchangeRate?.(Number(e.target.value))}
                    className="w-12 bg-transparent text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:outline-none rounded pl-1 pr-0 py-0.5"
                    step="0.1"
                  />
                  TWD
                </div>
                <CreditCard className="w-4 h-4 text-zinc-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight py-4">NT$ {yearlyTotal.toLocaleString()}</div>
              <div className="flex gap-4 text-sm mt-2 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">台幣:</span>
                  <span>NT$ {yearlyTwd.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">美金:</span>
                  <span>$ {yearlyUsd.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">目前有效訂閱的年化總支出，供長期預算規劃與檢視。</p>
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
