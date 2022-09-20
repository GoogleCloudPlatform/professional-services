create table project_record
(
    id         varchar    not null
        constraint project_record_pk
            primary key,
    dsp_name   varchar    not null,
    rsc_name   varchar    not null,
    created_at timestamp  not null,
    own_name   varchar    not null,
    own_email  varchar not null
);
