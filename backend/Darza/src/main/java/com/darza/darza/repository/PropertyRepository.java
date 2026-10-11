package com.darza.darza.repository;

import com.darza.darza.entity.Property;
import com.darza.darza.enums.PostingStatus;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Pageable;
import java.util.Optional;

public interface PropertyRepository extends JpaRepository<Property,Long> {
    @Override
    @EntityGraph(attributePaths = {"town","town.city","approvedBy","createdBy"})
    Optional<Property> findById(Long aLong);

    @EntityGraph(attributePaths = {"town","town.city","createdBy"})
    Slice<Property> findAllByPostingStatusAndIsAvailableTrueOrderByApprovedAtDesc(PostingStatus postingStatus, Pageable pageable);

    @EntityGraph(attributePaths = {"town","town.city"})
    Slice<Property> findAllByCreatedByIdAndPostingStatusOrderByApprovedAtDesc(Long createdBy,PostingStatus postingStatus, Pageable pageable);

    @EntityGraph(attributePaths = {"town","town.city"})
    Slice<Property> findAllByCreatedByIdOrderByCreatedAtDesc(Long createdBy,Pageable pageable);

    @EntityGraph(attributePaths = {"town","town.city","createdBy"})
    Slice<Property> findAllByPostingStatusOrderByCreatedAtAsc(PostingStatus postingStatus, Pageable pageable);
}
