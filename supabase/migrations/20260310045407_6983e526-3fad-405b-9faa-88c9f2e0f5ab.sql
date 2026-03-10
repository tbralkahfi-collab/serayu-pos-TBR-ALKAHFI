
-- Fix ALL RLS policies: drop RESTRICTIVE and recreate as PERMISSIVE

-- ============ TRANSACTIONS ============
DROP POLICY IF EXISTS "Approved users can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

CREATE POLICY "Approved users can view all transactions" ON public.transactions FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ PURCHASES ============
DROP POLICY IF EXISTS "Approved users can view all purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can update own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can delete own purchases" ON public.purchases;

CREATE POLICY "Approved users can view all purchases" ON public.purchases FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));
CREATE POLICY "Users can insert own purchases" ON public.purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own purchases" ON public.purchases FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own purchases" ON public.purchases FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ PRODUCTS ============
DROP POLICY IF EXISTS "Approved users can view all products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;

CREATE POLICY "Approved users can view all products" ON public.products FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));
CREATE POLICY "Users can insert own products" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON public.products FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON public.products FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ EXPENSES ============
DROP POLICY IF EXISTS "Approved users can view all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

CREATE POLICY "Approved users can view all expenses" ON public.expenses FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ DEBTS ============
DROP POLICY IF EXISTS "Approved users can view all debts" ON public.debts;
DROP POLICY IF EXISTS "Users can insert own debts" ON public.debts;
DROP POLICY IF EXISTS "Users can update own debts" ON public.debts;
DROP POLICY IF EXISTS "Users can delete own debts" ON public.debts;

CREATE POLICY "Approved users can view all debts" ON public.debts FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));
CREATE POLICY "Users can insert own debts" ON public.debts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own debts" ON public.debts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own debts" ON public.debts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ PROJECTS ============
DROP POLICY IF EXISTS "Approved users can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

CREATE POLICY "Approved users can view all projects" ON public.projects FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ CAPITAL ============
DROP POLICY IF EXISTS "Approved users can view all capital" ON public.capital;
DROP POLICY IF EXISTS "Users can insert own capital" ON public.capital;
DROP POLICY IF EXISTS "Users can update own capital" ON public.capital;
DROP POLICY IF EXISTS "Users can delete own capital" ON public.capital;

CREATE POLICY "Approved users can view all capital" ON public.capital FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));
CREATE POLICY "Users can insert own capital" ON public.capital FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own capital" ON public.capital FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own capital" ON public.capital FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ SUPPLIERS ============
DROP POLICY IF EXISTS "Approved users can view all suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can insert own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete own suppliers" ON public.suppliers;

CREATE POLICY "Approved users can view all suppliers" ON public.suppliers FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));
CREATE POLICY "Users can insert own suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own suppliers" ON public.suppliers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ USER_ROLES ============
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admin can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
