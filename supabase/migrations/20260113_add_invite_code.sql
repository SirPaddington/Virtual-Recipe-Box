-- Add invite_code to households
ALTER TABLE public.households 
ADD COLUMN invite_code text UNIQUE;

-- Function to generate 8-char random code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text AS $$
DECLARE
  chars text[] := '{A,B,C,D,E,F,G,H,J,K,L,M,N,P,Q,R,S,T,U,V,W,X,Y,Z,2,3,4,5,6,7,8,9}';
  result text := '';
  i integer := 0;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || chars[1+random()*(array_length(chars, 1)-1)];
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Populate existing households
UPDATE public.households 
SET invite_code = generate_invite_code() 
WHERE invite_code IS NULL;

-- Make it required for future
ALTER TABLE public.households 
ALTER COLUMN invite_code SET NOT NULL;

-- Index for fast lookup
CREATE INDEX idx_households_invite_code ON public.households(invite_code);
