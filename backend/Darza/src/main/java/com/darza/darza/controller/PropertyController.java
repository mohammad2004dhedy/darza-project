package com.darza.darza.controller;

import com.darza.darza.dto.propertyDtos.CreatePropertyRequest;
import com.darza.darza.dto.propertyDtos.PropertyDetailsResponse;
import com.darza.darza.service.PropertyService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/property")
public class PropertyController {
    private final PropertyService propertyService;
    public PropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }
    @PostMapping
    public ResponseEntity<PropertyDetailsResponse> createProperty(
            @Valid
            @RequestBody
            CreatePropertyRequest request,
            @AuthenticationPrincipal UserDetails authentication
    ){
        PropertyDetailsResponse response=propertyService.createProperty(request,authentication);
        return ResponseEntity.created(URI.create("/api/public/properties/"+response.id())).body(response);
    }
    @PatchMapping("/{propertyId}/availability")
    public ResponseEntity<Void> toggleAvailability(
            @PathVariable @Positive(message = "المعرف يجب ان يكون قيمة موجبة") Long propertyId,
            @AuthenticationPrincipal UserDetails authentication
    ){
        propertyService.toggleAvailability(authentication,propertyId);
        return ResponseEntity.noContent().build();
    }
    @DeleteMapping("/{propertyId}")
    public ResponseEntity<Void> deleteProperty(
            @PathVariable @Positive(message = "المعرف يجب ان يكون قيمة موجبة") Long propertyId,
            @AuthenticationPrincipal UserDetails authentication
    ){
        propertyService.deleteProperty(authentication,propertyId);
        return ResponseEntity.noContent().build();
    }
    @PutMapping("/{propertyId}")
    public ResponseEntity<PropertyDetailsResponse> updateProperty(
            @PathVariable @Positive(message = "المعرف يجب ان يكون قيمة موجبة") Long propertyId,
            @AuthenticationPrincipal UserDetails authentication,
            @RequestBody @Valid CreatePropertyRequest request
    ){
        return ResponseEntity.ok(propertyService.updateProperty(request,authentication,propertyId));
    }
}
