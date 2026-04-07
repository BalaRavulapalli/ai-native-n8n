# Meridian Capital Partners — Tools and Systems

## CRM: Salesforce
- n8n node: `n8n-nodes-base.salesforce`
- Instance: https://meridian.salesforce.com
- Used for: Pipeline tracking, client records, opportunity management, relationship manager assignments

## Communications: Slack
- n8n node: `n8n-nodes-base.slack`
- Credential name in n8n: "Meridian Slack"

### Slack Channels
- **#compliance-alerts** — KYC/AML alerts, sanctions screening results, SAR notifications, regulatory updates
- **#deal-team** — Deal pipeline updates, opportunity tracking, client advisory coordination
- **#operations** — Trade settlement, reconciliation, client onboarding status, operational issues
- **#risk-team** — Market risk alerts, credit risk monitoring, operational risk incidents
- **#management** — Executive updates, cross-team coordination, strategic decisions

## Database: PostgreSQL
- n8n node: `n8n-nodes-base.postgres`
- Host: postgres, Port: 5432
- Database name: meridian_clients
- Credential name in n8n: "Meridian Postgres"

### Table: clients
Master client records.
Columns: id, name, entity_type (individual/corporation/trust/partnership), jurisdiction, risk_rating (low/medium/high), onboarding_date, kyc_last_reviewed, pep_status (boolean), relationship_manager

### Table: transactions
All client transactions.
Columns: id, client_id, amount, currency, direction (inbound/outbound), counterparty, transaction_date, flagged (boolean), flag_reason

### Table: kyc_records
KYC document records.
Columns: id, client_id, document_type (passport/utility_bill/corporate_registration/financial_statement/trust_deed/source_of_wealth/pep_declaration), document_url, uploaded_date, expiry_date, status (valid/expired/pending_review/rejected), reviewer

### Table: sanctions_checks
Sanctions screening results.
Columns: id, client_id, check_date, result (clear/hit/pending), matched_list, details

## Document Storage: SharePoint
- n8n node: `n8n-nodes-base.httpRequest` (via Microsoft Graph REST API)
- Base URL: https://meridian.sharepoint.com
- API endpoint: https://graph.microsoft.com/v1.0/sites/{site-id}
- Credential: Microsoft Graph OAuth2
- Used for: Internal document storage for KYC documents, compliance manuals, client files. No native SharePoint node in n8n — use HTTP Request node with Microsoft Graph API.

## Email: SendGrid
- n8n node: `n8n-nodes-base.sendGrid`
- From address: notifications@meridiancp.com
- Used for: Client communications, automated notifications, report distribution
