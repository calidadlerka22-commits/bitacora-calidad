-- Configuración inicial de sincronización para Bitácora de Calidad.
-- Ejecuta este archivo completo en Supabase > SQL Editor > New query.
-- Solo usuarios autenticados pueden leer o modificar la fila compartida.
-- Desactiva el registro público de usuarios en Authentication > Settings.

create table if not exists public.bitacora_state (
  id integer primary key check (id = 1),
  payload jsonb not null default '{"claims":[],"catalog":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.bitacora_state enable row level security;

grant select, insert, update on public.bitacora_state to authenticated;

drop policy if exists "bitacora_state_select_authenticated" on public.bitacora_state;
create policy "bitacora_state_select_authenticated"
  on public.bitacora_state
  for select
  to authenticated
  using (true);

drop policy if exists "bitacora_state_insert_authenticated" on public.bitacora_state;
create policy "bitacora_state_insert_authenticated"
  on public.bitacora_state
  for insert
  to authenticated
  with check (auth.uid() = updated_by);

drop policy if exists "bitacora_state_update_authenticated" on public.bitacora_state;
create policy "bitacora_state_update_authenticated"
  on public.bitacora_state
  for update
  to authenticated
  using (true)
  with check (auth.uid() = updated_by);

insert into public.bitacora_state (id, payload)
values (1, '{"claims":[],"catalog":[]}'::jsonb)
on conflict (id) do nothing;
