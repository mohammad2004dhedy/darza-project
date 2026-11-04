package com.darza.darza.dto.authDtos;


import java.time.Instant;

public record LoginResponse(
        String token,
        String displayName,
        String role,
        Instant expiresAt
) {
}
