-- Source record for the applied secure_school_admin_management migration.
-- This function is only executable by service_role. The Edge Function must verify
-- the caller's authenticated session, active school-admin membership, password,
-- school ID, and exact RESET:<school_code> phrase before invoking it.
create or replace function public.reset_school_welfare_data(
  p_school_id uuid,
  p_actor_user_id uuid,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_school_code text;
  v_school_name text;
  v_teacher_count integer := 0;
  v_contribution_count integer := 0;
  v_payout_count integer := 0;
  v_reversal_count integer := 0;
begin
  select s.school_code, s.name
    into v_school_code, v_school_name
  from public.schools s
  where s.id = p_school_id
    and s.status = 'active';

  if v_school_code is null then
    raise exception 'Active school not found';
  end if;

  if p_confirmation is distinct from ('RESET:' || v_school_code) then
    raise exception 'Confirmation phrase does not match the selected school';
  end if;

  if not exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = p_actor_user_id
      and pa.school_id = p_school_id
      and pa.active = true
  ) then
    raise exception 'Active administrator authorization required';
  end if;

  delete from public.transaction_reversals r where r.school_id = p_school_id;
  get diagnostics v_reversal_count = row_count;

  delete from public.payouts p where p.school_id = p_school_id;
  get diagnostics v_payout_count = row_count;

  delete from public.contributions c where c.school_id = p_school_id;
  get diagnostics v_contribution_count = row_count;

  delete from public.teachers t where t.school_id = p_school_id;
  get diagnostics v_teacher_count = row_count;

  insert into public.audit_logs (
    id, actor_name, category, action, details, status, time_string, school_id
  )
  select
    gen_random_uuid()::text,
    coalesce(pa.name, pa.username, 'School administrator'),
    'Welfare portal',
    'RESET_SCHOOL_WELFARE_DATA',
    format(
      'School-scoped reset completed for %s (%s). Removed %s members, %s contributions, %s payouts and %s reversal records. Audit history preserved.',
      v_school_name, v_school_code, v_teacher_count, v_contribution_count,
      v_payout_count, v_reversal_count
    ),
    'success',
    to_char(clock_timestamp(), 'YYYY-MM-DD HH12:MI:SS PM'),
    p_school_id
  from public.platform_admins pa
  where pa.user_id = p_actor_user_id
    and pa.school_id = p_school_id
    and pa.active = true
  limit 1;

  return jsonb_build_object(
    'success', true,
    'school_code', v_school_code,
    'members_removed', v_teacher_count,
    'contributions_removed', v_contribution_count,
    'payouts_removed', v_payout_count,
    'reversals_removed', v_reversal_count,
    'audit_history_preserved', true
  );
end;
$function$;

revoke all on function public.reset_school_welfare_data(uuid, uuid, text) from public;
revoke all on function public.reset_school_welfare_data(uuid, uuid, text) from anon;
revoke all on function public.reset_school_welfare_data(uuid, uuid, text) from authenticated;
grant execute on function public.reset_school_welfare_data(uuid, uuid, text) to service_role;
