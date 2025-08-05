-- Inserir usuários de teste com auth_id (isso deve ser feito após criar os usuários no Supabase Auth)
-- Por enquanto, vamos atualizar os usuários existentes

-- Atualizar usuários existentes para incluir senhas hash (simulado)
UPDATE public.users SET 
  email = 'admin@universidade.edu.br'
WHERE name = 'Administrador Segurança';

UPDATE public.users SET 
  email = 'seguranca@universidade.edu.br'
WHERE name = 'Equipe de Segurança';

-- Adicionar índice para auth_id
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
