import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('註冊成功！請檢查您的電子郵件以進行驗證。');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('登入成功');
      }
    } catch (error: any) {
      toast.error(error.message || '發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.05),transparent)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)] pointer-events-none"></div>
      <Card className="w-full max-w-md shadow-2xl shadow-zinc-200/50 dark:shadow-none border-none bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-zinc-900 via-zinc-400 to-zinc-900 dark:from-white dark:via-zinc-500 dark:to-white"></div>
        <CardHeader className="space-y-4 text-center pt-10 pb-6">
          <div className="flex justify-center">
             <div className="p-4 bg-zinc-900 dark:bg-white rounded-[1.5rem] shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-zinc-900"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
             </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white">
              {isSignUp ? '建立新帳號' : '歡迎回來'}
            </CardTitle>
            <CardDescription className="text-sm font-medium opacity-60">
              {isSignUp ? '開始管理您的數位訂閱支出' : '登入以存取您的訂閱庫'}
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-6 px-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">電子郵件</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="rounded-2xl border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 h-12 px-4 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">密碼</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="rounded-2xl border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 h-12 px-4 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-6 px-8 pb-10 pt-4">
            <Button className="w-full h-12 rounded-2xl font-bold text-base shadow-lg shadow-zinc-900/10 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all" type="submit" disabled={loading}>
              {loading ? '處理中...' : (isSignUp ? '立即註冊' : '登入帳號')}
            </Button>
            <div className="text-sm text-center font-medium">
              <span className="opacity-40">{isSignUp ? '已經有帳號了？' : '還沒有帳號？'}</span>{' '}
              <button 
                type="button"
                className="text-zinc-900 dark:text-white font-bold hover:underline"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? '點此登入' : '點此註冊'}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
