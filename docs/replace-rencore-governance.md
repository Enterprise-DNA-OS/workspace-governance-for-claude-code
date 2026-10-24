# Move a workspace review from Rencore Governance

Checked 24 October 2026 against [Rencore's data-grid export guide](https://docs.rencore.com/governance/guides/your-rencore-workspace/export-datagrids-to-pdf-or-excel/) and [report-definition export guide](https://docs.rencore.com/governance/guides/reports/export-a-report/).

## Get the records out

Open the relevant inventory data grid or custom report. Confirm the selected tenant and review scope, remove unintended filters and record the row count and actual scan date. Use Export, choose Excel and include the required columns. Rencore makes the download available through its export process. The operator needs its Export data permission. A .report or .json report definition contains configuration, not the inventory rows this importer needs. PDF is not supported.

Choose a scope you can completely reconcile, such as all Teams workspaces in one tenant. The tool calls it a tenant, but it can be a narrower named review scope. Do not import a filtered subset over a broader scope. To combine exports, reconcile them into one flat worksheet with unique workspace IDs first. Keep the originals securely.

## Create the scope and map its headings

```bash
npm run gov -- create-tenant --code=FIRM --name="Our Teams review scope" --jurisdiction=NZ --actor="Operator"
npm run gov -- import rencore --tenant=FIRM --file=imports/workspaces.xlsx --source-on=2026-10-24 --expected=50 --map=imports/our-map.json --actor="Operator" --dry-run
```

Replace the date and count with verified export details. The mapping file maps canonical field names to the actual column headings, as demonstrated by fixtures/rencore-map.json. Built-in aliases cover common headings, not every possible Rencore report. The fixtures are synthetic examples of this contract, not captured exports. Rencore does not prescribe one fixed set of columns for all data grids.

| Field | Required value |
|---|---|
| external_id | Stable unique workspace ID, required |
| name | Display name, required |
| service | Teams, SharePoint, OneDrive, PowerBI or Other, required |
| owner_name | Accountable owner name, blank means missing |
| last_activity_on | ISO calendar date or Excel date, blank means unknown |
| sharing | internal, external, anonymous or unknown |
| sensitivity | public, internal, confidential, restricted or unknown |
| retention_review_on | ISO calendar date or Excel date, blank means review needed |
| legal_hold | yes, no or unknown |

Headings can be mapped. Values must match this vocabulary, so reconcile your organisation's custom labels and relation fields before importing. Do not turn an absent legal-hold column into no. A list of owners may be preserved as text, but the operator must establish accountability. Blank sharing, sensitivity and hold values stay unknown. Do not infer retention or hold status from a workspace name.

Dates must be YYYY-MM-DD in CSV. Excel date cells are accepted. Use --sheet=Workspaces when the workbook contains multiple sheets. Formula, hyperlink and rich-text cells are refused: save reviewed plain values first. Text containing commas, quotes or line breaks is supported in CSV.

## Save and reconcile

After the dry run passes, run the same command without --dry-run. Then compare list, summary and compliance with the source export. Imported row count must equal --expected. The count cannot establish that a source export was unfiltered, so check scope yourself. Invalid input writes nothing. Re-importing identical records with the same source date changes nothing. Older source dates are refused within a scope. A revised same-day import creates another snapshot.

New snapshots preserve old rows and reviews. A missing workspace is marked absent from the next snapshot by changes, not deleted from Microsoft. Reviews tied to old snapshots cannot be decided or completed. Open a new review from current evidence. Do not reuse an old approval for new data.

## What carries across

Workspace identifiers, names, service, accountable owner, activity dates, sharing category, sensitivity, retention-review date and hold status, when present and mapped. This supports ownership, sharing, inactivity and retention reviews without a live connection.

Files, membership graphs, inherited permissions, automations, credentials, report layouts, historical audit logs and live scanning do not carry across. No request is sent to Microsoft or Rencore. Enterprise DNA scopes additional migration, authentication and live controls for your version.

## Keep your exit path

```bash
npm run gov -- export --tenant=FIRM --file=exports/current.csv
npm run gov -- export --tenant=FIRM --file=exports/history.json
```

CSV holds current inventory with canonical headings and can be re-imported into an empty scope. JSON holds every snapshot, workspace, review and event for that scope. It is an archive, not a restore command. Use proper database backups for recovery. Files and reports include business metadata and belong in access-controlled storage.
