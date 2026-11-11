ALTER TABLE properties
    DROP CONSTRAINT properties_rent_period_check,
    ADD CONSTRAINT properties_rent_period_check
        CHECK (rent_period IN ('HOURLY', 'DAILY', 'MONTHLY', 'YEARLY'));
