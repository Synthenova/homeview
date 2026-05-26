create or replace view crm_contact_queries as
select
  q.*,
  count(*) over (partition by lower(q.email))::int as email_request_count,
  row_number() over (partition by lower(q.email) order by q.created_at desc)::int as email_request_rank
from contact_queries q;
