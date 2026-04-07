# Meridian Capital Partners — Client Onboarding Procedures

## 1. Overview
The client onboarding process at Meridian Capital Partners involves multiple teams and typically takes 5-10 business days from initial application to full account activation. The process is designed to ensure regulatory compliance while providing a smooth client experience.

## 2. Onboarding Workflow

### Step 1: Initial Application (Day 1)
- Relationship Manager (RM) submits new client application via Salesforce
- Application includes: client name, entity type, jurisdiction, expected account size, investment objectives, and risk tolerance
- Salesforce automatically creates an opportunity in "Onboarding" stage
- Notification sent to #operations channel

### Step 2: Document Collection (Days 1-3)
- Operations team sends document request to client via email (SendGrid)
- Required documents based on entity type (see Compliance Manual Section 1.1)
- Documents uploaded to SharePoint under /clients/{client_name}/kyc/
- RM follows up with client if documents not received within 3 business days

### Step 3: KYC Review (Days 3-5)
- Compliance team reviews all submitted documents
- Sanctions screening performed against OFAC, UN, EU, UK lists
- Results logged in sanctions_checks table
- Risk rating assigned: low, medium, or high
- If high risk: Enhanced Due Diligence triggered (see Compliance Manual Section 1.3)
- If sanctions hit: Onboarding paused, escalated to CCO via #compliance-alerts

### Step 4: Account Setup (Days 5-7)
- Operations creates client record in PostgreSQL (clients table)
- Trading accounts configured with appropriate permissions
- Wire instructions established
- Client portal access provisioned

### Step 5: Activation (Days 7-10)
- Final compliance review and sign-off
- Salesforce opportunity moved to "Active" stage
- Welcome email sent to client via SendGrid
- RM notified via #deal-team that client is active
- First-year KYC review date set (kyc_last_reviewed + 12 months)

## 3. Expedited Onboarding
For institutional clients with existing relationships at other major firms:
- Compliance may accept KYC documentation from the prior firm (reliance on third-party due diligence)
- Process can be completed in 3-5 business days
- Still requires independent sanctions screening

## 4. Rejected Applications
If a client application is rejected (sanctions hit, unacceptable risk, incomplete documentation):
- CCO sends written notification with reason (unless sanctions-related, in which case no tipping off)
- Salesforce opportunity moved to "Rejected" stage
- All collected documentation retained for 5 years per data retention policy
- Notification sent to #compliance-alerts

## 5. Ongoing Monitoring Post-Onboarding
- Transaction monitoring begins immediately upon account activation
- First 90 days: enhanced monitoring with weekly transaction review
- After 90 days: standard monitoring based on risk rating
- RM conducts first relationship review at 6 months
