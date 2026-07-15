-- Migration to rename 'REVOKED' status to 'SUSPENDED' in the digital_ids table

-- Update any existing digital_ids with 'REVOKED' status to 'SUSPENDED'
UPDATE public.digital_ids
SET status = 'SUSPENDED'
WHERE status = 'REVOKED';
