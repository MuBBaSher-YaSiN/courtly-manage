-- Drop foreign key constraints temporarily to clean up data
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_assigned_judge_id_fkey;
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_created_by_id_fkey;
ALTER TABLE hearings DROP CONSTRAINT IF EXISTS hearings_created_by_id_fkey;
ALTER TABLE filings DROP CONSTRAINT IF EXISTS filings_submitted_by_id_fkey;
ALTER TABLE filings DROP CONSTRAINT IF EXISTS filings_reviewed_by_id_fkey;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_uploaded_by_id_fkey;

-- Clean up all demo user references
DELETE FROM case_participants WHERE user_id IN (
    SELECT id FROM users WHERE auth_user_id IN (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222', 
        '33333333-3333-3333-3333-333333333333',
        '44444444-4444-4444-4444-444444444444'
    )
);

-- Update all references to real users or NULL
UPDATE cases SET assigned_judge_id = NULL, created_by_id = (SELECT id FROM users WHERE email = 'iqraf683@gmail.com' LIMIT 1);
UPDATE hearings SET created_by_id = (SELECT id FROM users WHERE email = 'iqraf683@gmail.com' LIMIT 1);
UPDATE filings SET submitted_by_id = (SELECT id FROM users WHERE email = 'iqraf683@gmail.com' LIMIT 1), reviewed_by_id = NULL;
UPDATE documents SET uploaded_by_id = (SELECT id FROM users WHERE email = 'iqraf683@gmail.com' LIMIT 1);
UPDATE audit_log SET actor_id = NULL WHERE actor_id IN (
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

-- Re-add foreign key constraints
ALTER TABLE cases ADD CONSTRAINT cases_assigned_judge_id_fkey FOREIGN KEY (assigned_judge_id) REFERENCES users(id);
ALTER TABLE cases ADD CONSTRAINT cases_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES users(id);
ALTER TABLE hearings ADD CONSTRAINT hearings_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES users(id);
ALTER TABLE filings ADD CONSTRAINT filings_submitted_by_id_fkey FOREIGN KEY (submitted_by_id) REFERENCES users(id);
ALTER TABLE filings ADD CONSTRAINT filings_reviewed_by_id_fkey FOREIGN KEY (reviewed_by_id) REFERENCES users(id);
ALTER TABLE documents ADD CONSTRAINT documents_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES users(id);