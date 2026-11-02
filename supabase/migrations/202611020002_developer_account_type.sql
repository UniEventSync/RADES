-- Run and commit this file by itself. PostgreSQL does not allow a new enum
-- label to be used until the transaction adding it has committed.
alter type public.account_type add value if not exists 'developer';
