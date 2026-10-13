package com.darza.darza.dto.townDtos;

public record DetailedTownResponse(
        Long townId,
        String townName,
        Long cityId,
        String cityName
) {
}
