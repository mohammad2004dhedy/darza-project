package com.darza.darza.dto.authDtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "يجب ادخال الايميل")
        @Email(message = "الايميل غير صالح")
        String email,
        @NotBlank(message = "يجب ادخال كلمة المرور")
        String password
) {
}
