package com.darza.darza.dto.authDtos;

import com.darza.darza.dto.propertyDtos.PropertyCardResponse;
import com.darza.darza.dto.townDtos.TownResponse;

import java.time.Instant;
import java.util.List;

public record PublicUserProfileResponse(
        Long id,
        String displayName,
        String phoneNumber,
        TownResponse town,
        String profileImageUrl,
        Instant createdAt
) {
}
