package com.darza.darza.repository;

import com.darza.darza.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Long> {
    @EntityGraph(attributePaths={"town","town.city"})
     Optional<User> findByEmail(String email);
     boolean existsByEmail(String email);

    @Override
    @EntityGraph(attributePaths = {"town","town.city"})
    Optional<User> findById(Long aLong);
}
