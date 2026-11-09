package com.darza.darza.controller;

import com.darza.darza.dto.imagesDtos.ImageUploadUrlsResponse;
import com.darza.darza.enums.ImageType;
import com.darza.darza.service.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/storage")
public class StorageController {
    private final StorageService storageService;
    public StorageController(StorageService storageService) {
        this.storageService = storageService;
    }
    @GetMapping("/upload")
    public ResponseEntity<ImageUploadUrlsResponse> uploadImages(
            @RequestParam int count,
            @AuthenticationPrincipal UserDetails authentication,
            @RequestParam
            ImageType type
            ) {
        return ResponseEntity.ok(storageService.createUploadUrls(count,authentication,type));
    }
}
