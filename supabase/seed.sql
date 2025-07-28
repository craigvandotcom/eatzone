-- Seed data for development environment only
-- Run this in your development Supabase project

-- Create test users (passwords will be set via Supabase Auth)
-- You'll need to create these users via Supabase Auth dashboard or API

-- After creating auth users, their profiles will be auto-created by the trigger

-- Example test data for dev@test.com user
-- First, get the user ID after creating the auth user
-- Then insert sample data:

/*
-- Example foods
INSERT INTO public.foods (user_id, name, timestamp, meal_type, notes) VALUES
  ('user-uuid-here', 'Breakfast Bowl', NOW() - INTERVAL '2 hours', 'breakfast', 'Felt great after this meal'),
  ('user-uuid-here', 'Green Smoothie', NOW() - INTERVAL '4 hours', 'snack', 'Extra spinach today');

-- Example ingredients (replace food_id with actual IDs)
INSERT INTO public.ingredients (food_id, name, zone, food_group, organic) VALUES
  ('food-uuid-here', 'Oatmeal', 'green', 'whole_grains', true),
  ('food-uuid-here', 'Blueberries', 'green', 'fruits', true),
  ('food-uuid-here', 'Almond Butter', 'green', 'nuts_seeds', false);

-- Example symptoms
INSERT INTO public.symptoms (user_id, type, severity, timestamp, notes) VALUES
  ('user-uuid-here', 'energy', 8, NOW() - INTERVAL '1 hour', 'Feeling energized after breakfast'),
  ('user-uuid-here', 'digestive', 2, NOW() - INTERVAL '3 hours', 'Slight bloating');
*/