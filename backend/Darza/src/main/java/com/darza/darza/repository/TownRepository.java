package com.darza.darza.repository;

import com.darza.darza.entity.Town;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TownRepository extends JpaRepository<Town,Long> {
    List<Town> findAllByCityIdOrderByName(Long cityId);
}
