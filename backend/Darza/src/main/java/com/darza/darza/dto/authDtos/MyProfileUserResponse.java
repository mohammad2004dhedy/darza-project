package com.darza.darza.dto.authDtos;

import com.darza.darza.dto.townDtos.DetailedTownResponse;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MyProfileUserResponse(
        Long id,
        String displayName,
        String phoneNumber,
        String email,
        String address,
        DetailedTownResponse town,
        String profileImageUrl,
        Instant createdAt
) {
}
