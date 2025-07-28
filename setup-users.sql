-- Setup script for initial users
-- Run this in your Neon SQL Editor

-- First, make sure the department column exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'operations';

-- Insert the initial users with proper password hashes
-- Note: These are bcrypt hashes for the passwords you specified

INSERT INTO users (email, password_hash, role, department) VALUES 
(
  'mark_barican@example.com',
  '$2b$10$pt.C3N.tPJccF45AY9zPLucQ/cIagt2iBv5JThrvEXBX0ayx68/xy', -- hash for 'markpogi123'
  'admin',
  'operations'
) ON CONFLICT (email) DO UPDATE SET 
  role = EXCLUDED.role,
  department = EXCLUDED.department;

INSERT INTO users (email, password_hash, role, department) VALUES 
(
  'manager_demo@example.com',
  '$2b$10$vGHQjNd0O0V2P2XL67WGxuaVNDn9of9JFtqZRPx9jQceom5ulwIWW', -- hash for 'manager123'
  'manager',
  'operations'
) ON CONFLICT (email) DO UPDATE SET 
  role = EXCLUDED.role,
  department = EXCLUDED.department;

INSERT INTO users (email, password_hash, role, department) VALUES 
(
  'staff_demo@example.com',
  '$2b$10$Z5FQlCvEpED2FSuM7teaJ.fzX4alyHnW3h7CoRLvLg4PZtD2Mdt7y', -- hash for 'staff123'
  'staff',
  'operations'
) ON CONFLICT (email) DO UPDATE SET 
  role = EXCLUDED.role,
  department = EXCLUDED.department; 