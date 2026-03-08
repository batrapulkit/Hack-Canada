-- Create system_settings table for global configurations
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES users(id)
);

-- RLS Policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only super_admins can view and modify system settings
CREATE POLICY "Super admins can view system settings" 
    ON system_settings FOR SELECT 
    USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can insert system settings" 
    ON system_settings FOR INSERT 
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM users WHERE role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update system settings" 
    ON system_settings FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role = 'super_admin'
        )
    );

-- Add initial SMTP config placeholder (optional, but good for structure)
INSERT INTO system_settings (key, value, description)
VALUES 
    ('smtp_config', '{"host": "", "port": "465", "user": "", "pass": "", "fromName": "Triponic B2B"}', 'Global SMTP configuration for mass emails')
ON CONFLICT (key) DO NOTHING;
