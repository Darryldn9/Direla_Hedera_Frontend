-- Migration: Add smart_contract_agreement_id column to bnpl_terms table
-- Created: 2024-12-20
-- Description: Adds a column to store the smart contract agreement ID when BNPL terms are accepted

-- Add the smart_contract_agreement_id column to bnpl_terms table
ALTER TABLE public.bnpl_terms 
ADD COLUMN smart_contract_agreement_id TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN public.bnpl_terms.smart_contract_agreement_id IS 'Smart contract agreement ID returned when BNPL terms are accepted and executed on the blockchain';

-- Create an index on the new column for better query performance
CREATE INDEX idx_bnpl_terms_smart_contract_agreement_id 
ON public.bnpl_terms(smart_contract_agreement_id);

-- Add a check constraint to ensure the agreement ID is a valid format (if needed)
-- This assumes agreement IDs are non-empty strings when present
ALTER TABLE public.bnpl_terms 
ADD CONSTRAINT chk_smart_contract_agreement_id_not_empty 
CHECK (smart_contract_agreement_id IS NULL OR LENGTH(TRIM(smart_contract_agreement_id)) > 0);
