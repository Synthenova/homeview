alter table crm_contact_statuses
  add column if not exists color text;

update crm_contact_statuses
set color = case name
  when 'new' then '#2563eb'
  when 'engaged' then '#0891b2'
  when 'qualified' then '#7c3aed'
  when 'proposal_sent' then '#ca8a04'
  when 'follow_up' then '#ea580c'
  when 'won' then '#16a34a'
  when 'lost' then '#dc2626'
  when 'archived' then '#6b7280'
  when 'vip_followup' then '#9333ea'
  when 'vip_agent_followup' then '#4f46e5'
  else color
end;

update crm_contact_statuses
set color = '#64748b'
where color is null;
