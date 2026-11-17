ALTER TABLE property_images
    ADD CONSTRAINT uq_property_images_image_path UNIQUE (image_path);
