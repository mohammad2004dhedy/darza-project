package com.darza.darza.controller;

import com.darza.darza.dto.adminDtos.RejectPropertyRequest;
import com.darza.darza.dto.propertyDtos.PropertyCardResponse;
import com.darza.darza.dto.propertyDtos.SliceResponse;
import com.darza.darza.enums.PostingStatus;
import com.darza.darza.service.AdminService;
import com.darza.darza.service.PropertyQueryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;
    private final PropertyQueryService  propertyQueryService;
    public AdminController(AdminService adminService, PropertyQueryService propertyQueryService) {
        this.adminService = adminService;
        this.propertyQueryService = propertyQueryService;
    }

    @PostMapping("/properties/{propertyId}/reject")
    public ResponseEntity<Void> rejectProperty(
            @PathVariable @Positive(message = "المعرف يجب ان يكون قيمة موجبة فقط")
            Long propertyId,
            @AuthenticationPrincipal UserDetails authentication,
            @RequestBody @Valid RejectPropertyRequest request
            ){
        adminService.rejectProperty(propertyId, authentication, request);
        return ResponseEntity.ok().build();
    }
    @PatchMapping("/properties/{propertyId}/approve")
    public ResponseEntity<Void> approveProperty(
            @PathVariable @Positive(message = "المعرف يجب ان يكون قيمة موجبة فقط")
            Long propertyId,
            @AuthenticationPrincipal UserDetails authentication
    ){
        adminService.approveProperty(propertyId, authentication);
        return ResponseEntity.ok().build();
    }
    @GetMapping("/properties")
    public ResponseEntity<SliceResponse<PropertyCardResponse>> getPropertiesByPostingStatus(
            @RequestParam(defaultValue ="APPROVED")
            PostingStatus status,
            @AuthenticationPrincipal UserDetails authentication,
            @RequestParam(defaultValue = "0")
            int page
    ){
        return ResponseEntity.ok(propertyQueryService.getPropertiesForAdmin(status, authentication, page));
    }
}
