package com.darza.darza.dto.authDtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(min = 1,max = 100,message = "اقصى طول للاسم هو 100 حرف")
        @NotBlank(message = "يجب ادخال اسم المستخدم")
        String displayName,
        @NotBlank(message = "يجب ادخال رقم الهاتف")
        @Pattern(regexp = "0?5\\d{8}", message = "رقم الهاتف غير صالح")
        String phoneNumber,
        @NotBlank(message = "يجب إدخال كود الدولة")
        @Pattern(regexp = "970|972", message = "كود الدولة يجب أن يكون 970 أو 972")
        String countryCode,
        @NotNull(message = "يجب اختيار مكان السكن")
        @Positive(message = "قيمة غير صالحة")
        Long townId,
        @Size(max = 255,message = "عنوان المستخدم يجب ان لا يتخطى 255 حرف")
        String address,
        String profileImagePath
) {
}
