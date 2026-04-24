create policy "Authenticated users can read open requests for news feed"
on public.customer_requests
for select
to authenticated
using (status = 'open'::text);

create policy "Authenticated users can read media for open requests for news feed"
on public.customer_request_media
for select
to authenticated
using (
  exists (
    select 1
    from public.customer_requests requests
    where requests.id = customer_request_media.request_id
      and requests.status = 'open'::text
  )
);
