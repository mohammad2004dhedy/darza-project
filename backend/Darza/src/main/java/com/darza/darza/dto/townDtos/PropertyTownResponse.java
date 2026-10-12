package com.darza.darza.dto.townDtos;

public record PropertyTownResponse(
        Long townId,
        String townName,
        Long cityId,
        String cityName
) {
}
