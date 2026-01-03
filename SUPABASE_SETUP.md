# Configurazione Supabase

Segui questi passaggi per creare il tuo database gratuito.

## 1. Crea il Progetto
1.  Vai su [database.new](https://database.new) (ti chiederà di loggarti con GitHub).
2.  Crea una nuova organizzazione (se richiesto) e un nuovo progetto.
3.  **Database Password**: Scegli una password forte e salvala (non ci servirà subito, ma è importante).
4.  **Region**: Scegli "Frankfurt" (o la più vicina all'Italia).
5.  Clicca su **"Create new project"** e attendi qualche minuto che finisca il setup.

## 2. Esegui lo Script SQL
Una volta pronto il progetto:
1.  Dal menu laterale sinistro, clicca su **SQL Editor**.
2.  Clicca su **New query** (o incolla in quella vuota).
3.  Incolla ESATTAMENTE questo codice SQL:

```sql
-- Abilita estensioni utili
create extension if not exists "uuid-ossp";

-- Tabella Utenti (Team)
create table users (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  role text not null check (role in ('OWNER', 'COACH', 'RENEWALS', 'SUPPORT')),
  email text unique,
  avatar text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabella Studenti
create table students (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text, -- Opzionale come richiesto
  package text not null check (package in ('Silver', 'Gold', 'Platinum', 'Elite', 'Grandmaster')),
  start_date timestamp with time zone default timezone('utc'::text, now()) not null,
  end_date timestamp with time zone,
  coach_id uuid references users(id),
  lessons_done int default 0,
  total_lessons int default 10,
  last_contact_date timestamp with time zone default timezone('utc'::text, now()),
  status text default 'ACTIVE' check (status in ('ACTIVE', 'EXPIRED', 'NOT_RENEWED')),
  difficulty_tags text[] default '{}',
  notes text,
  coach_comment text,
  is_renewed boolean default false,
  renewal_date timestamp with time zone,
  call_booked boolean default false,
  original_coach_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Policy di Sicurezza (Aperta per ora, poi la restringiamo)
alter table users enable row level security;
alter table students enable row level security;

create policy "Public Access Users" on users for all using (true);
create policy "Public Access Students" on students for all using (true);

-- Dati Iniziali (Il tuo Utente Owner)
insert into users (name, role, email) values 
('Matteo', 'OWNER', 'matteo@dtc.com'),
('Coach Test', 'COACH', 'coach@dtc.com'),
('Renewals Team', 'RENEWALS', 'renewals@dtc.com'),
('Supporto', 'SUPPORT', 'support@dtc.com');
```

4.  Clicca su **Run** (bottone verde in basso a destra dell'editor).
5.  Dovrebbe apparire "Success" nei risultati.

## 3. Prendi le Chiavi API
1.  Vai su **Project Settings** (icona ingranaggio in basso a sinistra).
2.  Clicca su **API**.
3.  Copia i valori di:
    *   **Project URL**
    *   **anon public** (tasto "service_role" non ci serve, usa quello "anon").

## 4. Invia i Dati
Crea un file chiamato `.env` nella cartella principale del progetto (`c:\Users\matteop\Desktop\Progetto team dtc\.env`) e incollaci questo:

```env
VITE_SUPABASE_URL=incolla_qui_il_tuo_project_url
VITE_SUPABASE_ANON_KEY=incolla_qui_la_tua_chiave_anon
```

**Salvato il file, dimmelo e procederò a collegare il tutto!**
