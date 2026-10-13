package com.darza.darza.dto.authDtos;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PropertyUserResponse(
        Long id,
        String displayName,
        String profileImageUrl,
        String phoneNumber
) {
}
