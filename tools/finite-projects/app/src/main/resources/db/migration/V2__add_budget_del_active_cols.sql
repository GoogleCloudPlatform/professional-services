alter table project_record
    add budget INT;

alter table project_record
    add delete_at timestamp;

update project_record set delete_at=(now() + INTERVAL '90 DAY');

alter table project_record
    alter column delete_at set not null;

alter table project_record
    add active bool default true not null;