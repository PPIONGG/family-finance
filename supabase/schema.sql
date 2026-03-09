-- =============================================
-- Family Finance Manager - Supabase SQL Setup
-- รันใน SQL Editor ของ Supabase ทีเดียวจบ
-- =============================================

-- 1. สร้างตาราง profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. สร้างตาราง family_groups
CREATE TABLE IF NOT EXISTS family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. สร้างตาราง family_members
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(family_group_id, profile_id)
);

-- 4. สร้างตาราง categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#6366f1',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. สร้างตาราง installments (ต้องสร้างก่อน transactions เพราะ transactions อ้างอิง)
CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  principal_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  interest_type TEXT NOT NULL DEFAULT 'none' CHECK (interest_type IN ('flat', 'reducing', 'reducing_daily', 'none')),
  total_interest DECIMAL(12,2) NOT NULL DEFAULT 0,
  monthly_payment DECIMAL(12,2) NOT NULL,
  total_installments INTEGER NOT NULL,
  paid_installments INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'overdue', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. สร้างตาราง transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_type TEXT CHECK (recurring_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  installment_id UUID REFERENCES installments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. สร้างตาราง installment_payments
CREATE TABLE IF NOT EXISTS installment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id UUID NOT NULL REFERENCES installments(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount_due DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('pending', 'paid', 'overdue', 'upcoming')),
  paid_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. สร้างตาราง installment_splits
CREATE TABLE IF NOT EXISTS installment_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id UUID NOT NULL REFERENCES installments(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),
  split_type TEXT NOT NULL CHECK (split_type IN ('equal', 'percentage', 'fixed')),
  split_value DECIMAL(12,2),
  amount_per_month DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(installment_id, profile_id)
);

-- 9. สร้างตาราง debts
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  creditor_name TEXT NOT NULL,
  debtor_id UUID NOT NULL REFERENCES profiles(id),
  total_amount DECIMAL(12,2) NOT NULL,
  remaining_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  minimum_payment DECIMAL(12,2),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'defaulted')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Helper functions
CREATE OR REPLACE FUNCTION is_family_member(group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_group_id = group_id
    AND profile_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_family_admin(group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members fm
    JOIN profiles p ON p.id = fm.profile_id
    WHERE fm.family_group_id = group_id
    AND fm.profile_id = auth.uid()
    AND p.role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Members can view group profiles" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM family_members fm1
    JOIN family_members fm2 ON fm1.family_group_id = fm2.family_group_id
    WHERE fm1.profile_id = auth.uid() AND fm2.profile_id = profiles.id
  )
);

-- family_groups RLS
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their groups" ON family_groups FOR SELECT USING (is_family_member(id));
CREATE POLICY "Auth users can create groups" ON family_groups FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admin can update group" ON family_groups FOR UPDATE USING (is_family_admin(id));
CREATE POLICY "Admin can delete group" ON family_groups FOR DELETE USING (is_family_admin(id));

-- family_members RLS
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view group members" ON family_members FOR SELECT USING (is_family_member(family_group_id));
CREATE POLICY "Admin can add members" ON family_members FOR INSERT WITH CHECK (is_family_admin(family_group_id) OR profile_id = auth.uid());
CREATE POLICY "Admin can remove members" ON family_members FOR DELETE USING (is_family_admin(family_group_id));

-- categories RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view categories" ON categories FOR SELECT USING (is_family_member(family_group_id));
CREATE POLICY "Members can create categories" ON categories FOR INSERT WITH CHECK (is_family_member(family_group_id));
CREATE POLICY "Admin can update categories" ON categories FOR UPDATE USING (is_family_admin(family_group_id));
CREATE POLICY "Admin can delete categories" ON categories FOR DELETE USING (is_family_admin(family_group_id));

-- transactions RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view transactions" ON transactions FOR SELECT USING (is_family_member(family_group_id));
CREATE POLICY "Members can create transactions" ON transactions FOR INSERT WITH CHECK (is_family_member(family_group_id));
CREATE POLICY "Creator or admin can update" ON transactions FOR UPDATE USING (created_by = auth.uid() OR is_family_admin(family_group_id));
CREATE POLICY "Creator or admin can delete" ON transactions FOR DELETE USING (created_by = auth.uid() OR is_family_admin(family_group_id));

-- installments RLS
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view installments" ON installments FOR SELECT USING (is_family_member(family_group_id));
CREATE POLICY "Members can create installments" ON installments FOR INSERT WITH CHECK (is_family_member(family_group_id));
CREATE POLICY "Creator or admin can update installments" ON installments FOR UPDATE USING (created_by = auth.uid() OR is_family_admin(family_group_id));
CREATE POLICY "Creator or admin can delete installments" ON installments FOR DELETE USING (created_by = auth.uid() OR is_family_admin(family_group_id));

-- installment_payments RLS
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view payments" ON installment_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM installments i WHERE i.id = installment_id AND is_family_member(i.family_group_id))
);
CREATE POLICY "Members can create payments" ON installment_payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM installments i WHERE i.id = installment_id AND is_family_member(i.family_group_id))
);
CREATE POLICY "Members can update payments" ON installment_payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM installments i WHERE i.id = installment_id AND is_family_member(i.family_group_id))
);

-- installment_splits RLS
ALTER TABLE installment_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view splits" ON installment_splits FOR SELECT USING (
  EXISTS (SELECT 1 FROM installments i WHERE i.id = installment_id AND is_family_member(i.family_group_id))
);
CREATE POLICY "Members can create splits" ON installment_splits FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM installments i WHERE i.id = installment_id AND is_family_member(i.family_group_id))
);
CREATE POLICY "Members can update splits" ON installment_splits FOR UPDATE USING (
  EXISTS (SELECT 1 FROM installments i WHERE i.id = installment_id AND is_family_member(i.family_group_id))
);
CREATE POLICY "Members can delete splits" ON installment_splits FOR DELETE USING (
  EXISTS (SELECT 1 FROM installments i WHERE i.id = installment_id AND is_family_member(i.family_group_id))
);

-- debts RLS
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view debts" ON debts FOR SELECT USING (is_family_member(family_group_id));
CREATE POLICY "Members can create debts" ON debts FOR INSERT WITH CHECK (is_family_member(family_group_id));
CREATE POLICY "Creator or admin can update debts" ON debts FOR UPDATE USING (created_by = auth.uid() OR is_family_admin(family_group_id));
CREATE POLICY "Creator or admin can delete debts" ON debts FOR DELETE USING (created_by = auth.uid() OR is_family_admin(family_group_id));

-- =============================================
-- Auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
