import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Subscription } from '@/lib/types';
import { format, differenceInDays } from 'date-fns';
import { 
  AlertCircle, MoreHorizontal, Edit, Trash2, Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SubscriptionForm } from './SubscriptionForm';

interface Props {
  subscriptions: Subscription[];
  onDelete: (id: string) => void;
  onEdit: (sub: Subscription) => void;
  exchangeRate?: number;
}

export const SubscriptionList: React.FC<Props> = ({ subscriptions, onDelete, onEdit, exchangeRate }) => {
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const handleEditCompleted = (updatedSub: Subscription) => {
    onEdit(updatedSub);
    setEditingSub(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '日常生活': return 'text-slate-700 bg-slate-100 border-slate-200/60 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-800';
      case '影音娛樂': return 'text-gray-700 bg-gray-100 border-gray-200/60 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-800';
      case '程式軟體': return 'text-zinc-700 bg-zinc-100 border-zinc-200/60 dark:bg-zinc-800/40 dark:text-zinc-300 dark:border-zinc-800';
      case '圖文設計': return 'text-stone-700 bg-stone-100 border-stone-200/60 dark:bg-stone-800/40 dark:text-stone-300 dark:border-stone-800';
      default: return 'text-neutral-700 bg-neutral-100 border-neutral-200/60 dark:bg-neutral-800/40 dark:text-neutral-300 dark:border-neutral-800';
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(subscriptions.map(s => s.category));
    return Array.from(cats);
  }, [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      // Category filter
      if (categoryFilter !== 'all' && sub.category !== categoryFilter) {
        return false;
      }
      
      // Date filter
      if (dateFilter !== 'all') {
        const nextBillingDate = new Date(sub.nextBillingDate);
        const daysUntilBilling = differenceInDays(nextBillingDate, new Date());
        
        if (dateFilter === '7days' && (daysUntilBilling < 0 || daysUntilBilling > 7)) return false;
        if (dateFilter === '30days' && (daysUntilBilling < 0 || daysUntilBilling > 30)) return false;
        if (dateFilter === 'overdue' && daysUntilBilling >= 0) return false;
      }
      
      return true;
    });
  }, [subscriptions, categoryFilter, dateFilter]);

  return (
    <>
      <Card className="shadow-sm border-gray-100 dark:border-gray-800">
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <CardTitle>訂閱項目</CardTitle>
            <CardDescription>管理您的所有數位訂閱工具與平台</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="所有類別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有類別</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="扣款時間" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有時間</SelectItem>
                <SelectItem value="7days">7 天內扣款</SelectItem>
                <SelectItem value="30days">30 天內扣款</SelectItem>
                <SelectItem value="overdue">已逾期</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* 桌面端表格視圖 */}
          <div className="hidden md:block overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                  <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">名稱</TableHead>
                  <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">類別</TableHead>
                  <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">費用</TableHead>
                  <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">週期</TableHead>
                  <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">下次扣款</TableHead>
                  <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">狀態</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={7} className="text-center py-12 text-gray-400">目前沒有符合條件的訂閱資料</TableCell>
                   </TableRow>
                ) : filteredSubscriptions.map(sub => {
                  const isCancelled = sub.status === 'cancelled';
                  const nextBillingDate = new Date(sub.nextBillingDate);
                  const daysUntilBilling = differenceInDays(nextBillingDate, new Date());
                  
                  const isUpcoming = !isCancelled && daysUntilBilling >= 0 && daysUntilBilling <= 7;
                  const isOverdue = !isCancelled && daysUntilBilling < 0;

                  return (
                    <TableRow key={sub.id} className={`${isCancelled ? 'opacity-60 grayscale-[0.5]' : ''} transition-colors`}>
                      <TableCell className="font-semibold text-zinc-900 dark:text-white">
                        {sub.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-medium px-2.5 py-0.5 rounded-full ${getCategoryColor(sub.category)}`}>{sub.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-zinc-900 dark:text-white">{sub.amount.toLocaleString()}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{sub.currency}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {sub.cycle === 'monthly' ? '月繳' : '年繳'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">
                            {format(nextBillingDate, 'yyyy-MM-dd')}
                          </span>
                          {isUpcoming && (
                            <div className="flex items-center text-amber-600 text-[10px] font-bold gap-1 uppercase tracking-wider">
                              <AlertCircle className="w-3 h-3" />
                              剩 {daysUntilBilling} 天
                            </div>
                          )}
                          {isOverdue && (
                            <div className="flex items-center text-rose-600 text-[10px] font-bold gap-1 uppercase tracking-wider">
                              <AlertCircle className="w-3 h-3" />
                              逾期 {Math.abs(daysUntilBilling)} 天
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sub.status === 'active' ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            使用中
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 font-medium text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                            已退訂
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem onClick={() => setEditingSub(sub)} className="cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" />
                              編輯
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(sub.id)} className="text-rose-600 focus:text-rose-600 cursor-pointer">
                              <Trash2 className="w-4 h-4 mr-2" />
                              刪除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* 手機端卡片視圖 */}
          <div className="md:hidden space-y-4">
            {filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">目前沒有符合條件的訂閱資料</div>
            ) : filteredSubscriptions.map(sub => {
              const isCancelled = sub.status === 'cancelled';
              const nextBillingDate = new Date(sub.nextBillingDate);
              const daysUntilBilling = differenceInDays(nextBillingDate, new Date());
              const isUpcoming = !isCancelled && daysUntilBilling >= 0 && daysUntilBilling <= 7;
              const isOverdue = !isCancelled && daysUntilBilling < 0;

              return (
                <div 
                  key={sub.id} 
                  className={`p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm relative overflow-hidden transition-all active:scale-[0.98] ${isCancelled ? 'opacity-60 grayscale-[0.5]' : ''}`}
                  onClick={() => setEditingSub(sub)}
                >
                  {/* 狀態條 */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${isCancelled ? 'bg-zinc-300 dark:bg-zinc-700' : isOverdue ? 'bg-rose-500' : isUpcoming ? 'bg-amber-500' : 'bg-zinc-900 dark:bg-white'}`}></div>
                  
                  <div className="flex justify-between items-start mb-3 pl-2">
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white text-lg">{sub.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className={`text-[10px] px-2 py-0 rounded-full ${getCategoryColor(sub.category)}`}>
                          {sub.category}
                        </Badge>
                        <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                          {sub.cycle === 'monthly' ? '月繳' : '年繳'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="font-black text-xl text-zinc-900 dark:text-white">{sub.amount.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-zinc-500">{sub.currency}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        {format(nextBillingDate, 'yyyy-MM-dd')} 扣款
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pl-2 pt-2 border-t border-gray-50 dark:border-zinc-800/50">
                    <div className="flex items-center gap-2">
                      {isUpcoming && (
                        <span className="text-amber-600 text-[10px] font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> 剩 {daysUntilBilling} 天
                        </span>
                      )}
                      {isOverdue && (
                        <span className="text-rose-600 text-[10px] font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> 逾期 {Math.abs(daysUntilBilling)} 天
                        </span>
                      )}
                      {!isUpcoming && !isOverdue && !isCancelled && (
                        <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-1">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> 使用中
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full" onClick={(e) => {
                      e.stopPropagation();
                      onDelete(sub.id);
                    }}>
                      <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Controlled Editing Form */}
      <SubscriptionForm
        open={!!editingSub}
        onOpenChange={(open) => !open && setEditingSub(null)}
        initialData={editingSub || undefined}
        onEdit={handleEditCompleted}
        triggerButton={null}
        exchangeRate={exchangeRate}
      />
    </>
  );
};
