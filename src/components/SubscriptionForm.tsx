import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Subscription, EXCHANGE_RATES } from '@/lib/types';
import { toast } from 'sonner';

import { addMonths, addYears } from 'date-fns';

const subscriptionSchema = z.object({
  name: z.string().min(1, '請輸入訂閱名稱'),
  category: z.string().min(1, '請輸入類別'),
  cycle: z.enum(['monthly', 'yearly']),
  amount: z.preprocess((val) => Number(val), z.number().min(0, '金額必須大於 0')),
  currency: z.enum(['TWD', 'USD']),
  startDate: z.string().min(1, '請選擇訂購日'),
  nextBillingDate: z.string().min(1, '此為自動計算'),
  status: z.enum(['active', 'cancelled']),
  notes: z.string().optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

interface Props {
  onAdd?: (sub: Omit<Subscription, 'id' | 'status'>) => void;
  onEdit?: (sub: Subscription) => void;
  initialData?: Subscription;
  triggerButton?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  exchangeRate?: number;
}

export const SubscriptionForm: React.FC<Props> = ({ 
  onAdd, onEdit, initialData, triggerButton, open: controlledOpen, onOpenChange, exchangeRate = 32.5
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled && onOpenChange ? onOpenChange : setInternalOpen;
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: '',
      cycle: 'monthly',
      currency: 'TWD',
      category: '日常生活',
      amount: 0,
      startDate: '',
      nextBillingDate: '',
      status: 'active',
      notes: ''
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          cycle: initialData.cycle,
          currency: initialData.currency,
          category: initialData.category || '日常生活',
          amount: initialData.amount,
          startDate: initialData.startDate || '',
          nextBillingDate: initialData.nextBillingDate,
          status: initialData.status || 'active',
          notes: initialData.notes || ''
        });
      } else {
        reset({
          name: '',
          cycle: 'monthly',
          currency: 'TWD',
          category: '日常生活',
          amount: 0,
          startDate: '',
          nextBillingDate: '',
          status: 'active',
          notes: ''
        });
      }
    }
  }, [open, initialData, reset]);

  const amount = watch('amount');
  const currency = watch('currency') as 'TWD' | 'USD';
  const cycle = watch('cycle');
  const startDate = watch('startDate');

  useEffect(() => {
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) return;
      
      const today = new Date();
      // Reset hours to start of day for accurate comparison
      today.setHours(0, 0, 0, 0);
      
      if (cycle === 'monthly') {
        let monthDiff = (today.getFullYear() - start.getFullYear()) * 12 + today.getMonth() - start.getMonth();
        if (monthDiff < 0) monthDiff = 0;
        let testDate = addMonths(start, monthDiff);
        if (testDate < today) {
          testDate = addMonths(start, monthDiff + 1);
        }
        setValue('nextBillingDate', testDate.toISOString().split('T')[0]);
      } else if (cycle === 'yearly') {
        let yearDiff = today.getFullYear() - start.getFullYear();
        if (yearDiff < 0) yearDiff = 0;
        let testDate = addYears(start, yearDiff);
        if (testDate < today) {
          testDate = addYears(start, yearDiff + 1);
        }
        setValue('nextBillingDate', testDate.toISOString().split('T')[0]);
      }
    }
  }, [startDate, cycle, setValue]);

  const convertedAmount = React.useMemo(() => {
    if (!amount || !currency) return 0;
    const rate = currency === 'USD' ? exchangeRate : 1;
    return Math.round(Number(amount) * rate);
  }, [amount, currency, exchangeRate]);

  const onSubmit = (data: any) => {
    if (initialData && onEdit) {
      onEdit({ ...initialData, ...data });
    } else if (onAdd) {
      onAdd(data as SubscriptionFormValues);
    }
    setOpen(false);
  };


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {triggerButton ? (
        <SheetTrigger render={triggerButton as React.ReactElement} />
      ) : !isControlled ? (
        <SheetTrigger render={
          <Button className="md:w-auto w-full group">
            <Plus className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" />
            新增訂閱
          </Button>
        } />
      ) : null}
      
      <SheetContent className="overflow-y-auto px-4 sm:px-6 max-h-screen">
        <SheetHeader className="mt-4 sm:mt-0">
          <SheetTitle>{initialData ? '編輯訂閱' : '新增數位訂閱'}</SheetTitle>
          <SheetDescription>
            {initialData ? '修改您的數位訂閱資訊。' : '填寫以下資訊來追蹤您的數位工具訂閱支出。'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6 pb-8">
          <div className="space-y-2">
            <Label htmlFor="name">名稱</Label>
            <Input id="name" placeholder="例如：Netflix" {...register('name')} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message?.toString()}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">類別</Label>
            <Input id="category" placeholder="輸入類別 (例如：日常生活)" {...register('category')} />
            {errors.category && <p className="text-sm text-red-500">{errors.category.message?.toString()}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">金額</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount')}
              />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount.message?.toString()}</p>}
            </div>

            <div className="space-y-2">
              <Label>幣別</Label>
              <Select onValueChange={(val: any) => setValue('currency', val)} value={currency}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇幣別" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TWD">TWD (台幣)</SelectItem>
                  <SelectItem value="USD">USD (美金)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {currency !== 'TWD' && Number(amount) > 0 && (
            <p className="text-sm text-gray-500">
              約合 NT$ {convertedAmount.toLocaleString()}
            </p>
          )}

          <div className="space-y-2">
            <Label>週期</Label>
            <Select onValueChange={(val: any) => setValue('cycle', val)} value={watch('cycle')} defaultValue={watch('cycle')}>
              <SelectTrigger>
                <SelectValue placeholder="選擇週期" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">月繳</SelectItem>
                <SelectItem value="yearly">年繳</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">訂購日</Label>
            <Input id="startDate" type="date" {...register('startDate')} />
            {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message?.toString()}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextBillingDate">下次扣款日</Label>
            <Input id="nextBillingDate" type="date" readOnly className="bg-gray-50 text-gray-500" {...register('nextBillingDate')} />
            {errors.nextBillingDate && <p className="text-sm text-red-500">{errors.nextBillingDate.message?.toString()}</p>}
          </div>

          <div className="space-y-2">
            <Label>狀態</Label>
            <Select onValueChange={(val: any) => setValue('status', val)} value={watch('status')} defaultValue={watch('status')}>
              <SelectTrigger>
                <SelectValue placeholder="選擇狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">使用中</SelectItem>
                <SelectItem value="cancelled">已退訂</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">備註</Label>
            <Input id="notes" placeholder="例如：綁定某信用卡" {...register('notes')} />
          </div>

          <Button type="submit" className="w-full">
            儲存訂閱
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};
