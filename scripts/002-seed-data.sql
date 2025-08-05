-- Inserir usuários de exemplo
INSERT INTO users (email, student_id, name, course, phone, user_type) VALUES
('admin@universidade.edu.br', NULL, 'Administrador Segurança', NULL, '(11) 99999-9999', 'admin'),
('seguranca@universidade.edu.br', NULL, 'Equipe de Segurança', NULL, '(11) 88888-8888', 'admin'),
('joao.silva@estudante.edu.br', '2024001234', 'João Silva Santos', 'Engenharia de Software', '(11) 77777-7777', 'student'),
('maria.oliveira@estudante.edu.br', '2024001235', 'Maria Oliveira Costa', 'Administração', '(11) 66666-6666', 'student'),
('pedro.santos@estudante.edu.br', '2024001236', 'Pedro Santos Lima', 'Direito', '(11) 55555-5555', 'student'),
('ana.costa@estudante.edu.br', '2024001237', 'Ana Costa Ferreira', 'Medicina', '(11) 44444-4444', 'student'),
('carlos.lima@estudante.edu.br', '2024001238', 'Carlos Lima Souza', 'Psicologia', '(11) 33333-3333', 'student')
ON CONFLICT (email) DO NOTHING;

-- Inserir alguns alertas de exemplo para demonstração
INSERT INTO alerts (user_id, student_id, student_name, course, latitude, longitude, status, created_at) VALUES
(3, '2024001234', 'João Silva Santos', 'Engenharia de Software', -23.550520, -46.633308, 'resolved', NOW() - INTERVAL '2 hours'),
(4, '2024001235', 'Maria Oliveira Costa', 'Administração', -23.551000, -46.634000, 'false_alarm', NOW() - INTERVAL '1 day'),
(5, '2024001236', 'Pedro Santos Lima', 'Direito', -23.549800, -46.632500, 'resolved', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;
