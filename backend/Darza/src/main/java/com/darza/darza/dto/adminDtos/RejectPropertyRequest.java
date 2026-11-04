package com.darza.darza.dto.adminDtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectPropertyRequest(
        @Size(max =300,message = "يجب ادخال سبب الرفض")
        @NotBlank(message = "لا يمكن ان يكون سبب الرفض فارغا")
        String rejectionReason
) {
}
