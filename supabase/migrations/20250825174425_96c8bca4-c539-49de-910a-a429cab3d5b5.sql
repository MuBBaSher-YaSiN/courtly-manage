-- First update cases to remove references to demo users that don't exist in auth
UPDATE cases SET assigned_judge_id = NULL 
WHERE assigned_judge_id IN (
    SELECT id FROM users WHERE auth_user_id IN (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222', 
        '33333333-3333-3333-3333-333333333333',
        '44444444-4444-4444-4444-444444444444'
    )
);

-- Update other tables with references to demo users
UPDATE cases SET created_by_id = (SELECT id FROM users WHERE email = 'iqraf683@gmail.com' LIMIT 1)
WHERE created_by_id IN (
    SELECT id FROM users WHERE auth_user_id IN (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222', 
        '33333333-3333-3333-3333-333333333333',
        '44444444-4444-4444-4444-444444444444'
    )
);

-- Delete related data
DELETE FROM case_participants WHERE user_id IN (
    SELECT id FROM users WHERE auth_user_id IN (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222', 
        '33333333-3333-3333-3333-333333333333',
        '44444444-4444-4444-4444-444444444444'
    )
);

-- Now delete the demo users
DELETE FROM users WHERE auth_user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222', 
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
);