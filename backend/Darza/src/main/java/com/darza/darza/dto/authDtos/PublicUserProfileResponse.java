package com.darza.darza.dto.authDtos;


import com.darza.darza.dto.townDtos.DetailedTownResponse;
import com.fasterxml.jackson.annotation.JsonInclude;


import java.time.Instant;
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PublicUserProfileResponse(
        Long id,
        String displayName,
        String phoneNumber,
        DetailedTownResponse town,
        String profileImageUrl,
        Instant createdAt
) {
}
