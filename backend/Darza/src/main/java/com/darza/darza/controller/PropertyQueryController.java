package com.darza.darza.controller;

import com.darza.darza.dto.propertyDtos.PropertyCardResponse;
import com.darza.darza.dto.propertyDtos.PropertyDetailsResponse;
import com.darza.darza.dto.propertyDtos.PropertyFilterRequest;
import com.darza.darza.dto.propertyDtos.SliceResponse;
import com.darza.darza.service.PropertyQueryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/public")
public class PropertyQueryController {
    private final PropertyQueryService propertyQueryService;
    public PropertyQueryController(PropertyQueryService propertyQueryService) {
        this.propertyQueryService = propertyQueryService;
    }

    @GetMapping("/properties/{id}")
    public ResponseEntity<PropertyDetailsResponse> getPropertyDetails(
            @PathVariable @Positive(message = "معرّف العقار يجب أن يكون رقمًا موجبًا") Long id,
            @AuthenticationPrincipal UserDetails authentication
    ){
        PropertyDetailsResponse response=propertyQueryService.getPropertyDetails(id,authentication);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/properties/feed")
    public ResponseEntity<SliceResponse<PropertyCardResponse>> getFeed(@RequestParam(defaultValue = "0") int page){
        return ResponseEntity.ok(propertyQueryService.getFeed(page));
    }
    @GetMapping("/properties/user/{userId}")
    public ResponseEntity<SliceResponse<PropertyCardResponse>> getPublicProfileProperties(
            @PathVariable @Positive(message = "معرّف المستخدم يجب أن يكون رقمًا موجبًا")
            Long userId,
            @RequestParam(defaultValue = "0") int page
            ){
        return ResponseEntity.ok(propertyQueryService.getPublicProfileProperties(userId,page));
    }
    @GetMapping("/properties/search")
    public ResponseEntity<SliceResponse<PropertyCardResponse>> getFilteredProperties(
            @ModelAttribute @Valid PropertyFilterRequest request
            ){
        return ResponseEntity.ok(propertyQueryService.getFilteredProperties(request));
    }

}
