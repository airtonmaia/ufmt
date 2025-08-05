-- Remover coluna auth_id que estava causando problemas
ALTER TABLE public.users DROP COLUMN IF EXISTS auth_id;

-- Garantir que a tabela users tenha a estrutura correta
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Verificar se os dados de teste existem
INSERT INTO public.users (email, student_id, name, course, phone, user_type) VALUES
('admin@universidade.edu.br', NULL, 'Administrador Segurança', NULL, '(11) 99999-9999', 'admin'),
('seguranca@universidade.edu.br', NULL, 'Equipe de Segurança', NULL, '(11) 88888-8888', 'admin'),
('joao.silva@estudante.edu.br', '2024001234', 'João Silva Santos', 'Engenharia de Software', '(11) 77777-7777', 'student'),
('maria.oliveira@estudante.edu.br', '2024001235', 'Maria Oliveira Costa', 'Administração', '(11) 66666-6666', 'student'),
('pedro.santos@estudante.edu.br', '2024001236', 'Airton Maia', 'Direito', '(11) 55555-5555', 'student'),
('ana.costa@estudante.edu.br', '2024001237', 'Ana Costa Ferreira', 'Medicina', '(11) 44444-4444', 'student'),
('carlos.lima@estudante.edu.br', '2024001238', 'Carlos Lima Souza', 'Psicologia', '(11) 33333-3333', 'student')
ON CONFLICT (email) DO NOTHING;

-- Atualizar políticas RLS para serem mais permissivas durante desenvolvimento
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (true); -- Permitir acesso total para demonstração

DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (true);

-- Políticas para alertas
DROP POLICY IF EXISTS "Students can create alerts" ON public.alerts;
CREATE POLICY "Students can create alerts" ON public.alerts
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update alerts" ON public.alerts;
CREATE POLICY "Admins can update alerts" ON public.alerts
    FOR UPDATE USING (true);

-- Remover triggers que podem estar causando problemas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
