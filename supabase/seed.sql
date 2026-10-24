insert into tenants(id,code,name,jurisdiction) values('10000000-0000-4000-8000-000000000001','DEMO','Kauri Advisory demo','NZ'),('10000000-0000-4000-8000-000000000002','SOUTH','Southern Advisory demo','AU') on conflict do nothing;
insert into snapshots(id,tenant_id,source_on,fingerprint,source_name,imported_by,row_count) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',current_date-7,'demo-current','Fictional demo','Demo author',5),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',current_date-45,'demo-south','Fictional demo','Demo author',1) on conflict do nothing;
insert into workspaces(id,snapshot_id,external_id,name,service,owner_name,last_activity_on,sharing,sensitivity,retention_review_on,legal_hold) values
 ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','TEAM-01','Client delivery','Teams','Aroha',current_date-8,'external','confidential',current_date-2,'no'),
 ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','SITE-02','Legacy projects','SharePoint',null,current_date-150,'anonymous','internal',current_date-20,'yes'),
 ('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','TEAM-03','Client planning','Teams','Mere',current_date-10,'internal','internal',current_date+90,'no'),
 ('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000001','BI-04','Forecast reporting','PowerBI','Tama',null,'unknown','unknown',null,'unknown'),
 ('30000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000001','SITE-05','Archived strategy','SharePoint','Aroha',current_date-200,'internal','restricted',current_date+30,'no'),
 ('30000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000002','TEAM-01','Southern delivery','Teams','Alex',current_date-50,'internal','internal',current_date+30,'no') on conflict do nothing;
insert into reviews(id,workspace_id,kind,reviewer,due_on,opened_by) values('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','sharing','Mere',current_date-3,'Aroha') on conflict do nothing;
