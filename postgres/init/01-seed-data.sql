-- Meridian Capital Partners: Mock Company Data
-- This data is used by n8n workflows during test execution

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- individual, corporation, trust, partnership
    jurisdiction VARCHAR(100) NOT NULL,
    risk_rating VARCHAR(20) NOT NULL, -- low, medium, high
    onboarding_date DATE NOT NULL,
    kyc_last_reviewed DATE,
    pep_status BOOLEAN DEFAULT FALSE,
    relationship_manager VARCHAR(255) NOT NULL
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    direction VARCHAR(10) NOT NULL, -- inbound, outbound
    counterparty VARCHAR(255),
    transaction_date DATE NOT NULL,
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason VARCHAR(500)
);

-- KYC Records table
CREATE TABLE IF NOT EXISTS kyc_records (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    document_type VARCHAR(100) NOT NULL, -- passport, utility_bill, corporate_registration, financial_statement
    document_url VARCHAR(500),
    uploaded_date DATE NOT NULL,
    expiry_date DATE,
    status VARCHAR(20) NOT NULL, -- valid, expired, pending_review, rejected
    reviewer VARCHAR(255)
);

-- Sanctions Checks table
CREATE TABLE IF NOT EXISTS sanctions_checks (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    check_date DATE NOT NULL,
    result VARCHAR(20) NOT NULL, -- clear, hit, pending
    matched_list VARCHAR(100),
    details TEXT
);

-- ============================================================
-- SEED DATA: ~20 clients with varied risk profiles
-- ============================================================

INSERT INTO clients (name, entity_type, jurisdiction, risk_rating, onboarding_date, kyc_last_reviewed, pep_status, relationship_manager) VALUES
('Apex Growth Fund LLC', 'corporation', 'United States', 'low', '2023-03-15', '2024-03-10', FALSE, 'James Mitchell'),
('Brighton Family Trust', 'trust', 'United Kingdom', 'low', '2022-06-20', '2023-06-15', FALSE, 'Sarah Chen'),
('Carlos Mendez', 'individual', 'Mexico', 'medium', '2023-09-01', '2024-08-28', FALSE, 'Michael Torres'),
('Dragon Gate Holdings Ltd', 'corporation', 'Hong Kong', 'medium', '2024-01-10', '2024-01-10', FALSE, 'Lisa Park'),
('Elena Volkov', 'individual', 'Russia', 'high', '2023-04-22', '2024-04-20', FALSE, 'David Kim'),
('Fairmont Partners LP', 'partnership', 'United States', 'low', '2021-11-05', '2023-11-01', FALSE, 'James Mitchell'),
('Global Ventures SARL', 'corporation', 'Switzerland', 'medium', '2024-06-15', '2024-06-15', FALSE, 'Sarah Chen'),
('Hassan Al-Rahman', 'individual', 'United Arab Emirates', 'medium', '2023-07-30', '2024-07-25', TRUE, 'Michael Torres'),
('Ironclad Investments Inc', 'corporation', 'Canada', 'low', '2022-02-14', '2024-02-10', FALSE, 'Lisa Park'),
('Jade Capital Group', 'corporation', 'Singapore', 'low', '2023-12-01', '2023-12-01', FALSE, 'David Kim'),
('Konstantin Petrov', 'individual', 'Russia', 'high', '2024-03-05', '2024-03-05', TRUE, 'Sarah Chen'),
('Lakewood Wealth Management', 'corporation', 'United States', 'low', '2020-08-10', '2023-08-05', FALSE, 'James Mitchell'),
('Meridian Offshore Trust', 'trust', 'Cayman Islands', 'high', '2023-05-18', '2024-05-15', FALSE, 'Michael Torres'),
('Nakamura Trading Co', 'corporation', 'Japan', 'low', '2024-02-28', '2024-02-28', FALSE, 'Lisa Park'),
('Omar Farouk', 'individual', 'Syria', 'high', '2024-07-01', '2024-07-01', FALSE, 'David Kim'),
('Pacific Rim Equity Partners', 'partnership', 'Australia', 'low', '2023-10-12', '2024-10-10', FALSE, 'James Mitchell'),
('Quantum Dynamics LLC', 'corporation', 'United States', 'low', '2024-09-20', NULL, FALSE, 'Sarah Chen'),
('Ramirez Family Office', 'trust', 'Panama', 'high', '2023-01-08', '2024-01-05', FALSE, 'Michael Torres'),
('Sterling Capital Advisors', 'corporation', 'United Kingdom', 'low', '2022-04-30', '2024-04-25', FALSE, 'Lisa Park'),
('Tanaka Yuki', 'individual', 'Japan', 'low', '2024-11-15', NULL, FALSE, 'David Kim'),
-- Recently onboarded (for sanctions screening demo)
('Novus Financial Group', 'corporation', 'United States', 'low', CURRENT_DATE - INTERVAL '1 day', NULL, FALSE, 'James Mitchell'),
('Viktor Orban Capital', 'corporation', 'Hungary', 'medium', CURRENT_DATE - INTERVAL '1 day', NULL, TRUE, 'Sarah Chen');

-- ============================================================
-- SEED DATA: ~100 transactions
-- ============================================================

INSERT INTO transactions (client_id, amount, currency, direction, counterparty, transaction_date, flagged, flag_reason) VALUES
-- Normal transactions
(1, 250000.00, 'USD', 'inbound', 'Goldman Sachs', '2025-01-15', FALSE, NULL),
(1, 75000.00, 'USD', 'outbound', 'Vanguard', '2025-01-20', FALSE, NULL),
(2, 180000.00, 'GBP', 'inbound', 'Barclays Wealth', '2025-01-10', FALSE, NULL),
(3, 45000.00, 'USD', 'inbound', 'BBVA Mexico', '2025-02-01', FALSE, NULL),
(4, 500000.00, 'HKD', 'inbound', 'HSBC Hong Kong', '2025-01-25', FALSE, NULL),
(6, 120000.00, 'USD', 'outbound', 'Charles Schwab', '2025-02-05', FALSE, NULL),
(7, 300000.00, 'CHF', 'inbound', 'UBS Zurich', '2025-01-18', FALSE, NULL),
(9, 95000.00, 'CAD', 'inbound', 'RBC Capital', '2025-02-10', FALSE, NULL),
(10, 200000.00, 'SGD', 'inbound', 'DBS Bank', '2025-01-22', FALSE, NULL),
(12, 150000.00, 'USD', 'outbound', 'Fidelity', '2025-02-12', FALSE, NULL),
(14, 80000.00, 'JPY', 'inbound', 'Nomura Securities', '2025-01-28', FALSE, NULL),
(16, 175000.00, 'AUD', 'inbound', 'Macquarie Group', '2025-02-08', FALSE, NULL),
(19, 220000.00, 'GBP', 'inbound', 'HSBC UK', '2025-01-30', FALSE, NULL),
(1, 50000.00, 'USD', 'outbound', 'Morgan Stanley', '2025-02-15', FALSE, NULL),
(2, 90000.00, 'GBP', 'outbound', 'JP Morgan London', '2025-02-18', FALSE, NULL),
(3, 35000.00, 'USD', 'outbound', 'Wire to personal account', '2025-02-20', FALSE, NULL),
(4, 150000.00, 'HKD', 'outbound', 'Standard Chartered HK', '2025-02-22', FALSE, NULL),
(6, 200000.00, 'USD', 'inbound', 'Client contribution', '2025-03-01', FALSE, NULL),
(7, 175000.00, 'CHF', 'outbound', 'Credit Suisse', '2025-03-05', FALSE, NULL),
(9, 60000.00, 'CAD', 'outbound', 'TD Securities', '2025-03-08', FALSE, NULL),

-- Flagged transactions (above SAR threshold or suspicious patterns)
(5, 15000.00, 'USD', 'outbound', 'Unknown entity - Cyprus', '2025-01-12', TRUE, 'High-risk jurisdiction client, amount above SAR threshold'),
(5, 9800.00, 'USD', 'outbound', 'Shell Corp Ltd - BVI', '2025-01-14', TRUE, 'Possible structuring: amount just below $10K threshold'),
(5, 9700.00, 'USD', 'outbound', 'Shell Corp Ltd - BVI', '2025-01-15', TRUE, 'Possible structuring: repeated near-threshold transactions'),
(8, 12500.00, 'USD', 'outbound', 'Undisclosed recipient - Dubai', '2025-02-03', TRUE, 'PEP client, above SAR threshold, unusual counterparty'),
(11, 25000.00, 'USD', 'inbound', 'Unknown source - Moscow', '2025-01-20', TRUE, 'High-risk jurisdiction, PEP, unusual source'),
(11, 50000.00, 'USD', 'outbound', 'Crypto exchange - Seychelles', '2025-01-25', TRUE, 'PEP client, crypto exchange in offshore jurisdiction'),
(13, 100000.00, 'USD', 'inbound', 'Anonymous wire - Cayman', '2025-02-14', TRUE, 'Offshore trust, large anonymous inbound wire'),
(15, 30000.00, 'USD', 'outbound', 'Unknown - Damascus', '2025-02-28', TRUE, 'Sanctioned jurisdiction (Syria)'),
(18, 8500.00, 'USD', 'outbound', 'Cash withdrawal', '2025-01-05', TRUE, 'Possible structuring from high-risk jurisdiction client'),
(18, 8200.00, 'USD', 'outbound', 'Cash withdrawal', '2025-01-06', TRUE, 'Possible structuring: consecutive near-threshold withdrawals'),
(18, 8800.00, 'USD', 'outbound', 'Cash withdrawal', '2025-01-07', TRUE, 'Possible structuring: third consecutive near-threshold withdrawal'),

-- More normal transactions to fill out the dataset
(10, 120000.00, 'SGD', 'outbound', 'OCBC Bank', '2025-03-10', FALSE, NULL),
(12, 300000.00, 'USD', 'inbound', 'Pension fund distribution', '2025-03-12', FALSE, NULL),
(14, 45000.00, 'JPY', 'outbound', 'Daiwa Securities', '2025-03-15', FALSE, NULL),
(16, 80000.00, 'AUD', 'outbound', 'ANZ Capital', '2025-03-18', FALSE, NULL),
(19, 140000.00, 'GBP', 'inbound', 'Schroders', '2025-03-20', FALSE, NULL),
(1, 180000.00, 'USD', 'inbound', 'BlackRock', '2025-03-22', FALSE, NULL),
(2, 65000.00, 'GBP', 'inbound', 'Legal & General', '2025-03-25', FALSE, NULL),
(6, 90000.00, 'USD', 'outbound', 'State Street', '2025-03-28', FALSE, NULL),
(9, 110000.00, 'CAD', 'inbound', 'BMO Capital', '2025-03-30', FALSE, NULL),
(1, 200000.00, 'USD', 'outbound', 'Bridgewater Associates', '2025-04-01', FALSE, NULL),
(3, 55000.00, 'USD', 'inbound', 'Citibank Mexico', '2025-04-02', FALSE, NULL),
(4, 350000.00, 'HKD', 'inbound', 'Bank of China HK', '2025-04-03', FALSE, NULL),
(7, 225000.00, 'CHF', 'inbound', 'Julius Baer', '2025-04-04', FALSE, NULL),
(10, 90000.00, 'SGD', 'inbound', 'UOB', '2025-04-05', FALSE, NULL),
(12, 175000.00, 'USD', 'outbound', 'T. Rowe Price', '2025-04-06', FALSE, NULL),
(14, 130000.00, 'JPY', 'inbound', 'SMBC Nikko', '2025-04-07', FALSE, NULL),
(16, 60000.00, 'AUD', 'inbound', 'Westpac', '2025-04-08', FALSE, NULL),
(19, 95000.00, 'GBP', 'outbound', 'Investec', '2025-04-09', FALSE, NULL),
(2, 120000.00, 'GBP', 'outbound', 'Aberdeen Asset Mgmt', '2025-04-10', FALSE, NULL),
(6, 155000.00, 'USD', 'inbound', 'Lazard', '2025-04-11', FALSE, NULL),

-- Additional flagged for patterns
(13, 45000.00, 'USD', 'outbound', 'Wire - unknown beneficiary', '2025-03-01', TRUE, 'Offshore trust, wire to unidentified beneficiary'),
(5, 9900.00, 'USD', 'outbound', 'Wire - Cyprus entity', '2025-03-10', TRUE, 'Continued structuring pattern from high-risk client'),
(8, 20000.00, 'USD', 'inbound', 'Source undeclared', '2025-03-15', TRUE, 'PEP client, undeclared source of funds'),

-- Normal bulk
(1, 125000.00, 'USD', 'inbound', 'Invesco', '2025-04-12', FALSE, NULL),
(3, 40000.00, 'USD', 'outbound', 'Santander Mexico', '2025-04-13', FALSE, NULL),
(4, 200000.00, 'HKD', 'outbound', 'Hang Seng Bank', '2025-04-14', FALSE, NULL),
(7, 80000.00, 'CHF', 'outbound', 'Lombard Odier', '2025-04-15', FALSE, NULL),
(9, 150000.00, 'CAD', 'outbound', 'CIBC Wood Gundy', '2025-04-16', FALSE, NULL),
(10, 70000.00, 'SGD', 'outbound', 'CGS-CIMB', '2025-04-17', FALSE, NULL),
(12, 250000.00, 'USD', 'inbound', 'PIMCO', '2025-04-18', FALSE, NULL),
(14, 100000.00, 'JPY', 'outbound', 'Mizuho Securities', '2025-04-19', FALSE, NULL),
(16, 45000.00, 'AUD', 'outbound', 'CommSec', '2025-04-20', FALSE, NULL),
(19, 180000.00, 'GBP', 'inbound', 'M&G Investments', '2025-04-21', FALSE, NULL),
(1, 95000.00, 'USD', 'outbound', 'Northern Trust', '2025-04-22', FALSE, NULL),
(2, 70000.00, 'GBP', 'inbound', 'Baillie Gifford', '2025-04-23', FALSE, NULL),
(6, 130000.00, 'USD', 'outbound', 'Neuberger Berman', '2025-04-24', FALSE, NULL),
(9, 85000.00, 'CAD', 'inbound', 'Scotiabank', '2025-04-25', FALSE, NULL),
(3, 28000.00, 'USD', 'inbound', 'Banorte', '2025-04-26', FALSE, NULL),
(4, 180000.00, 'HKD', 'inbound', 'ICBC Asia', '2025-04-27', FALSE, NULL),
(7, 160000.00, 'CHF', 'inbound', 'Pictet', '2025-04-28', FALSE, NULL),
(10, 55000.00, 'SGD', 'inbound', 'Phillip Securities', '2025-04-29', FALSE, NULL),
(12, 100000.00, 'USD', 'outbound', 'Wellington Mgmt', '2025-04-30', FALSE, NULL),
(14, 75000.00, 'JPY', 'inbound', 'SBI Securities', '2025-05-01', FALSE, NULL),
(16, 110000.00, 'AUD', 'inbound', 'Macquarie Wealth', '2025-05-02', FALSE, NULL),
(19, 85000.00, 'GBP', 'outbound', 'Rathbones', '2025-05-03', FALSE, NULL),
(1, 300000.00, 'USD', 'inbound', 'AQR Capital', '2025-05-04', FALSE, NULL),
(2, 145000.00, 'GBP', 'outbound', 'St. James Place', '2025-05-05', FALSE, NULL),
(6, 75000.00, 'USD', 'inbound', 'Baird', '2025-05-06', FALSE, NULL),
(9, 200000.00, 'CAD', 'inbound', 'Manulife Securities', '2025-05-07', FALSE, NULL),
(20, 50000.00, 'JPY', 'inbound', 'Initial deposit', CURRENT_DATE - INTERVAL '1 day', FALSE, NULL),
(21, 500000.00, 'USD', 'inbound', 'Wire from First National', CURRENT_DATE - INTERVAL '1 day', FALSE, NULL),
(22, 250000.00, 'USD', 'inbound', 'Opening deposit', CURRENT_DATE - INTERVAL '1 day', FALSE, NULL);

-- ============================================================
-- SEED DATA: ~30 KYC records
-- ============================================================

INSERT INTO kyc_records (client_id, document_type, document_url, uploaded_date, expiry_date, status, reviewer) VALUES
-- Valid and current
(1, 'corporate_registration', 'sharepoint://docs/kyc/apex-growth/corp-reg.pdf', '2024-03-10', '2026-03-10', 'valid', 'Sarah Chen'),
(1, 'financial_statement', 'sharepoint://docs/kyc/apex-growth/financials-2024.pdf', '2024-03-10', '2025-12-31', 'valid', 'Sarah Chen'),
(2, 'trust_deed', 'sharepoint://docs/kyc/brighton-trust/deed.pdf', '2023-06-15', '2025-06-15', 'valid', 'David Kim'),
(3, 'passport', 'sharepoint://docs/kyc/mendez/passport.pdf', '2024-08-28', '2029-08-28', 'valid', 'Sarah Chen'),
(4, 'corporate_registration', 'sharepoint://docs/kyc/dragon-gate/corp-reg.pdf', '2024-01-10', '2026-01-10', 'valid', 'Lisa Park'),
(7, 'corporate_registration', 'sharepoint://docs/kyc/global-ventures/corp-reg.pdf', '2024-06-15', '2026-06-15', 'valid', 'Michael Torres'),
(9, 'corporate_registration', 'sharepoint://docs/kyc/ironclad/corp-reg.pdf', '2024-02-10', '2026-02-10', 'valid', 'David Kim'),
(10, 'corporate_registration', 'sharepoint://docs/kyc/jade-capital/corp-reg.pdf', '2023-12-01', '2025-12-01', 'valid', 'James Mitchell'),
(14, 'corporate_registration', 'sharepoint://docs/kyc/nakamura/corp-reg.pdf', '2024-02-28', '2026-02-28', 'valid', 'Sarah Chen'),
(16, 'corporate_registration', 'sharepoint://docs/kyc/pacific-rim/corp-reg.pdf', '2024-10-10', '2026-10-10', 'valid', 'Lisa Park'),
(19, 'corporate_registration', 'sharepoint://docs/kyc/sterling/corp-reg.pdf', '2024-04-25', '2026-04-25', 'valid', 'David Kim'),

-- Expired or due for review (KYC last reviewed > 12 months ago)
(6, 'corporate_registration', 'sharepoint://docs/kyc/fairmont/corp-reg.pdf', '2023-11-01', '2025-11-01', 'expired', 'James Mitchell'),
(6, 'financial_statement', 'sharepoint://docs/kyc/fairmont/financials-2022.pdf', '2023-11-01', '2024-12-31', 'expired', 'James Mitchell'),
(12, 'corporate_registration', 'sharepoint://docs/kyc/lakewood/corp-reg.pdf', '2023-08-05', '2025-08-05', 'expired', 'Sarah Chen'),
(12, 'financial_statement', 'sharepoint://docs/kyc/lakewood/financials-2022.pdf', '2023-08-05', '2024-12-31', 'expired', 'Sarah Chen'),

-- High-risk clients with enhanced due diligence docs
(5, 'passport', 'sharepoint://docs/kyc/volkov/passport.pdf', '2024-04-20', '2029-04-20', 'valid', 'David Kim'),
(5, 'proof_of_address', 'sharepoint://docs/kyc/volkov/utility-bill.pdf', '2024-04-20', '2025-04-20', 'expired', 'David Kim'),
(5, 'source_of_wealth', 'sharepoint://docs/kyc/volkov/sow-declaration.pdf', '2024-04-20', '2025-04-20', 'expired', 'David Kim'),
(8, 'passport', 'sharepoint://docs/kyc/al-rahman/passport.pdf', '2024-07-25', '2030-07-25', 'valid', 'Lisa Park'),
(8, 'pep_declaration', 'sharepoint://docs/kyc/al-rahman/pep-form.pdf', '2024-07-25', '2025-07-25', 'valid', 'Lisa Park'),
(11, 'passport', 'sharepoint://docs/kyc/petrov/passport.pdf', '2024-03-05', '2029-03-05', 'valid', 'Sarah Chen'),
(11, 'pep_declaration', 'sharepoint://docs/kyc/petrov/pep-form.pdf', '2024-03-05', '2025-03-05', 'valid', 'Sarah Chen'),
(11, 'source_of_wealth', 'sharepoint://docs/kyc/petrov/sow-declaration.pdf', '2024-03-05', '2025-03-05', 'pending_review', 'Sarah Chen'),
(13, 'trust_deed', 'sharepoint://docs/kyc/meridian-offshore/deed.pdf', '2024-05-15', '2026-05-15', 'valid', 'Michael Torres'),
(15, 'passport', 'sharepoint://docs/kyc/farouk/passport.pdf', '2024-07-01', '2029-07-01', 'valid', 'David Kim'),
(15, 'source_of_wealth', 'sharepoint://docs/kyc/farouk/sow-declaration.pdf', '2024-07-01', '2025-07-01', 'pending_review', 'David Kim'),
(18, 'trust_deed', 'sharepoint://docs/kyc/ramirez/deed.pdf', '2024-01-05', '2026-01-05', 'valid', 'Michael Torres'),
(18, 'financial_statement', 'sharepoint://docs/kyc/ramirez/financials-2023.pdf', '2024-01-05', '2025-12-31', 'valid', 'Michael Torres'),

-- New clients with no KYC yet
(17, 'corporate_registration', 'sharepoint://docs/kyc/quantum/corp-reg.pdf', '2024-09-20', '2026-09-20', 'pending_review', 'Sarah Chen'),
(20, 'passport', 'sharepoint://docs/kyc/tanaka/passport.pdf', '2024-11-15', '2029-11-15', 'pending_review', 'David Kim');

-- ============================================================
-- SEED DATA: ~15 sanctions checks
-- ============================================================

INSERT INTO sanctions_checks (client_id, check_date, result, matched_list, details) VALUES
-- Clear results
(1, '2024-03-10', 'clear', NULL, 'No matches found on any sanctions list'),
(2, '2023-06-15', 'clear', NULL, 'No matches found on any sanctions list'),
(3, '2024-08-28', 'clear', NULL, 'No matches found on any sanctions list'),
(4, '2024-01-10', 'clear', NULL, 'No matches found on any sanctions list'),
(7, '2024-06-15', 'clear', NULL, 'No matches found on any sanctions list'),
(9, '2024-02-10', 'clear', NULL, 'No matches found on any sanctions list'),
(10, '2023-12-01', 'clear', NULL, 'No matches found on any sanctions list'),
(14, '2024-02-28', 'clear', NULL, 'No matches found on any sanctions list'),
(16, '2024-10-10', 'clear', NULL, 'No matches found on any sanctions list'),
(19, '2024-04-25', 'clear', NULL, 'No matches found on any sanctions list'),

-- Hits / matches
(5, '2024-04-20', 'hit', 'OFAC SDN', 'Partial name match: Elena Volkov - matched against Volkov, E.A. on OFAC SDN list. Enhanced due diligence required.'),
(11, '2024-03-05', 'hit', 'EU Sanctions', 'Name match: Konstantin Petrov - matched against EU Consolidated Sanctions List entry. PEP with connections to sanctioned entities.'),
(15, '2024-07-01', 'hit', 'OFAC SDN', 'Jurisdiction match: Syria is a comprehensively sanctioned jurisdiction under OFAC. Client nationality triggers enhanced screening.'),

-- Pending (new clients not yet screened)
(21, CURRENT_DATE - INTERVAL '1 day', 'pending', NULL, 'New client - sanctions screening initiated, awaiting results'),
(22, CURRENT_DATE - INTERVAL '1 day', 'pending', NULL, 'New client - sanctions screening initiated, awaiting results');
