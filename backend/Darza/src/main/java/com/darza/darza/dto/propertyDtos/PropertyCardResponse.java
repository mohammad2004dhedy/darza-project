package com.darza.darza.dto.propertyDtos;

import com.darza.darza.dto.authDtos.PropertyUserResponse;
import com.darza.darza.dto.townDtos.PropertyTownResponse;
import com.darza.darza.enums.*;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PropertyCardResponse(
    Long id,
    String title,
    PropertyType propertyType,
    ListingType listingType,
    PostingStatus postingStatus,
    String rejectionReason,
    RentPeriod rentPeriod,
    BigDecimal price,
    Currency currency,
    PropertyTownResponse town,
    Boolean isAvailable,
    Instant approvedAt,
    PropertyUserResponse user,
    String coverImageUrl
) {
}
