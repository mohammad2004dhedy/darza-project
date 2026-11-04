package com.darza.darza.repository;

import com.darza.darza.entity.Property;
import com.darza.darza.enums.PostingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface PropertyRepository extends JpaRepository<Property,Long>, JpaSpecificationExecutor<Property> {
    @Override
    @EntityGraph(attributePaths = {"town","town.city","createdBy"})
    Optional<Property> findById(Long aLong);

    @Override
    @EntityGraph(attributePaths = {"town", "town.city", "createdBy"})
    Page<Property> findAll(Specification<Property> spec, Pageable pageable);
    List<Property> findAllByCreatedById(Long userId);
    boolean existsByTownId(Long townId);

    @EntityGraph(attributePaths = {"town","town.city","createdBy"})
    Slice<Property> findAllByPostingStatusAndIsAvailableTrueOrderByApprovedAtDesc(PostingStatus postingStatus, Pageable pageable);

    @EntityGraph(attributePaths = {"town","town.city","createdBy"})
    Slice<Property> findAllByCreatedByIdAndPostingStatusOrderByApprovedAtDesc(Long createdBy,PostingStatus postingStatus, Pageable pageable);

    @EntityGraph(attributePaths = {"town","town.city","createdBy"})
    Slice<Property> findAllByCreatedByIdOrderByCreatedAtDesc(Long createdBy,Pageable pageable);

    @EntityGraph(attributePaths = {"town","town.city","createdBy"})
    Slice<Property> findAllByPostingStatusOrderByUpdatedAtAsc(PostingStatus postingStatus, Pageable pageable);
}
