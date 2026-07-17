const { Client } = require('pg');

const connectionString = 'postgresql://postgres.nhqrrywklthhosfvsppv:Guigui151293!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres';

const schemaSql = `
-- Habilitar a extensão pgcrypto para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- TABELAS PRINCIPAIS
-- ==========================================

-- 1. Tabela: Homes (Residências)
CREATE TABLE IF NOT EXISTS public.homes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela: Profiles (Perfil do usuário complementar à Auth do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Referência direta a auth.users.id
    home_id UUID REFERENCES public.homes(id) ON DELETE SET NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'member', -- Ex: admin, member
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- MÓDULOS DE TAREFAS E ROTINAS
-- ==========================================

-- 3. Tabela: Tasks (Tarefas do dia e rotinas)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high
    due_date DATE,
    time TIME,
    recurrence_rule VARCHAR(255), -- Ex: 'every_sunday'
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- MÓDULOS DE COMPRAS E ESTOQUE
-- ==========================================

-- 4. Tabela: Shopping Lists (Múltiplas listas de compras)
CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- Mercado, Farmácia, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela: Shopping Items (Itens dentro de cada lista)
CREATE TABLE IF NOT EXISTS public.shopping_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    category VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'normal',
    is_purchased BOOLEAN DEFAULT FALSE,
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela: Purchases (Registro de Compras efetuadas)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payment_method VARCHAR(100),
    installments INTEGER DEFAULT 1,
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela: Purchase Items (Itens detalhados de uma compra - via OCR)
CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    category VARCHAR(100)
);

-- 8. Tabela: Inventory (Controle do Estoque da Casa)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(50), -- pacote, litro, kg
    minimum_threshold DECIMAL(10,2) DEFAULT 1,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- MÓDULOS DE CONTROLE FINANCEIRO
-- ==========================================

-- 9. Tabela: Financial Transactions (Contas Fixas, Variáveis e Despesas)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- fixed, variable
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE,
    payer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid
    category VARCHAR(100),
    payment_method VARCHAR(100),
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Tabela: Budgets (Orçamentos Mensais - Teto de Gastos)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    category VARCHAR(100) NOT NULL,
    planned_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    UNIQUE(home_id, month, year, category)
);

-- ==========================================
-- MÓDULO DE INTELIGÊNCIA ARTIFICIAL
-- ==========================================

-- 11. Tabela: AI Memory (Armazena histórico de contexto para o GPT)
CREATE TABLE IF NOT EXISTS public.ai_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE,
    context_type VARCHAR(100) NOT NULL,
    context_data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

async function applySchema() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting to Supabase PostgreSQL...");
    await client.connect();
    
    console.log("Executing schema SQL...");
    await client.query(schemaSql);
    
    console.log("Schema applied successfully!");
  } catch (err) {
    console.error("Error applying schema:", err);
  } finally {
    await client.end();
  }
}

applySchema();
