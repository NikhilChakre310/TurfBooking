-- 002_seed_data.sql
-- Database Migration: Populate Seed Records for Arena Sports Turf

-- 1. Seed Branches
INSERT INTO branches (id, name, address, phone, email) VALUES
('b1000000-0000-0000-0000-000000000000', 'Arena Sports Turf - HSR Layout', '123 Main Road, HSR Sector 3, Bangalore', '+91 98765 43210', 'hsr@arenasports.com')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed System Roles
INSERT INTO roles (id, name) VALUES
('01000000-0000-0000-0000-000000000001', 'super_admin'),
('01000000-0000-0000-0000-000000000002', 'branch_manager'),
('01000000-0000-0000-0000-000000000003', 'customer'),
('01000000-0000-0000-0000-000000000004', 'guest')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Physical Courts
INSERT INTO courts (id, branch_id, name) VALUES
('c1000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000', 'Main Multi-Turf A'), -- Shared between football and cricket
('c2000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000', 'Pickleball Court Alpha')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Sports
INSERT INTO sports (id, name, min_players, max_players) VALUES
('02000000-0000-0000-0000-000000000001', 'football', 10, 14),
('02000000-0000-0000-0000-000000000002', 'cricket', 12, 16),
('02000000-0000-0000-0000-000000000003', 'pickleball', 2, 4)
ON CONFLICT (id) DO NOTHING;

-- 5. Map Sports to Court Allocations (Shared Turf Logic)
-- Main Multi-Turf A supports both Football and Cricket
INSERT INTO court_sports (court_id, sport_id) VALUES
('c1000000-0000-0000-0000-000000000000', '02000000-0000-0000-0000-000000000001'), -- Football on Turf A
('c1000000-0000-0000-0000-000000000000', '02000000-0000-0000-0000-000000000002'), -- Cricket on Turf A
('c2000000-0000-0000-0000-000000000000', '02000000-0000-0000-0000-000000000003')  -- Pickleball on Court Alpha Only
ON CONFLICT (court_id, sport_id) DO NOTHING;

-- 6. Seed Operating Time Slots for Turf A (Example: Evening slots)
INSERT INTO time_slots (id, court_id, start_time, end_time, is_peak) VALUES
('03000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000000', '17:00:00', '18:00:00', FALSE),
('03000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000000', '18:00:00', '19:00:00', TRUE),
('03000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000000', '19:00:00', '20:00:00', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Operating Time Slots for Pickleball Court Alpha
INSERT INTO time_slots (id, court_id, start_time, end_time, is_peak) VALUES
('04000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000000', '17:00:00', '18:00:00', FALSE),
('04000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000000', '18:00:00', '19:00:00', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 8. Seed Dynamic Pricing Rules
INSERT INTO pricing_rules (court_id, sport_id, day_type, pricing_category, price) VALUES
-- Pricing for Football on Turf A
('c1000000-0000-0000-0000-000000000000', '02000000-0000-0000-0000-000000000001', 'weekday', 'base', 800.00),
('c1000000-0000-0000-0000-000000000000', '02000000-0000-0000-0000-000000000001', 'weekday', 'peak', 1000.00),
('c1000000-0000-0000-0000-000000000000', '02000000-0000-0000-0000-000000000001', 'weekend', 'base', 1000.00),
('c1000000-0000-0000-0000-000000000000', '02000000-0000-0000-0000-000000000001', 'weekend', 'peak', 1200.00),
-- Pricing for Cricket on Turf A
('c1000000-0000-0000-0000-000000000000', '02000000-0000-0000-0000-000000000002', 'weekday', 'base', 900.00),
('c1000000-0000-0000-0000-000000000000', '02000000-0000-0000-0000-000000000002', 'weekday', 'peak', 1100.00),
-- Pricing for Pickleball on Court Alpha
('c2000000-0000-0000-0000-000000000000', '02000000-0000-0000-0000-000000000003', 'weekday', 'base', 400.00),
('c2000000-0000-0000-0000-000000000000', '02000000-0000-0000-0000-000000000003', 'weekday', 'peak', 500.00)
ON CONFLICT DO NOTHING;

-- 9. Seed Dynamic Operational Settings
INSERT INTO settings (branch_id, key, value, value_type) VALUES
('b1000000-0000-0000-0000-000000000000', 'cancellation_hours_limit', '6', 'number'),
('b1000000-0000-0000-0000-000000000000', 'default_refund_percentage', '100', 'number'),
('b1000000-0000-0000-0000-000000000000', 'loyalty_accrual_ratio', '0.10', 'number')
ON CONFLICT (branch_id, key) DO UPDATE SET value = EXCLUDED.value;

