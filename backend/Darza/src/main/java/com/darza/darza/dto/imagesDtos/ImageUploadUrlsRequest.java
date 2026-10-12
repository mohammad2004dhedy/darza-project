package com.darza.darza.dto.imagesDtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ImageUploadUrlsRequest(
        @NotNull(message = "يجب ارسال عدد الصور المراد رفعها")
        @Max(value = 8,message = "اقصى عدد مسموح من الصور هو8 صور")
        @Min(value = 1,message = "يجب ادخال صورة واحدة على الاقل")
        Integer count
) {
}
