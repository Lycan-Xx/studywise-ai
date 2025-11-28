-- ============================================================================
-- CREATE TEST USER FOR DEVELOPMENT
-- ============================================================================
-- This script creates a test user in auth.users and user_profiles
-- Run this in Supabase SQL Editor to enable testing without real authentication
-- ============================================================================

-- Create a test user in auth.users (if not exists)
-- Note: This uses a fixed UUID for consistency
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test@studywise.ai',
  crypt('test-password-123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Test User"}'::jsonb,
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Create corresponding user profile
INSERT INTO public.user_profiles (
  id,
  email,
  full_name,
  default_question_type,
  default_difficulty,
  default_questions_per_module,
  show_test_preview_modal,
  theme
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test@studywise.ai',
  'Test User',
  'mixed',
  'medium',
  10,
  true,
  'light'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- Verify the user was created
SELECT 
  'Test user created successfully!' as message,
  id,
  email,
  created_at
FROM auth.users
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Show user profile
SELECT 
  'User profile created!' as message,
  id,
  email,
  full_name,
  default_question_type,
  default_difficulty
FROM public.user_profiles
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- After running this script:
-- 1. In your browser console, run: localStorage.setItem('userId', '00000000-0000-0000-0000-000000000001');
-- 2. Refresh the page
-- 3. Try uploading a file again
-- 
-- The user ID '00000000-0000-0000-0000-000000000001' will now work with the foreign key constraints!
-- ============================================================================
