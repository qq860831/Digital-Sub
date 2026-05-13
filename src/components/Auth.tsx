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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md shadow-lg border-gray-100 dark:border-gray-800">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
             <div className="p-3 bg-zinc-900 dark:bg-white rounded-xl">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-zinc-900"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
             </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSignUp ? '建立新帳號' : '歡迎回來'}
          </CardTitle>
          <CardDescription>
            {isSignUp ? '開始管理您的數位訂閱支出' : '登入以存取您的訂閱庫'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">電子郵件</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? '處理中...' : (isSignUp ? '註冊' : '登入')}
            </Button>
            <div className="text-sm text-center text-gray-500">
              {isSignUp ? '已經有帳號了？' : '還沒有帳號？'}{' '}
              <button 
                type="button"
                className="text-zinc-900 dark:text-white font-medium hover:underline"
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
