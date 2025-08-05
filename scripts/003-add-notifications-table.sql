-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER REFERENCES alerts(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('admin', 'student', 'all')),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed'))
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_notifications_alert_id ON notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON notifications(recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);

-- Adicionar trigger para criar notificação automática quando um novo alerta é criado
CREATE OR REPLACE FUNCTION create_alert_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (alert_id, message, recipient_type)
    VALUES (
        NEW.id,
        'Novo alerta de emergência de ' || NEW.student_name,
        'admin'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alert_notification_trigger
    AFTER INSERT ON alerts
    FOR EACH ROW
    EXECUTE FUNCTION create_alert_notification();
