package com.darza.darza.controller;

import com.darza.darza.dto.authDtos.MyProfileUserResponse;
import com.darza.darza.dto.authDtos.UpdateUserRequest;
import com.darza.darza.dto.propertyDtos.PropertyCardResponse;
import com.darza.darza.dto.propertyDtos.SliceResponse;
import com.darza.darza.service.PropertyQueryService;
import com.darza.darza.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/me")
public class OwnerUserController {
    private final UserService userService;
    private final PropertyQueryService propertyQueryService;
    public OwnerUserController(UserService userService, PropertyQueryService propertyQueryService) {
        this.userService=userService;
        this.propertyQueryService=propertyQueryService;
    }
    @GetMapping
    public ResponseEntity<MyProfileUserResponse> getMyUserProfile(
            @AuthenticationPrincipal UserDetails authentication
            ){
        return ResponseEntity.ok(userService.getMyUserProfile(authentication));
    }
    @GetMapping("/properties")
    public ResponseEntity<SliceResponse<PropertyCardResponse>> getMyProfileProperties(
            @AuthenticationPrincipal UserDetails authentication,
            @RequestParam(defaultValue = "0") int page
    ){
        return ResponseEntity.ok(propertyQueryService.getSelfProfileProperties(page,authentication));
    }
    @DeleteMapping
    public ResponseEntity<Void> deleteMyUserProfile(
            @AuthenticationPrincipal UserDetails authentication
    ){
        userService.deleteMyUserAccount(authentication);
        return ResponseEntity.ok().build();
    }
    @PutMapping
    public ResponseEntity<MyProfileUserResponse> updateMyUserProfile(
            @RequestBody @Valid UpdateUserRequest request,
            @AuthenticationPrincipal UserDetails authentication
            ){
        return ResponseEntity.ok(userService.updateMyUserProfile(request,authentication));
    }
    @DeleteMapping("/profile/image")
    public ResponseEntity<Void> deleteMyUserProfileImage(
            @AuthenticationPrincipal UserDetails authentication
    ){
        userService.deleteMyUserProfileImage(authentication);
        return ResponseEntity.noContent().build();
    }
}
