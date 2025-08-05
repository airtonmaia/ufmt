-- Habilitar Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    student_id VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    course VARCHAR(255),
    phone VARCHAR(20),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar tabela de alertas
CREATE TABLE IF NOT EXISTS public.alerts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    course VARCHAR(255),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_alarm', 'in_progress')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by BIGINT REFERENCES public.users(id)
);

-- Criar tabela de atualizações de localização
CREATE TABLE IF NOT EXISTS public.location_updates (
    id BIGSERIAL PRIMARY KEY,
    alert_id BIGINT REFERENCES public.alerts(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    alert_id BIGINT REFERENCES public.alerts(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('admin', 'student', 'all')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed'))
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_alert_id ON public.location_updates(alert_id);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON public.users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_notifications_alert_id ON public.notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON public.notifications(recipient_type);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (true); -- Por enquanto, permitir acesso total para demonstração

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (true);

-- Políticas RLS para alertas
CREATE POLICY "Anyone can view alerts" ON public.alerts
    FOR SELECT USING (true);

CREATE POLICY "Students can create alerts" ON public.alerts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update alerts" ON public.alerts
    FOR UPDATE USING (true);

-- Políticas RLS para location_updates
CREATE POLICY "Anyone can view location updates" ON public.location_updates
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert location updates" ON public.location_updates
    FOR INSERT WITH CHECK (true);

-- Políticas RLS para notificações
CREATE POLICY "Anyone can view notifications" ON public.notifications
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.alerts
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Função para criar notificação automática quando um novo alerta é criado
CREATE OR REPLACE FUNCTION public.create_alert_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (alert_id, message, recipient_type)
    VALUES (
        NEW.id,
        'Novo alerta de emergência de ' || NEW.student_name,
        'admin'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar notificação automática
CREATE TRIGGER alert_notification_trigger
    AFTER INSERT ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.create_alert_notification();
