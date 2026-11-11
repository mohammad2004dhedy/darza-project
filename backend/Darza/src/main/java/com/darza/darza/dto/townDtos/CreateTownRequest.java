package com.darza.darza.dto.townDtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateTownRequest(
        @NotNull(message = "يجب اختيار المدينة التي تتبع اليها البلدة!")
        @Positive(message = "المعرف يجب ان يكون قيمة موجبة فقط")
        Long cityId,
        @NotBlank(message = "لا يمكن ان يكون اسم البلدة فارغ!")
        @Size(max = 100)
        String townName
) {
}
