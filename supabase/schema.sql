create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    name text not null,
    role text not null default 'voluntario' check (role in ('admin', 'voluntario')),
    created_at timestamptz not null default now()
);

create table if not exists public.donations (
    id uuid primary key default gen_random_uuid(),
    description text not null,
    category text not null check (category in ('alimentos', 'roupas', 'higiene', 'brinquedos', 'outros')),
    quantity numeric(10,2) not null check (quantity > 0),
    unit text not null check (unit in ('un', 'kg', 'pacote', 'caixa', 'litro', 'metro', 'outro')),
    entry_date date not null default current_date,
    condition text not null check (condition in ('novo', 'bom', 'usado', 'necessita_atencao')),
    expiration_date date,
    donor_name text default 'Anônimo',
    notes text,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

create table if not exists public.destinations (
    id uuid primary key default gen_random_uuid(),
    donation_id uuid not null references public.donations(id) on delete cascade,
    quantity numeric(10,2) not null check (quantity > 0),
    destination_date date not null default current_date,
    destination_target text not null,
    notes text,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

create table if not exists public.needs (
    id uuid primary key default gen_random_uuid(),
    description text not null,
    category text not null check (category in ('alimentos', 'roupas', 'higiene', 'brinquedos', 'outros')),
    priority text not null check (priority in ('alta', 'media', 'baixa')),
    status text not null default 'aberta' check (status in ('aberta', 'atendida')),
    notes text,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

create index if not exists idx_donations_category on public.donations(category);
create index if not exists idx_donations_entry_date on public.donations(entry_date);
create index if not exists idx_donations_expiration on public.donations(expiration_date);
create index if not exists idx_destinations_donation_id on public.destinations(donation_id);
create index if not exists idx_destinations_date on public.destinations(destination_date);
create index if not exists idx_needs_status_priority on public.needs(status, priority);

create or replace view public.vw_inventory
with (security_invoker = true)
as
select
    d.id,
    d.description,
    d.category,
    d.quantity as quantity_received,
    coalesce(sum(dst.quantity), 0)::numeric(10,2) as quantity_destined,
    (d.quantity - coalesce(sum(dst.quantity), 0))::numeric(10,2) as quantity_current,
    d.unit,
    d.entry_date,
    d.condition,
    d.expiration_date,
    d.donor_name,
    d.notes,
    d.created_by,
    d.created_at
from public.donations d
left join public.destinations dst on dst.donation_id = d.id
group by d.id;

create or replace function public.is_admin()
returns boolean as $$
begin
    return exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    );
end;
$$ language plpgsql security definer stable;

create or replace function public.fn_check_destination_stock()
returns trigger as $$
declare
    v_received numeric(10,2);
    v_destined numeric(10,2);
begin
    select quantity into v_received
    from public.donations
    where id = NEW.donation_id;

    if not found then
        raise exception 'Doação referenciada não foi encontrada.';
    end if;

    select coalesce(sum(quantity), 0) into v_destined
    from public.destinations
    where donation_id = NEW.donation_id
      and id != coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    if (v_destined + NEW.quantity) > v_received then
        raise exception 'Quantidade de destinação (%.2f) excede o saldo disponível em estoque (%.2f).',
            NEW.quantity, (v_received - v_destined);
    end if;

    return NEW;
end;
$$ language plpgsql;

drop trigger if exists tr_check_destination_stock on public.destinations;
create trigger tr_check_destination_stock
before insert or update on public.destinations
for each row
execute function public.fn_check_destination_stock();

create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, name, role)
    values (
        NEW.id,
        coalesce(NEW.email, ''),
        coalesce(NEW.raw_user_meta_data->>'name', split_part(coalesce(NEW.email, 'Usuário'), '@', 1)),
        coalesce(NEW.raw_user_meta_data->>'role', 'voluntario')
    )
    on conflict (id) do update set
        email = excluded.email,
        name = coalesce(excluded.name, profiles.name);
    return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.donations enable row level security;
alter table public.destinations enable row level security;
alter table public.needs enable row level security;

drop policy if exists "Perfis são legíveis por usuários autenticados" on public.profiles;
create policy "Perfis são legíveis por usuários autenticados"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Usuário edita seu próprio perfil ou admin edita qualquer um" on public.profiles;
create policy "Usuário edita seu próprio perfil ou admin edita qualquer um"
on public.profiles for update
to authenticated
using (auth.uid() = id or public.is_admin())
with check (
    case
        when public.is_admin() then true
        else (role = (select role from public.profiles where id = auth.uid()))
    end
);

drop policy if exists "Doações legíveis por usuários autenticados" on public.donations;
create policy "Doações legíveis por usuários autenticados"
on public.donations for select
to authenticated
using (true);

drop policy if exists "Usuários autenticados podem inserir doações" on public.donations;
create policy "Usuários autenticados podem inserir doações"
on public.donations for insert
to authenticated
with check (true);

drop policy if exists "Usuários autenticados podem atualizar doações" on public.donations;
create policy "Usuários autenticados podem atualizar doações"
on public.donations for update
to authenticated
using (true);

drop policy if exists "Apenas administradores podem excluir doações" on public.donations;
create policy "Apenas administradores podem excluir doações"
on public.donations for delete
to authenticated
using (public.is_admin());

-- 3. POLÍTICAS: DESTINATIONS
drop policy if exists "Destinações legíveis por usuários autenticados" on public.destinations;
create policy "Destinações legíveis por usuários autenticados"
on public.destinations for select
to authenticated
using (true);

drop policy if exists "Usuários autenticados podem registrar destinações" on public.destinations;
create policy "Usuários autenticados podem registrar destinações"
on public.destinations for insert
to authenticated
with check (true);

drop policy if exists "Usuários autenticados podem atualizar destinações" on public.destinations;
create policy "Usuários autenticados podem atualizar destinações"
on public.destinations for update
to authenticated
using (true);

drop policy if exists "Apenas administradores podem excluir destinações" on public.destinations;
create policy "Apenas administradores podem excluir destinações"
on public.destinations for delete
to authenticated
using (public.is_admin());

-- 4. POLÍTICAS: NEEDS
drop policy if exists "Necessidades legíveis por usuários autenticados" on public.needs;
create policy "Necessidades legíveis por usuários autenticados"
on public.needs for select
to authenticated
using (true);

drop policy if exists "Usuários autenticados podem criar necessidades" on public.needs;
create policy "Usuários autenticados podem criar necessidades"
on public.needs for insert
to authenticated
with check (true);

drop policy if exists "Usuários autenticados podem atualizar necessidades" on public.needs;
create policy "Usuários autenticados podem atualizar necessidades"
on public.needs for update
to authenticated
using (true);

drop policy if exists "Apenas administradores podem excluir necessidades" on public.needs;
create policy "Apenas administradores podem excluir necessidades"
on public.needs for delete
to authenticated
using (public.is_admin());
