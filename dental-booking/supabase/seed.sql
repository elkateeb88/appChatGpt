-- ================================================
-- Dental Booking System - Database Schema & Seed Data
-- ================================================

-- Clean up existing tables (if any)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;

-- ================================================
-- TABLES
-- ================================================

-- Doctors table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    clinic_name VARCHAR(255),
    languages JSONB DEFAULT '["ar", "en"]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    price DECIMAL(10, 2),
    duration_minutes INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    language VARCHAR(5) DEFAULT 'ar',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_phone VARCHAR(20) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    language VARCHAR(5) DEFAULT 'ar',
    collected_data JSONB DEFAULT '{}',
    messages JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    doctor_id UUID REFERENCES doctors(id),
    service_id UUID REFERENCES services(id),
    date DATE NOT NULL,
    time TIME NOT NULL,
    notes TEXT,
    language VARCHAR(5) DEFAULT 'ar',
    status VARCHAR(20) DEFAULT 'pending',
    conversation_id UUID REFERENCES conversations(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_patient_phone ON bookings(patient_phone);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_conversations_patient_phone ON conversations(patient_phone);
CREATE INDEX idx_services_active ON services(is_active);

-- ================================================
-- SEED DATA
-- ================================================

-- Insert sample doctor
INSERT INTO doctors (name, phone, clinic_name, languages, is_active)
VALUES (
    'د. أحمد محمود',
    '972599111222',
    'عيادة الأمل لطب الأسنان',
    '["ar", "en"]',
    true
);

-- Get the doctor ID for the services
DO $$
DECLARE
    doctor_uuid UUID;
BEGIN
    SELECT id INTO doctor_uuid FROM doctors WHERE phone = '972599111222';

    -- Insert sample services
    INSERT INTO services (doctor_id, name_ar, name_en, description_ar, description_en, price, duration_minutes, is_active)
    VALUES
    (
        doctor_uuid,
        'فحص وتشخيص',
        'Examination & Diagnosis',
        'فحص شامل للفم والأسنان مع التشخيص والاستشارة',
        'Comprehensive oral examination with diagnosis and consultation',
        50.00,
        30,
        true
    ),
    (
        doctor_uuid,
        'تنظيف الأسنان',
        'Teeth Cleaning',
        'تنظيف احترافي للأسنان وإزالة الجير والتصبغات',
        'Professional teeth cleaning, tartar and stain removal',
        100.00,
        45,
        true
    ),
    (
        doctor_uuid,
        'حشوة عادية',
        'Regular Filling',
        'حشوة للأسنان المتضررة من التسوس',
        'Filling for teeth damaged by cavities',
        150.00,
        60,
        true
    ),
    (
        doctor_uuid,
        'خلع سن',
        'Tooth Extraction',
        'خلع سن تالف أو ضرس العقل',
        'Extraction of damaged tooth or wisdom tooth',
        120.00,
        30,
        true
    ),
    (
        doctor_uuid,
        'تبييض الأسنان',
        'Teeth Whitening',
        'تبييض احترافي للأسنان بتقنية حديثة',
        'Professional teeth whitening with modern technology',
        300.00,
        90,
        true
    );
END $$;

-- ================================================
-- VERIFICATION QUERIES (Optional - for testing)
-- ================================================

-- Uncomment to verify the data was inserted correctly:
-- SELECT * FROM doctors;
-- SELECT * FROM services;

-- Show services with doctor information:
-- SELECT
--     s.name_ar,
--     s.name_en,
--     s.price,
--     s.duration_minutes,
--     d.name as doctor_name,
--     d.clinic_name
-- FROM services s
-- JOIN doctors d ON s.doctor_id = d.id
-- WHERE s.is_active = true;
