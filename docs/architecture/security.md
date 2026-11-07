# Security implementation notes

This document records the current implementation. It does not certify regulatory compliance.

## 1. Authentication

Passwords are hashed with bcrypt. Access tokens identify a user, role and session.
Refresh tokens are hashed before storage. Repeated failed logins can lock accounts.

## 2. Authorization

Route middleware and service checks restrict access by role and patient relationship.
Dependent access uses explicit permissions. Production must use distinct random JWT secrets.

## 3. Deployment

Keep credentials in provider environment settings. Configure explicit frontend origins,
HTTPS URLs and secure cookies. Do not deploy the demo seed or its known passwords.

## 4. Sensitive records

Clinical records, audit metadata and data exports contain sensitive information.
Restrict administrator access and avoid writing credentials into logs or source control.

## 5. Audit logging

`apps/server/src/utils/audit.ts` creates audit rows with the actor, action, target,
timestamp, optional IP address and metadata. Application code must not update or
delete audit rows. The audit migration also adds database protections. The existing
audit tests check append-only source usage and the documented action names below.

| Area | Recorded actions |
| --- | --- |
| Authentication | `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `PASSWORD_CHANGED`, `EMAIL_CHANGED`, `PHONE_CHANGED` |
| Administration | `USER_CREATED`, `STAFF_UPDATED`, `VERIFY_DOCTOR`, `REJECT_DOCTOR` |
| Patient profiles | `PATIENT_REGISTERED`, `PATIENT_UPDATED`, `DEPENDENT_LINKED`, `DEPENDENT_PERMISSIONS_CHANGED`, `DEPENDENT_UNLINKED` |
| Appointments | `APPOINTMENT_BOOKED`, `APPOINTMENT_CANCELLED`, `APPOINTMENT_RESCHEDULED`, `APPOINTMENT_CHECKED_IN` |
| Clinical notes | `NOTE_STARTED`, `NOTE_AMENDED_IN_WINDOW`, `NOTE_SIGNED`, `NOTE_ADDENDUM_ADDED`, `NOTE_VIEWED`, `NOTES_LISTED`, `VITALS_RECORDED` |
| Prescriptions | `PRESCRIPTION_DRAFTED`, `PRESCRIPTION_DRAFT_UPDATED`, `PRESCRIPTION_ISSUED`, `PRESCRIPTION_VIEWED`, `PRESCRIPTION_DISPENSED` |
| Patient history | `ALLERGY_ADDED`, `ALLERGY_CONFIRMED`, `ALLERGY_REMOVED`, `CONDITION_ADDED`, `CONDITION_RESOLVED`, `CONDITION_REMOVED`, `VACCINATION_ADDED`, `VACCINATION_UPDATED`, `VACCINATION_REMOVED`, `SURGERY_ADDED`, `SURGERY_UPDATED`, `SURGERY_REMOVED`, `FAMILY_HISTORY_ADDED`, `FAMILY_HISTORY_UPDATED`, `FAMILY_HISTORY_REMOVED`, `LIFESTYLE_UPDATED`, `PATIENT_HISTORY_VIEWED` |
| Laboratory | `LAB_ORDER_CREATED`, `LAB_ORDER_CANCELLED`, `LAB_SAMPLE_COLLECTED`, `LAB_TESTING_STARTED`, `LAB_RESULTS_ENTERED`, `LAB_CRITICAL_ALERTED`, `LAB_ORDER_VERIFIED`, `LAB_ORDER_VIEWED` |
| Pharmacy | `INVENTORY_ADJUSTED`, `BATCH_RECALLED` |
| Billing | `BILL_CREATED`, `BILL_CHARGE_ADDED`, `BILL_UPDATED`, `BILL_FINALISED`, `BILL_VOIDED`, `BILL_VIEWED`, `BILL_DISCOUNT_APPLIED`, `BILL_DISCOUNT_REMOVED` |
| Discounts and insurance | `DISCOUNT_CREATED`, `DISCOUNT_UPDATED`, `DISCOUNT_DEACTIVATED`, `INSURANCE_ADDED`, `INSURANCE_UPDATED`, `INSURANCE_DEACTIVATED` |
| Payments | `PAYMENT_INTENT_CREATED`, `PAYMENT_CASH_RECEIVED`, `PAYMENT_REFUNDED` |
| Records | `MEDICAL_RECORD_UPLOADED`, `MEDICAL_RECORD_TEXT_EXTRACTED`, `MEDICAL_RECORDS_LISTED`, `MEDICAL_RECORD_OPENED`, `MEDICAL_RECORD_DELETED`, `HEALTH_VAULT_EXPORTED` |
| AI and search | `AI_RETRIEVAL`, `AI_APPOINTMENT_ASSIST`, `MEDICAL_RECORD_OCR`, `MEDICAL_RECORD_SUMMARY_VIEWED`, `PATIENT_DATA_SEARCHED`, `KB_CREATE`, `KB_UPDATE`, `KB_DELETE` |
| Referrals | `REFERRAL_CREATED`; state transitions generate an action from the new status |
| Privacy | `DATA_EXPORT_REQUESTED`, `ACCOUNT_DELETION_REQUESTED`, `ACCOUNT_DELETION_CANCELLED`, `ACCOUNT_ANONYMISED` |

## 6. Verification limits

Source checks verify structural guarantees, not every runtime permission path.
Deployment verification must separately exercise authentication, authorization,
database connectivity and provider integrations.
