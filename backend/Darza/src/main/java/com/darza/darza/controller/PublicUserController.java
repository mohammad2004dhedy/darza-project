package com.darza.darza.controller;

import com.darza.darza.dto.authDtos.PublicUserProfileResponse;
import com.darza.darza.dto.propertyDtos.PropertyCardResponse;
import com.darza.darza.dto.propertyDtos.SliceResponse;
import com.darza.darza.service.PropertyQueryService;
import com.darza.darza.service.UserService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/users")
public class PublicUserController {
    private final UserService userService;
    private final PropertyQueryService  propertyQueryService;
    public PublicUserController(UserService userService, PropertyQueryService propertyQueryService) {
        this.userService = userService;
        this.propertyQueryService = propertyQueryService;
    }
    @GetMapping("/{userId}/profile")
    public ResponseEntity<PublicUserProfileResponse> getPublicUserProfile(
            @PathVariable @Positive(message = "المعرف يجب ان يكون قيمة موجبة فقط")
            Long userId
    ){
        return  ResponseEntity.ok(userService.getPublicUserProfile(userId));
    }
    @GetMapping("/{userId}/properties")
    public ResponseEntity<SliceResponse<PropertyCardResponse>> getPublicProfileProperties(
            @PathVariable @Positive(message = "معرّف المستخدم يجب أن يكون رقمًا موجبًا")
            Long userId,
            @RequestParam(defaultValue = "0") int page
    ){
        return ResponseEntity.ok(propertyQueryService.getPublicProfileProperties(userId,page));
    }
}
