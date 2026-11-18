-- Local numbers with an Israeli-only prefix can only belong to +972.
UPDATE users
SET phone_number = '+972' || substring(phone_number FROM 2)
WHERE phone_number ~ '^05(0|2|3|4|5|8)[0-9]{7}$';

-- 056/059 are ambiguous; +970 is the default, as in the registration form.
UPDATE users
SET phone_number = '+970' || substring(phone_number FROM 2)
WHERE phone_number ~ '^05(6|9)[0-9]{7}$';
