CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_feature_access_type AS ENUM (
    'sitter',
    'owner'
);

CREATE TABLE users (
    id uuid primary key,
    email text not null,
    "password" text not null,
    first_name text not null,
    last_name text not null,
    user_type user_feature_access_type[2],
    profile_picture text,
    contact text not null,
    date_of_birth date not null,
    experience text,
    qualifications text,
);

CREATE TABLE locations (
    id uuid primary key,
    user_id uuid references users (id),
    "address" text not null,
    city text check (city = 'new york'),
    country text check (country = 'united states'),
    default_location boolean default FALSE,
);

CREATE TABLE pets (
    id uuid primary key,
    owner_id uuid references users (id),
    name text not null,
    species text,
    color text,
    height text,
    breed text not null,
    "weight" text not null,
    picures text[],
    chip_number text,
    health_requirements text,
);

CREATE TYPE job_status AS ENUM (
    'open',
    'job_acceptance_pending',
    'acceptance_complete',
    'job_ongoing',
    'job_complete',
    'cancelled',
    'removed'
);

CREATE TABLE jobs (
    id uuid primary key,
    pet_id uuid references pets (id),
    user_id uuid references users (id),
    "status" job_status not null,
    pay not null,
    "start" timestamptz not null,
    "end" timestamptz not null,
    location_id uuid references locations (id),
);

CREATE TYPE application_status AS ENUM (
    'rejected',
    'accepted'
);

CREATE TABLE applications (
    id uuid primary key,
    job_id uuid references jobs (id),
    user_id uuid references users (id),
    "status" application_status not null,
    details jsonb,
);
