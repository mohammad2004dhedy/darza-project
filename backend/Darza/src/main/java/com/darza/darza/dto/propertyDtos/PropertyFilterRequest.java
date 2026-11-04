package com.darza.darza.dto.propertyDtos;

import com.darza.darza.enums.Currency;
import com.darza.darza.enums.ListingType;
import com.darza.darza.enums.PropertySort;
import com.darza.darza.enums.PropertyType;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PropertyFilterRequest(
        PropertyType propertyType,
        ListingType listingType,
        @PositiveOrZero(message = "اعلى سعر يجب ان يكون صفرا او قيمة موجبة")
        @Digits(integer = 10,fraction = 2)
        BigDecimal maxPrice,
        @PositiveOrZero(message = "اقل سعر يجب ان يكون صفر او قيمة موجبة")
        @Digits(integer = 10,fraction = 2)
        BigDecimal minPrice,
        Currency currency,
        @PositiveOrZero(message = "قيمة الحقل غير صالحة")
        Long cityId,
        @PositiveOrZero(message = "قيمة الحقل غير صالحة")
        Long townId,
        @Size(max = 100,message = "الطول المسموح لنص البحث هو 100 حرف كحد أقصى")
        String text,
        PropertySort sortType,
        @Min(value = 0,message = "قيمة الصفحة غير صالحة")
        Integer page
) {
        public PropertyFilterRequest {
                if (page == null) page = 0;
        }
}
