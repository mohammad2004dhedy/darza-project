package com.darza.darza.dto.cityDtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCityRequest(
        @NotBlank(message="لا يمكن ان يكون اسم المدينة فارغ!")
        @Size(max = 100,message = "اسم المدينة لازم يكون 100 كحد اقصى!")
        String name
) {
}
