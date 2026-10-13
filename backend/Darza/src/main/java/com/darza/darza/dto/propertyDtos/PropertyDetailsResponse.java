package com.darza.darza.dto.propertyDtos;

import com.darza.darza.dto.authDtos.PropertyUserResponse;
import com.darza.darza.dto.townDtos.DetailedTownResponse;
import com.darza.darza.enums.*;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PropertyDetailsResponse(
        Long id,
        String title,
        String description,
        PropertyType propertyType,
        ListingType listingType,
        BigDecimal price,
        Currency currency,
        RentPeriod rentPeriod,
        BigDecimal areaSize,
        Integer rooms,
        Integer bathrooms,
        Boolean furnished,
        Boolean hasBalcony,
        String address,
        BigDecimal latitude,
        BigDecimal longitude,
        DetailedTownResponse town,
        Boolean isAvailable,
        PostingStatus postingStatus,
        String rejectionReason,
        Instant approvedAt,
        PropertyUserResponse user,
        List<String> imageUrls
) {
}
