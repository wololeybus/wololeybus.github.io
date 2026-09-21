-- Enable pg_cron and pg_net in the Supabase dashboard first.
-- Create these two Vault secrets in the dashboard (never commit their values):
-- calendar_function_url: https://PROJECT.supabase.co/functions/v1/course-calendar
-- calendar_worker_secret: same value as the CALENDAR_WORKER_SECRET Edge secret
do $$
begin
  if not exists(select 1 from vault.decrypted_secrets where name='calendar_function_url' and decrypted_secret ~ '^https://[a-z0-9-]+\.supabase\.co/functions/v1/course-calendar$')
     or not exists(select 1 from vault.decrypted_secrets where name='calendar_worker_secret' and length(decrypted_secret)>=32) then
    raise exception 'Configure calendar_function_url and calendar_worker_secret in Vault first';
  end if;
end $$;

select cron.schedule(
  'course-calendar-delivery',
  '*/5 * * * *',
  $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name='calendar_function_url'),
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'x-calendar-worker-secret',(select decrypted_secret from vault.decrypted_secrets where name='calendar_worker_secret')
      ),
      body := '{"action":"deliver"}'::jsonb,
      timeout_milliseconds := 120000
    );
  $job$
);
