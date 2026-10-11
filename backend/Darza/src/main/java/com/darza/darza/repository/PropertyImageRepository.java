package com.darza.darza.repository;

import com.darza.darza.entity.PropertyImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PropertyImageRepository extends JpaRepository<PropertyImage,Long> {
    List<PropertyImage> findAllByPropertyIdOrderByIdAsc(Long propertyId);
    List<PropertyImage> findAllByPropertyIdInOrderByIdAsc(Collection<Long> propertyIds);
}
