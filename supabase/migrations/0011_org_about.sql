-- 0011_org_about.sql — organization description for the org profile page.
alter table organizations add column if not exists about text;
