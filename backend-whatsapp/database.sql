-- ============================================================
-- VaultOS — Complete Database Schema (SQL)
-- Compatible with Supabase PostgreSQL
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ─────────────────────────────────────────────────────────────
-- TABLE: user_profiles
-- Auto-created by Supabase trigger on auth.users insert
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username        text,
  email           text        NOT NULL,
  full_name       text,
  whatsapp_number text,
  avatar_url      text,
  PRIMARY KEY (id)
);

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS full_name       text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS avatar_url      text;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "users_select_own_profile"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "users_update_own_profile"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "users_delete_own_profile"
  ON public.user_profiles FOR DELETE TO authenticated
  USING (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────
-- TABLE: categories
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid    NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name        text    NOT NULL,
  icon        text    NOT NULL DEFAULT 'label',
  color       text    NOT NULL DEFAULT '#6366f1',
  type        text    NOT NULL,           -- 'income' | 'expense' | 'both'
  is_default  boolean          DEFAULT false,
  created_at  timestamptz      DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_categories" ON public.categories FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_insert_own_categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_update_own_categories" ON public.categories FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_delete_own_categories" ON public.categories FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- TABLE: accounts
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.accounts (
  id             uuid           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid           NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name           text           NOT NULL,
  type           text           NOT NULL,
  bank_key       text           NOT NULL DEFAULT 'cash',
  balance        numeric(18,2)  NOT NULL DEFAULT 0,
  account_number text                    DEFAULT '-',
  color          text           NOT NULL DEFAULT '#6366f1',
  is_default     boolean                 DEFAULT false,
  is_hidden      boolean                 DEFAULT false,
  created_at     timestamptz             DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_accounts" ON public.accounts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_insert_own_accounts" ON public.accounts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_update_own_accounts" ON public.accounts FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_delete_own_accounts" ON public.accounts FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- TABLE: transactions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id            uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid          NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type          text          NOT NULL,             -- 'income' | 'expense' | 'transfer'
  amount        numeric(18,2) NOT NULL,
  description   text          NOT NULL,
  category_id   uuid          REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id    uuid          REFERENCES public.accounts(id) ON DELETE SET NULL,
  to_account_id uuid          REFERENCES public.accounts(id) ON DELETE SET NULL,
  date          timestamptz   NOT NULL DEFAULT now(),
  tags          text[]                 DEFAULT '{}',
  notes         text                   DEFAULT '',
  receipt_url   text,
  source        text          NOT NULL DEFAULT 'manual', -- 'manual' | 'ai' | 'whatsapp'
  created_at    timestamptz            DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_transactions" ON public.transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_insert_own_transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_update_own_transactions" ON public.transactions FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_delete_own_transactions" ON public.transactions FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- TABLE: budgets
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.budgets (
  id           uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid          NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  category_id  uuid          REFERENCES public.categories(id) ON DELETE SET NULL,
  name         text          NOT NULL,
  budget_limit numeric(18,2) NOT NULL,
  period       text          NOT NULL DEFAULT 'monthly',
  color        text          NOT NULL DEFAULT '#6366f1',
  icon         text          NOT NULL DEFAULT 'pie-chart',
  month_year   text          NOT NULL,              -- 'YYYY-MM'
  created_at   timestamptz            DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets(user_id);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_budgets" ON public.budgets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_insert_own_budgets" ON public.budgets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_update_own_budgets" ON public.budgets FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_delete_own_budgets" ON public.budgets FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- TABLE: events (jadwal / calendar)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title            text        NOT NULL,
  description      text                 DEFAULT '',
  date             timestamptz NOT NULL,
  start_time       text        NOT NULL DEFAULT '09:00',
  end_time         text        NOT NULL DEFAULT '10:00',
  color            text        NOT NULL DEFAULT '#6366f1',
  category         text        NOT NULL DEFAULT 'personal',
  reminder_minutes integer              DEFAULT 0,
  is_recurring     boolean              DEFAULT false,
  created_at       timestamptz          DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_user ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_events" ON public.events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_insert_own_events" ON public.events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_update_own_events" ON public.events FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_delete_own_events" ON public.events FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- TABLE: tasks
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  description text                 DEFAULT '',
  priority    text        NOT NULL DEFAULT 'medium',  -- 'low' | 'medium' | 'high'
  status      text        NOT NULL DEFAULT 'todo',    -- 'todo' | 'in_progress' | 'done'
  due_date    timestamptz,
  category    text                 DEFAULT 'personal',
  tags        text[]               DEFAULT '{}',
  created_at  timestamptz          DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks(user_id);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_tasks" ON public.tasks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_insert_own_tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_update_own_tasks" ON public.tasks FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_delete_own_tasks" ON public.tasks FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- TABLE: habits
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.habits (
  id             uuid    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid    NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name           text    NOT NULL,
  icon           text    NOT NULL DEFAULT 'loop',
  color          text    NOT NULL DEFAULT '#6366f1',
  frequency      text    NOT NULL DEFAULT 'daily',  -- 'daily' | 'weekly'
  target_count   integer          DEFAULT 1,
  streak         integer          DEFAULT 0,
  longest_streak integer          DEFAULT 0,
  created_at     timestamptz      DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits(user_id);
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_habits" ON public.habits FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_insert_own_habits" ON public.habits FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_update_own_habits" ON public.habits FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_delete_own_habits" ON public.habits FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- TABLE: habit_completions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id             uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id       uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  completed_date date NOT NULL,
  created_at     timestamptz   DEFAULT now(),
  UNIQUE (habit_id, completed_date)
);

CREATE INDEX IF NOT EXISTS idx_habit_completions_habit ON public.habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user  ON public.habit_completions(user_id);
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_completions" ON public.habit_completions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_insert_own_completions" ON public.habit_completions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_delete_own_completions" ON public.habit_completions FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- TABLE: goals (financial goals)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.goals (
  id                   uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              uuid          NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name                 text          NOT NULL,
  icon                 text          NOT NULL DEFAULT 'savings',
  color                text          NOT NULL DEFAULT '#22c55e',
  target_amount        numeric(18,2) NOT NULL,
  current_amount       numeric(18,2) NOT NULL DEFAULT 0,
  deadline             timestamptz,
  category             text                   DEFAULT 'savings',
  monthly_contribution numeric(18,2)          DEFAULT 0,
  created_at           timestamptz            DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_goals" ON public.goals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_insert_own_goals" ON public.goals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_update_own_goals" ON public.goals FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_delete_own_goals" ON public.goals FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- TABLE: notes
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notes (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  content    text                 DEFAULT '',
  color      text        NOT NULL DEFAULT '#6366f1',
  is_pinned  boolean              DEFAULT false,
  tags       text[]               DEFAULT '{}',
  created_at timestamptz          DEFAULT now(),
  updated_at timestamptz          DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes(user_id);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_notes" ON public.notes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_insert_own_notes" ON public.notes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_update_own_notes" ON public.notes FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_delete_own_notes" ON public.notes FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- TABLE: push_tokens
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  token      text        NOT NULL,
  platform   text                 DEFAULT 'mobile',
  created_at timestamptz          DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_push_tokens" ON public.push_tokens FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_insert_own_push_tokens" ON public.push_tokens FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_delete_own_push_tokens" ON public.push_tokens FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- TABLE: user_settings
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  id                       uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                  uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  dark_mode                boolean     NOT NULL DEFAULT true,
  notifications_enabled    boolean     NOT NULL DEFAULT true,
  habit_reminder_enabled   boolean     NOT NULL DEFAULT true,
  habit_reminder_time      text        NOT NULL DEFAULT '08:00',
  task_deadline_reminder   boolean     NOT NULL DEFAULT true,
  task_reminder_hours      integer     NOT NULL DEFAULT 24,
  event_reminder_enabled   boolean     NOT NULL DEFAULT true,
  whatsapp_bot_enabled     boolean     NOT NULL DEFAULT false,
  whatsapp_number          text,
  ai_insights_enabled      boolean     NOT NULL DEFAULT true,
  currency                 text        NOT NULL DEFAULT 'IDR',
  language                 text        NOT NULL DEFAULT 'id',
  created_at               timestamptz          DEFAULT now(),
  updated_at               timestamptz          DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON public.user_settings(user_id);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_settings" ON public.user_settings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_insert_own_settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_update_own_settings" ON public.user_settings FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_delete_own_settings" ON public.user_settings FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- TABLE: notifications (log notifikasi in-app)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  body       text        NOT NULL,
  type       text        NOT NULL DEFAULT 'info',  -- 'info' | 'warning' | 'success' | 'error'
  is_read    boolean     NOT NULL DEFAULT false,
  data       jsonb                DEFAULT '{}',
  created_at timestamptz          DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_insert_own_notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_update_own_notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_delete_own_notifications" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- TABLE: reminders
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reminders (
  id             uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  message        text,
  remind_at      timestamptz NOT NULL,
  repeat_type    text                 DEFAULT 'none',  -- 'none' | 'daily' | 'weekly' | 'monthly'
  is_sent        boolean     NOT NULL DEFAULT false,
  channel        text        NOT NULL DEFAULT 'push',  -- 'push' | 'whatsapp' | 'both'
  reference_id   uuid,
  reference_type text,                                 -- 'task' | 'event' | 'goal' | 'custom'
  created_at     timestamptz          DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON public.reminders(user_id, remind_at, is_sent);
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_reminders" ON public.reminders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_insert_own_reminders" ON public.reminders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_update_own_reminders" ON public.reminders FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_delete_own_reminders" ON public.reminders FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- TABLE: whatsapp_sessions (status koneksi Baileys)
-- Dikelola oleh backend-whatsapp, dibaca oleh Expo App
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id   text        NOT NULL UNIQUE DEFAULT 'default',
  status       text        NOT NULL DEFAULT 'disconnected',  -- 'connected' | 'disconnected' | 'connecting'
  phone_number text,
  connected_at timestamptz,
  last_seen    timestamptz,
  created_at   timestamptz          DEFAULT now(),
  updated_at   timestamptz          DEFAULT now()
);

ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read status (no personal data)
CREATE POLICY "auth_select_whatsapp_sessions" ON public.whatsapp_sessions
  FOR SELECT TO authenticated USING (true);


-- ─────────────────────────────────────────────────────────────
-- TABLE: whatsapp_messages (log pesan WhatsApp)
-- Diisi oleh backend-whatsapp menggunakan service role
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  direction    text        NOT NULL DEFAULT 'outbound',  -- 'inbound' | 'outbound'
  from_number  text,
  to_number    text,
  message      text        NOT NULL,
  message_type text        NOT NULL DEFAULT 'text',
  status       text        NOT NULL DEFAULT 'sent',      -- 'sent' | 'delivered' | 'read' | 'failed'
  metadata     jsonb                DEFAULT '{}',
  created_at   timestamptz          DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user ON public.whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_date ON public.whatsapp_messages(created_at);
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_messages" ON public.whatsapp_messages FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_insert_own_messages" ON public.whatsapp_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- FUNCTION: handle_new_user
-- Dipanggil oleh trigger saat user baru daftar
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, username, full_name, whatsapp_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp_number', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email      = EXCLUDED.email,
        full_name  = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name),
        whatsapp_number = COALESCE(EXCLUDED.whatsapp_number, public.user_profiles.whatsapp_number);
  RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- FUNCTION: sync_user_metadata
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_profiles
  SET
    email           = NEW.email,
    full_name       = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
    whatsapp_number = COALESCE(NEW.raw_user_meta_data->>'whatsapp_number', whatsapp_number)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_metadata();


-- ─────────────────────────────────────────────────────────────
-- SEED: whatsapp_sessions default row
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.whatsapp_sessions (session_id, status)
VALUES ('default', 'disconnected')
ON CONFLICT (session_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- END OF MIGRATION
-- ─────────────────────────────────────────────────────────────
-- Tabel yang tersedia setelah migration:
--   ✅ user_profiles         (auth + profile + whatsapp_number)
--   ✅ categories            (income/expense/both)
--   ✅ accounts              (bank, e-wallet, cash)
--   ✅ transactions          (income, expense, transfer + source)
--   ✅ budgets               (monthly budget per category)
--   ✅ events                (jadwal / calendar)
--   ✅ tasks                 (to-do dengan deadline)
--   ✅ habits                (habit tracker + streak)
--   ✅ habit_completions     (history centang habit)
--   ✅ goals                 (financial goals)
--   ✅ notes                 (catatan bebas)
--   ✅ push_tokens           (Expo push token)
--   ✅ user_settings         (preferensi user)
--   ✅ notifications         (log notifikasi in-app)
--   ✅ reminders             (reminder terjadwal)
--   ✅ whatsapp_sessions     (status koneksi bot)
--   ✅ whatsapp_messages     (log pesan WhatsApp)
-- ─────────────────────────────────────────────────────────────
