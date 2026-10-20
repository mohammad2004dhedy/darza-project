package com.darza.darza.dto.authDtos;

import com.darza.darza.enums.Role;

import java.time.Instant;

public record LoginResponse(
        String token,
        String displayName,
        Role role,
        Instant expiresAt
) {
}
