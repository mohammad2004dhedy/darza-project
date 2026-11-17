package com.darza.darza.controller;

import com.darza.darza.dto.cityDtos.CityResponse;
import com.darza.darza.dto.townDtos.TownResponse;
import com.darza.darza.service.LocationService;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("api/public/location")
public class LocationQueryController {
    private final LocationService locationService;
    public LocationQueryController(LocationService locationService) {
        this.locationService = locationService;
    }
    @GetMapping("/town/getAll")
    public List<TownResponse> getTowns(
            @RequestParam @NotNull(message = "معرف المدينة مطلوب")
            @Positive(message = "المعرف يجب ان يكون قيمة موجبة فقط") Long cityId) {
        return locationService.getAllTowns(cityId);
    }
    @GetMapping("/city/getAll")
    public List<CityResponse> getCities() {
        return locationService.getAllCities();
    }
}
