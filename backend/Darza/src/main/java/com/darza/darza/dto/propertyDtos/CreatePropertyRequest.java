package com.darza.darza.dto.propertyDtos;

import com.darza.darza.enums.Currency;
import com.darza.darza.enums.ListingType;
import com.darza.darza.enums.PropertyType;
import com.darza.darza.enums.RentPeriod;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public record CreatePropertyRequest(
        @NotBlank(message = "يجب ادخال عنوان")
        @Size(max = 150,message = "نص العنوان يجب ان لا يتخطى 150 حرف")
        String title,
        String description,
        @NotNull(message = "يجب اختيار نوع العقار")
        PropertyType propertyType,
        @NotNull(message = "يجب اختيار نوع العرض")
        ListingType listingType,
        @NotNull(message = "يجب ادخال السعر")
        @PositiveOrZero(message = "لا يمكن ان يكون السعر اقل من صفر")
        @Digits(integer = 10,fraction = 2)
        BigDecimal price,
        @NotNull(message = "يجب اختيار العملة المفضلة")
        Currency currency,

        RentPeriod rentPeriod,
        @PositiveOrZero(message = "مساحة العقار لا يمكن ان تكون اقل من صفر")
        @Digits(integer = 8,fraction = 2)// هون وفي البرايس لو المستخدم دخل فقط عدد صحيح بدون فراكشنز او فرانشكنز اكثر من 2 هل رح يرفض ؟
        BigDecimal areaSize,
        @PositiveOrZero(message = "لا يمكن ان يكون عدد الغرف اقل من صفر")
        Integer rooms,
        @PositiveOrZero(message = "لا يمكن ان يكون عدد الحمامات اقل من صفر")
        Integer bathrooms,
        Boolean furnished,
        Boolean hasBalcony,

        @NotNull(message = "يجب اختيار بلدة العقار")
        @Positive(message = "قيمة غير صالحة")
        Long townId,
        @Size(max = 150,message = "نص العنوان لا يجب ان يتخطى 150 حرفا")
        String address,
        @DecimalMin(value = "-90.0", message = "خط العرض يجب ان يكون بين -90 و90")
        @DecimalMax(value = "90.0", message = "خط العرض يجب ان يكون بين -90 و90")
        @Digits(integer = 3,fraction = 6)
        BigDecimal latitude,
        @DecimalMin(value = "-180.0", message = "خط الطول يجب ان يكون بين -180 و180")
        @DecimalMax(value = "180.0", message = "خط الطول يجب ان يكون بين -180 و180")
        @Digits(integer = 3,fraction = 6)
        BigDecimal longitude,

        @NotEmpty(message = "يجب ادخال صورة واحدة على الاقل")
        @Size(max = 8,min = 1, message = "اقصى عدد مسموح من الصور للرفع هو 10 صور او صورة واحدة على الاقل")
        List<@NotBlank(message = "لا يمكن رفع صورة فارغة") String> imagePaths

) {
}
