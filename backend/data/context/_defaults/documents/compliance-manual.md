# Meridian Capital Partners — Compliance Manual

## 1. Know Your Customer (KYC) Program

### 1.1 Customer Identification Program (CIP)
All new clients must be identified and verified before account opening. Required identification documents vary by entity type:
- **Individuals**: Government-issued photo ID (passport preferred), proof of address dated within 90 days, and source of wealth declaration for accounts exceeding $250,000.
- **Corporations**: Certificate of incorporation, articles of association, register of directors, beneficial ownership declaration (all individuals owning >25% must be identified), and most recent audited financial statements.
- **Trusts**: Trust deed, identification of all trustees and beneficiaries, letter from trustee confirming authority to act, and source of funds documentation.

### 1.2 KYC Refresh Schedule
- **Standard risk clients**: Full KYC refresh every 12 months from the date of last review.
- **High risk clients**: Full KYC refresh every 6 months. High risk triggers include: jurisdiction risk (Iran, North Korea, Syria, Myanmar, Russia, Cayman Islands, Panama, BVI), PEP status, adverse media, complex ownership structures, and transaction patterns inconsistent with stated purpose.
- **KYC refresh process**: Relationship manager receives automated notification 30 days before KYC expiry. RM must collect updated documentation from client and submit to compliance for review. If KYC is not refreshed within 15 days of expiry, account activity is restricted until review is complete.

### 1.3 Enhanced Due Diligence (EDD)
EDD is required for all high-risk clients and must include:
- Independent verification of source of wealth and source of funds
- Senior management approval (CCO or designee)
- Enhanced ongoing monitoring with quarterly transaction reviews
- Documented risk assessment with rationale for maintaining the relationship
- PEP screening against global databases (World-Check, Dow Jones)

## 2. Anti-Money Laundering (AML) Program

### 2.1 Transaction Monitoring
All transactions are monitored for suspicious activity. Key thresholds:
- **Suspicious Activity Report (SAR)**: Filed for transactions of $10,000 or more that are suspicious. No notification to the client.
- **Currency Transaction Report (CTR)**: Filed for cash transactions exceeding $10,000 in a single business day.
- **Structuring detection**: System flags 3 or more transactions just below the $10,000 threshold within a 30-day rolling window. This includes cash deposits, withdrawals, and wire transfers.

### 2.2 Red Flags
The following patterns trigger automatic review:
- Transactions inconsistent with client's stated business or income
- Rapid movement of funds (received and sent within 24 hours)
- Transactions involving high-risk jurisdictions
- Round-dollar transactions in large amounts
- Multiple accounts used to aggregate or break apart funds
- Sudden increase in transaction volume or size
- Third-party wire transfers with no apparent business purpose

### 2.3 SAR Filing Process
1. Compliance analyst identifies suspicious activity and documents findings
2. SAR review meeting with compliance team within 48 hours of detection
3. CCO approves or rejects SAR filing
4. If approved, SAR filed with FinCEN within 30 days of detection
5. Internal notification sent to #compliance-alerts (no client notification)
6. 90-day follow-up review to determine if activity continues

## 3. Sanctions Screening

### 3.1 Screening Requirements
All new clients, counterparties, and beneficiaries must be screened against:
- OFAC Specially Designated Nationals (SDN) List
- UN Consolidated Sanctions List
- EU Consolidated Sanctions List
- UK Sanctions List

### 3.2 Screening Frequency
- **New client onboarding**: Screened before account activation
- **High-risk clients**: Daily rescreening
- **Standard clients**: Monthly rescreening
- **All wire transfers**: Real-time screening of counterparty names
- **List updates**: Within 24 hours of any list update from OFAC, UN, EU, or UK

### 3.3 Hit Resolution
When a screening produces a potential match:
1. Immediate hold on related transaction (if applicable)
2. Compliance analyst reviews match within 4 hours
3. If confirmed true positive: escalate to CCO, freeze account, file SAR, notify legal
4. If false positive: document rationale, release hold, update screening parameters
5. All hits and resolutions logged in the sanctions_checks database table
6. Notification posted to #compliance-alerts with match details

## 4. Employee Trading Policies

### 4.1 Pre-Clearance
All employee personal trades must be pre-cleared through the compliance team:
- Submit request to #compliance-alerts with security name, direction, and size
- Compliance checks against restricted list and current client holdings
- Approval or denial within 4 business hours
- Approved trades must be executed within 2 business days

### 4.2 Blackout Periods
- 14-day blackout period around quarterly earnings of any security held in client portfolios
- No trading during material non-public information (MNPI) awareness periods
- Annual attestation required from all employees

## 5. Regulatory Reporting

### 5.1 Regular Reports
- **Daily**: Trade reconciliation, cash position verification
- **Weekly**: Compliance exception report, AML alert summary
- **Monthly**: Portfolio concentration report, client activity summary
- **Quarterly**: Board compliance report, regulatory capital calculation
- **Annual**: Annual compliance review, risk assessment update

### 5.2 Regulatory Exam Preparation
Compliance maintains a standing exam-ready package including:
- Written supervisory procedures
- Last 3 years of compliance testing results
- Employee training records
- Client complaint log
- AML program documentation
- KYC file samples (minimum 10% of active clients)
