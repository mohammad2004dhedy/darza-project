package com.darza.darza.controller;

import com.darza.darza.dto.authDtos.CreateUserRequest;
import com.darza.darza.dto.authDtos.LoginRequest;
import com.darza.darza.dto.authDtos.LoginResponse;
import com.darza.darza.dto.authDtos.MyProfileUserResponse;
import com.darza.darza.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    @PostMapping("/register")
    public ResponseEntity<MyProfileUserResponse> register(@Valid @RequestBody CreateUserRequest request){
        MyProfileUserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request){
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
