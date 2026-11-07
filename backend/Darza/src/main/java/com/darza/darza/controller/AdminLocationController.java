package com.darza.darza.controller;

import com.darza.darza.dto.cityDtos.CityResponse;
import com.darza.darza.dto.cityDtos.CreateCityRequest;
import com.darza.darza.dto.townDtos.CreateTownRequest;
import com.darza.darza.dto.townDtos.TownResponse;
import com.darza.darza.service.LocationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/admin/location")
public class AdminLocationController {
    private final LocationService locationService;
    @Autowired
    public AdminLocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @PostMapping("/city")
    public ResponseEntity<CityResponse> createCity(
            @Valid @RequestBody CreateCityRequest createCityRequest
    ){
        CityResponse response=locationService.createCity(createCityRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/city/{cityId}")
    public ResponseEntity<CityResponse> updateCity(
            @PathVariable @Positive(message = "المعرف يجب ان يكون قيمة موجبة فقط")
            Long cityId,
            @Valid @RequestBody CreateCityRequest createCityRequest
    ){
        return  ResponseEntity.ok(locationService.updateCity(createCityRequest,cityId));
    }
    @DeleteMapping("/city/{cityId}")
    public ResponseEntity<Void> deleteCity(
            @PathVariable @Positive(message = "المعرف يجب ان يكون قيمة موجبة فقط")
            Long cityId
    ){
        locationService.deleteCity(cityId);
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/town")
    public ResponseEntity<TownResponse> createTown(
            @Valid @RequestBody CreateTownRequest createTownRequest
    ){
        TownResponse response=locationService.createTown(createTownRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @PutMapping("/town/{townId}")
    public ResponseEntity<TownResponse> updateTown(
            @PathVariable @Positive(message = "المعرف يجب ان يكون قيمة موجبة فقط")
            Long townId,
            @Valid @RequestBody CreateTownRequest createTownRequest
    ){
        return ResponseEntity.ok(locationService.updateTown(createTownRequest,townId));
    }
    @DeleteMapping("/town/{townId}")
    public ResponseEntity<Void> deleteTown(@PathVariable @Positive(message = "المعرف يجب ان يكون موجبا") Long townId){
        locationService.deleteTown(townId);
        return ResponseEntity.noContent().build();
    }
}
