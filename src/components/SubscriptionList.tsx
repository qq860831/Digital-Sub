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
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>名稱</TableHead>
                  <TableHead>類別</TableHead>
                  <TableHead>費用</TableHead>
                  <TableHead>週期</TableHead>
                  <TableHead>訂購日</TableHead>
                  <TableHead>下次扣款</TableHead>
                  <TableHead>備註</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={9} className="text-center py-8 text-gray-400">目前沒有符合條件的訂閱資料</TableCell>
                   </TableRow>
                ) : filteredSubscriptions.map(sub => {
                  const isCancelled = sub.status === 'cancelled';
                  const nextBillingDate = new Date(sub.nextBillingDate);
                  const daysUntilBilling = differenceInDays(nextBillingDate, new Date());
                  
                  const isUpcoming = !isCancelled && daysUntilBilling >= 0 && daysUntilBilling <= 7;
                  const isOverdue = !isCancelled && daysUntilBilling < 0;

                  return (
                    <TableRow key={sub.id} className={isCancelled ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">
                        {sub.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-normal text-xs ${getCategoryColor(sub.category)}`}>{sub.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono">{sub.amount}</span>
                          <span className="text-xs text-zinc-500">{sub.currency}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-zinc-600 capitalize">
                          {sub.cycle === 'monthly' ? '月繳' : '年繳'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {sub.startDate || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {format(nextBillingDate, 'yyyy-MM-dd')}
                          </span>
                          {isUpcoming && (
                            <div className="flex items-center text-amber-700 text-xs font-medium gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shadow-sm dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                              <AlertCircle className="w-3 h-3" />
                              剩 {daysUntilBilling} 天
                            </div>
                          )}
                          {isOverdue && (
                            <div className="flex items-center text-red-700 text-xs font-medium gap-1 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full shadow-sm dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
                              <AlertCircle className="w-3 h-3" />
                              逾期 {Math.abs(daysUntilBilling)} 天
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-zinc-500 max-w-[150px] truncate block" title={sub.notes}>
                          {sub.notes || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {sub.status === 'active' ? (
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 font-normal border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/20 shadow-sm">使用中</Badge>
                        ) : (
                          <Badge variant="secondary" className="font-normal border border-zinc-200 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">已退訂</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">選單</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingSub(sub)} className="cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" />
                              編輯
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(sub.id)} className="text-red-600 focus:text-red-600 cursor-pointer">
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
