package com.darza.darza.dto.authDtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "يجب ادخال اسم المستخدم")
        @Size(max = 100,message = "اقصى طول للاسم هو 100 حرفا")
        String displayName,
        @NotBlank(message = "يجب ادخال الايميل")
        @Email(message = "الايميل غير صالح")
        @Size(max = 255,message = "يجب ان لا يتجاوز طول البريد الالكتروني 255 حرف")
        String email,
        @NotBlank(message = "يرجى ادخال كلمة المرور")
        @Size(min = 8,max =64, message = "كلمة المرور يجب ان تتكون من 8 احرف على الاقل و64 حرف كحد اقصى")
        String password,
        @NotBlank(message = "يجب ادخال رقم الهاتف")
        @Size(max = 20)
        String phoneNumber,
        @NotNull(message = "يجب اختيار مكان السكن")
        Long townId,

        @Size(max = 255,message = "عنوان المستخدم يجب ان لا يتخطى 255 حرف")
        String address
) {
}
