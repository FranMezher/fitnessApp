-- Migration: Profile table update for FITCORE redesign (2026-05-21)
-- Aligns backend schema with new onboarding flow from Stitch design system.

ALTER TABLE profiles
  -- Step 03: Strength level replaces boolean strengthTraining
  ADD COLUMN IF NOT EXISTS strength_level      TEXT,

  -- Step 04: Activity level values change (old: none/1-2/3-4/5-6/daily)
  --          New values: sedentary/lightly_active/active/very_active
  --          Column keeps the same name; app sends new values going forward.

  -- Step 05: Lifestyle — new fields (replaces lifestyle_type)
  ADD COLUMN IF NOT EXISTS sleep_hours         NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS stress_level        SMALLINT CHECK (stress_level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS smoking_habit       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alcohol_habit       BOOLEAN NOT NULL DEFAULT false,

  -- Step 06: Target weight was in biometrics; weight_loss_speed renames
  --          (column already exists as weight_loss_speed, new values: sostenible/moderado/agresivo)

  -- Step 07: Diet type replaces food_variety (single string → array)
  ADD COLUMN IF NOT EXISTS diet_type           TEXT[],

  -- Step 09: Meal planning replaces old meal_planning string
  ADD COLUMN IF NOT EXISTS meal_frequency      SMALLINT DEFAULT 3 CHECK (meal_frequency BETWEEN 2 AND 5),
  ADD COLUMN IF NOT EXISTS cooking_time        TEXT;

-- Drop columns no longer used by the app
ALTER TABLE profiles
  DROP COLUMN IF EXISTS strength_training,
  DROP COLUMN IF EXISTS lifestyle_type,
  DROP COLUMN IF EXISTS food_variety,
  DROP COLUMN IF EXISTS meal_planning;

-- Index for common filter: goal + activity_level
CREATE INDEX IF NOT EXISTS idx_profiles_goal ON profiles (goal);
CREATE INDEX IF NOT EXISTS idx_profiles_activity ON profiles (activity_level);

COMMENT ON COLUMN profiles.strength_level   IS 'beginner | intermediate | advanced | pro_athlete';
COMMENT ON COLUMN profiles.sleep_hours      IS 'Average hours of sleep per night (6–10)';
COMMENT ON COLUMN profiles.stress_level     IS '1=Low ... 5=Extreme';
COMMENT ON COLUMN profiles.diet_type        IS 'Array: omnivore | vegetarian | vegan | keto | paleo | mediterranean';
COMMENT ON COLUMN profiles.meal_frequency   IS 'Number of meals per day (2–5)';
COMMENT ON COLUMN profiles.cooking_time     IS 'quick | home_cook | chef';
