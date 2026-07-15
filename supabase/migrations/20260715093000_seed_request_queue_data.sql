DO $$
DECLARE
    user1_id uuid := '11111111-1111-1111-1111-111111111111';
    user2_id uuid := '22222222-2222-2222-2222-222222222222';
    user3_id uuid := '33333333-3333-3333-3333-333333333333';
    med1_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    med2_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    med3_id uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
BEGIN
    -- Insert auth users if they do not exist
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user1_id) THEN
        INSERT INTO auth.users (id, phone, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
        VALUES (user1_id, '+639111111111', extensions.crypt('password123', extensions.gen_salt('bf', 10)), now(), '{"provider":"phone","providers":["phone"]}', '{}', false, 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user2_id) THEN
        INSERT INTO auth.users (id, phone, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
        VALUES (user2_id, '+639222222222', extensions.crypt('password123', extensions.gen_salt('bf', 10)), now(), '{"provider":"phone","providers":["phone"]}', '{}', false, 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user3_id) THEN
        INSERT INTO auth.users (id, phone, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
        VALUES (user3_id, '+639333333333', extensions.crypt('password123', extensions.gen_salt('bf', 10)), now(), '{"provider":"phone","providers":["phone"]}', '{}', false, 'authenticated');
    END IF;

    -- Update the user profiles (which were automatically created by trigger)
    UPDATE public.user_profiles SET full_name = 'Juan Dela Cruz', birthdate = '1955-06-15', age = 71, verification_status = 'APPROVED' WHERE id = user1_id;
    UPDATE public.user_profiles SET full_name = 'Maria Santos', birthdate = '1960-03-22', age = 66, verification_status = 'APPROVED' WHERE id = user2_id;
    UPDATE public.user_profiles SET full_name = 'Tomas Concepcion', birthdate = '1948-11-05', age = 77, verification_status = 'APPROVED' WHERE id = user3_id;

    -- Ensure addresses exist
    INSERT INTO public.user_addresses (user_id, street, barangay, municipality, province, region, zip_code, latitude, longitude)
    VALUES 
    (user1_id, 'Poblacion Street', 'Santa Cruz', 'San Luis', 'Pampanga', 'Region III', '2014', 15.0253, 120.7854),
    (user2_id, 'Rizal Street', 'San Sebastian', 'San Luis', 'Pampanga', 'Region III', '2014', 15.0260, 120.7860),
    (user3_id, 'MacArthur Highway', 'Santo Rosario', 'San Luis', 'Pampanga', 'Region III', '2014', 15.0240, 120.7840)
    ON CONFLICT DO NOTHING;

    -- Insert medicines
    INSERT INTO public.medicines (id, name, generic_name, description, dosage_strength, unit, usage_instructions, available_quantity, is_active)
    VALUES 
    (med1_id, 'Paracetamol', 'Paracetamol', 'Pain reliever and fever reducer', '500mg', 'Tablet', 'Take 1 tablet every 4 hours as needed', 500, true),
    (med2_id, 'Amoxicillin', 'Amoxicillin', 'Antibiotic for bacterial infections', '500mg', 'Capsule', 'Take 3 times a day for 7 days', 300, true),
    (med3_id, 'Losartan Potassium', 'Losartan Potassium', 'Treatment for high blood pressure', '50mg', 'Tablet', 'Take 1 tablet daily in the morning', 250, true)
    ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        available_quantity = EXCLUDED.available_quantity,
        is_active = true;

    -- Insert medicine requests in pending, approved, and rejected states
    INSERT INTO public.medicine_requests (user_id, medicine_id, quantity, reason, status, request_date)
    VALUES
    (user1_id, med1_id, 20, 'Frequent headaches and mild fever', 'PENDING', now() - interval '2 hours'),
    (user2_id, med2_id, 21, 'Prescribed antibiotic treatment for throat infection', 'APPROVED', now() - interval '1 day'),
    (user3_id, med3_id, 30, 'Daily maintenance medication for hypertension', 'REJECTED', now() - interval '2 days'),
    (user1_id, med3_id, 60, 'Monthly supply for maintenance', 'COMPLETED', now() - interval '3 days')
    ON CONFLICT DO NOTHING;
END $$;
