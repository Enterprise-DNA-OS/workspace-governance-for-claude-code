create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table tenants (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 jurisdiction text not null check(jurisdiction in ('NZ','AU','OTHER')),
 stale_days integer not null default 90 check(stale_days between 1 and 3650),
 refresh_days integer not null default 30 check(refresh_days between 1 and 365),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table snapshots (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants,
 source_on date not null, fingerprint text not null, source_name text not null,
 imported_by text not null, row_count integer not null check(row_count>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_id,source_on,fingerprint)
);
create table workspaces (
 id uuid primary key default gen_random_uuid(), snapshot_id uuid not null references snapshots,
 external_id text not null, name text not null, service text not null check(service in ('Teams','SharePoint','OneDrive','PowerBI','Other')),
 owner_name text, last_activity_on date, sharing text not null check(sharing in ('internal','external','anonymous','unknown')),
 sensitivity text not null check(sensitivity in ('public','internal','confidential','restricted','unknown')),
 retention_review_on date, legal_hold text not null check(legal_hold in ('yes','no','unknown')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(snapshot_id,external_id)
);
create table reviews (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces,
 kind text not null check(kind in ('ownership','sharing','retention','inactivity')),
 reviewer text not null, due_on date not null, opened_by text not null,
 status text not null default 'open' check(status in ('open','decided','complete')),
 decision text check(decision in ('retain','archive','restrict','investigate')),
 decision_evidence text, decided_by text, completion_evidence text, completed_by text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status='open' or (decision is not null and decision_evidence is not null and decided_by is not null)),
 check(status<>'complete' or (completion_evidence is not null and completed_by is not null)),
 check(decided_by is null or lower(decided_by)<>lower(opened_by)),
 check(completed_by is null or lower(completed_by)<>lower(decided_by))
);
create unique index reviews_one_active on reviews(workspace_id,kind) where status<>'complete';
create table events (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants,
 actor text not null, action text not null, record_id uuid, details jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index snapshot_tenant on snapshots(tenant_id,source_on desc,created_at desc);
create index workspace_snapshot on workspaces(snapshot_id);
create index events_tenant on events(tenant_id,created_at);
do $$ declare n text; begin foreach n in array array['tenants','snapshots','workspaces','reviews','events'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated_at()',n);
 execute format('alter table %I enable row level security',n);
 execute format('revoke all on %I from public',n);
end loop; end $$;
create view current_snapshots as select distinct on(tenant_id) * from snapshots order by tenant_id,source_on desc,created_at desc,id desc;
create view workspace_inventory as
 select w.*,s.tenant_id,t.code tenant,t.name tenant_name,t.jurisdiction,s.source_on,t.stale_days,t.refresh_days
 from workspaces w join current_snapshots s on s.id=w.snapshot_id join tenants t on t.id=s.tenant_id;
create view governance_findings as
 select tenant_id,tenant,id workspace_id,external_id,name,'OWNER_MISSING' rule,'No accountable owner recorded' finding from workspace_inventory where owner_name is null
 union all select tenant_id,tenant,id,external_id,name,'ACTIVITY_UNKNOWN','Activity date missing' from workspace_inventory where last_activity_on is null
 union all select tenant_id,tenant,id,external_id,name,'INACTIVE','Activity older than internal threshold' from workspace_inventory where last_activity_on<current_date-stale_days
 union all select tenant_id,tenant,id,external_id,name,'SHARING_REVIEW','External or anonymous sharing recorded' from workspace_inventory where sharing in ('external','anonymous')
 union all select tenant_id,tenant,id,external_id,name,'SHARING_UNKNOWN','Sharing scope missing' from workspace_inventory where sharing='unknown'
 union all select tenant_id,tenant,id,external_id,name,'SENSITIVE_EXTERNAL','Sensitive workspace shared outside business' from workspace_inventory where sharing in ('external','anonymous') and sensitivity in ('confidential','restricted')
 union all select tenant_id,tenant,id,external_id,name,'CLASSIFICATION_UNKNOWN','Sensitivity missing' from workspace_inventory where sensitivity='unknown'
 union all select tenant_id,tenant,id,external_id,name,'RETENTION_REVIEW','Retention review missing or due' from workspace_inventory where retention_review_on is null or retention_review_on<=current_date
 union all select tenant_id,tenant,id,external_id,name,'HOLD_CHECK','Hold status needs confirmation' from workspace_inventory where legal_hold='unknown'
 union all select tenant_id,tenant,id,external_id,name,'SOURCE_STALE','Export older than internal freshness threshold' from workspace_inventory where source_on<current_date-refresh_days;
create view review_register as
 select r.*,w.external_id,w.name,w.legal_hold,s.tenant_id,s.source_on,
 exists(select 1 from current_snapshots c where c.id=s.id) current_snapshot,
 r.status<>'complete' and r.due_on<current_date overdue
 from reviews r join workspaces w on w.id=r.workspace_id join snapshots s on s.id=w.snapshot_id;
