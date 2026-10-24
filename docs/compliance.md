# Workspace evidence checks

Sources checked 24 October 2026. These prompts help an operator review records. They do not certify legal compliance, inspect file contents or enforce Microsoft permissions. The operator determines which law, exceptions, retention schedule and legal holds apply.

| Check | Rule and source | Behaviour |
|---|---|---|
| Owner missing, sharing unknown, externally shared sensitive records | [NZ Privacy Act principle 5](https://www.privacy.org.nz/privacy-principles/5/) requires reasonable safeguards against loss and unauthorised access, use or disclosure. | Flag the missing accountability or sharing evidence. The tool cannot decide whether access is authorised. |
| Retention review missing or due | [NZ Privacy Act principle 9](https://www.privacy.org.nz/privacy-principles/9/) limits keeping personal information beyond its lawful purpose. | Request an operator review, never assume a date is a deletion deadline. |
| Sharing and retention reviews in AU | [OAIC APP 11 guidance](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information) addresses security and destruction or de-identification when information is no longer needed, with exceptions including legal retention requirements. | Prompt the review where applicable. No conclusion about whether the business is an APP entity or whether an exception applies. |
| Hold yes or unknown | Internal conservative control supporting retention review. | Block archive recommendations until the hold is explicitly no in current source evidence. |
| Inactivity threshold | Internal policy, default 90 days. No legal deadline is asserted. | Flag older activity and separately report missing activity dates. |
| Source freshness | Internal policy, default 30 days. | Block review decisions and completion against stale or superseded snapshots. |
| Separation of review and verification | Internal record control, not a statutory electronic signature. | The assigned reviewer differs from the opener. The completion verifier differs from the decision actor. Evidence is required. |

Sharing flags alone do not establish a breach. A completed review does not remove a finding from source data. Refresh the inventory after external work to verify the new state. Retention checks apply to metadata and business decisions, not an automated retention engine.

Use a dedicated database with trusted operator credentials. Row-level security and revoked public grants prevent accidental access by ungranted roles. The database owner can alter records, so the event log is not tamper-proof. Actor names are not authenticated identities. Scope selection prevents accidental mixing in CLI queries but is not a tenant authorisation layer. Rendered documents and views contain all scopes. Restrict their storage and distribution. No customer files or personal datasets are included in the demo.
