CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  billing_cycle TEXT NOT NULL, -- 'monthly' | 'yearly'
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL, -- 'TWD' | 'USD'
  start_date DATE NOT NULL,
  next_billing_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own subscriptions"
  ON subscriptions
  FOR ALL
  USING (auth.uid() = user_id);

-- user_settings 表格
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange_rates JSONB NOT NULL DEFAULT '{"USD": 32.5, "JPY": 0.215, "EUR": 35.2, "TWD": 1}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own settings"
  ON user_settings
  FOR ALL
  USING (auth.uid() = user_id);

-- RPC for calculating total monthly TWD
CREATE OR REPLACE FUNCTION get_monthly_total_twd(target_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total NUMERIC := 0;
  sub RECORD;
  rates JSONB;
  rate NUMERIC;
  twd_amount NUMERIC;
BEGIN
  -- 取得使用者的匯率設定
  SELECT exchange_rates INTO rates FROM user_settings WHERE user_id = target_user_id;

  -- 預設匯率防呆
  IF rates IS NULL THEN
    rates := '{"USD": 32.5, "JPY": 0.215, "EUR": 35.2, "TWD": 1}'::jsonb;
  END IF;

  -- 迴圈計算有效的訂閱
  FOR sub IN 
    SELECT amount, currency, billing_cycle 
    FROM subscriptions 
    WHERE user_id = target_user_id AND status = 'active'
  LOOP
    -- 取得對應幣別匯率
    rate := COALESCE((rates->>sub.currency::text)::NUMERIC, 1);
    
    -- 換算成 TWD
    twd_amount := sub.amount * rate;
    
    -- 若為年繳，平攤至每月
    IF sub.billing_cycle = 'yearly' THEN
      twd_amount := twd_amount / 12;
    END IF;

    total := total + twd_amount;
  END LOOP;

  RETURN total;
END;
$$;
