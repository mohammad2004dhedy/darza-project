package com.darza.darza.dto.authDtos;

import com.darza.darza.dto.propertyDtos.PropertyCardResponse;
import com.darza.darza.dto.townDtos.TownResponse;

import java.time.Instant;
import java.util.List;

public record MyProfileResponse(
        Long id,
        String displayName,
        String phoneNumber,
        String email,
        String address,
        TownResponse town,
        String profileImageUrl,
        Instant createdAt
) {
}
