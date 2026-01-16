-- ISP billing System - Complete Database Schema
-- MySQL 8.0+

-- =====================================================
-- 1. USERS & AUTHENTICATION
-- =====================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'staff', 'accountant') DEFAULT 'staff',
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. ZONES / AREAS MANAGEMENT
-- =====================================================

CREATE TABLE zones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. CUSTOMERS
-- =====================================================

CREATE TABLE customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50) UNIQUE NOT NULL, -- Custom ID like ISP-0001
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(15) NOT NULL,
    alternative_phone VARCHAR(15),
    nid VARCHAR(20),
    address TEXT,
    zone_id BIGINT UNSIGNED,
    billing_type ENUM('residential', 'business', 'vip') DEFAULT 'residential',
    connection_type ENUM('pppoe', 'static_ip', 'hotspot') DEFAULT 'pppoe',
    mac_address VARCHAR(17), -- For MAC binding
    static_ip VARCHAR(15), -- For business customers
    status ENUM('active', 'suspended', 'inactive', 'closed') DEFAULT 'active',
    created_by BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_customer_id (customer_id),
    INDEX idx_phone (phone),
    INDEX idx_zone (zone_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. INTERNET PACKAGES
-- =====================================================

CREATE TABLE packages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bandwidth_download VARCHAR(20) NOT NULL, -- e.g., "10 Mbps"
    bandwidth_upload VARCHAR(20) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    validity_days INT DEFAULT 30, -- Usually 30 for monthly
    description TEXT,
    mikrotik_queue_name VARCHAR(100), -- MikroTik profile name
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. SUBSCRIPTIONS
-- =====================================================

CREATE TABLE subscriptions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    package_id BIGINT UNSIGNED NOT NULL,
    start_date DATE NOT NULL,
    billing_day INT NOT NULL, -- Day of month for billing (1-31)
    status ENUM('active', 'suspended', 'cancelled', 'expired') DEFAULT 'active',
    mikrotik_username VARCHAR(100), -- PPPoE username
    mikrotik_password VARCHAR(100), -- PPPoE password
    connection_fee DECIMAL(10, 2) DEFAULT 0.00,
    reconnection_fee DECIMAL(10, 2) DEFAULT 0.00,
    is_synced_to_mikrotik BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE RESTRICT,
    INDEX idx_customer (customer_id),
    INDEX idx_status (status),
    INDEX idx_billing_day (billing_day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. BILLS / INVOICES
-- =====================================================

CREATE TABLE bills (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL, -- INV-2025-0001
    customer_id BIGINT UNSIGNED NOT NULL,
    subscription_id BIGINT UNSIGNED NOT NULL,
    billing_month DATE NOT NULL, -- First day of billing month
    package_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    late_fee DECIMAL(10, 2) DEFAULT 0.00,
    other_charges DECIMAL(10, 2) DEFAULT 0.00, -- Reconnection fee, etc.
    subtotal DECIMAL(10, 2) NOT NULL,
    previous_due DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    due_amount DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('unpaid', 'partial', 'paid', 'overpaid') DEFAULT 'unpaid',
    due_date DATE NOT NULL,
    is_auto_generated BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_by BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_invoice (invoice_number),
    INDEX idx_customer (customer_id),
    INDEX idx_billing_month (billing_month),
    INDEX idx_payment_status (payment_status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. PAYMENTS
-- =====================================================

CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL, -- PAY-2025-0001
    customer_id BIGINT UNSIGNED NOT NULL,
    bill_id BIGINT UNSIGNED,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'bkash', 'nagad', 'rocket', 'bank', 'card', 'other') NOT NULL,
    transaction_id VARCHAR(100), -- For mobile banking
    payment_date DATE NOT NULL,
    payment_type ENUM('bill_payment', 'advance_payment', 'refund') DEFAULT 'bill_payment',
    notes TEXT,
    collected_by BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE SET NULL,
    FOREIGN KEY (collected_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_payment_number (payment_number),
    INDEX idx_customer (customer_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_payment_method (payment_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. ADVANCE PAYMENTS / WALLET
-- =====================================================

CREATE TABLE customer_wallets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED UNIQUE NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    total_advance_paid DECIMAL(10, 2) DEFAULT 0.00,
    total_advance_used DECIMAL(10, 2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wallet Transaction History
CREATE TABLE wallet_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    payment_id BIGINT UNSIGNED,
    transaction_type ENUM('credit', 'debit') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    balance_before DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    INDEX idx_customer (customer_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. DISCOUNTS
-- =====================================================

CREATE TABLE discounts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    applicable_to ENUM('all', 'package', 'customer', 'billing_type') DEFAULT 'all',
    package_id BIGINT UNSIGNED,
    customer_id BIGINT UNSIGNED,
    billing_type ENUM('residential', 'business', 'vip'),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_applicable_to (applicable_to),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    type ENUM('bill_due', 'payment_received', 'suspension_warning', 'suspension', 'reconnection', 'other') NOT NULL,
    channel ENUM('sms', 'email', 'both') NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. MIKROTIK INTEGRATION
-- =====================================================

CREATE TABLE mikrotik_routers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(15) NOT NULL,
    api_port INT DEFAULT 8728,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    zone_id BIGINT UNSIGNED,
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_sync_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL,
    INDEX idx_zone (zone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE mikrotik_sync_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    router_id BIGINT UNSIGNED NOT NULL,
    subscription_id BIGINT UNSIGNED,
    action ENUM('create', 'update', 'delete', 'enable', 'disable') NOT NULL,
    status ENUM('success', 'failed') NOT NULL,
    request_data JSON,
    response_data JSON,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (router_id) REFERENCES mikrotik_routers(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    INDEX idx_router (router_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. ACTIVITY LOGS
-- =====================================================

CREATE TABLE activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    action VARCHAR(100) NOT NULL, -- e.g., "customer_created", "bill_generated"
    entity_type VARCHAR(50), -- e.g., "customer", "bill", "payment"
    entity_id BIGINT UNSIGNED,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. SYSTEM SETTINGS
-- =====================================================

CREATE TABLE settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 14. REFUNDS
-- =====================================================

CREATE TABLE refunds (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    refund_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    refund_reason TEXT,
    refund_method ENUM('cash', 'bkash', 'nagad', 'rocket', 'bank') NOT NULL,
    transaction_id VARCHAR(100),
    status ENUM('pending', 'approved', 'completed', 'rejected') DEFAULT 'pending',
    requested_by BIGINT UNSIGNED,
    approved_by BIGINT UNSIGNED,
    approved_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_customer (customer_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Default Admin User (password: admin123 - CHANGE THIS!)
INSERT INTO users (name, email, phone, password, role, status) 
VALUES ('Admin', 'admin@isp.com', '01700000000', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active');

-- Default Settings
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('company_name', 'My ISP Company', 'string', 'Company Name'),
('company_address', 'Dhaka, Bangladesh', 'string', 'Company Address'),
('company_phone', '01700000000', 'string', 'Company Phone'),
('company_email', 'info@myisp.com', 'string', 'Company Email'),
('currency', 'BDT', 'string', 'Currency'),
('grace_period_days', '5', 'number', 'Days before auto suspension'),
('late_fee_enabled', 'false', 'boolean', 'Enable late fee'),
('late_fee_amount', '50', 'number', 'Late fee amount'),
('sms_gateway_api_key', '', 'string', 'SMS Gateway API Key'),
('invoice_prefix', 'INV', 'string', 'Invoice Number Prefix'),
('payment_prefix', 'PAY', 'string', 'Payment Number Prefix');

-- Sample Zone
INSERT INTO zones (name, code, description) 
VALUES ('Mirpur', 'MIR', 'Mirpur Area');

-- Sample Package
INSERT INTO packages (name, bandwidth_download, bandwidth_upload, price, mikrotik_queue_name) 
VALUES ('10 Mbps Home', '10 Mbps', '10 Mbps', 800.00, 'home-10mbps');