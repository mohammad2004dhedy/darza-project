package com.darza.darza.service;

import com.darza.darza.dto.authDtos.*;
import com.darza.darza.entity.Town;
import com.darza.darza.entity.User;
import com.darza.darza.repository.TownRepository;
import com.darza.darza.repository.UserRepository;
import com.darza.darza.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
public class AuthService {
    AuthenticationManager authenticationManager;
    JwtService jwtService;
    UserRepository userRepository;
    PasswordEncoder  passwordEncoder;
    TownRepository townRepository;
    String bucketUrl;
    public AuthService(AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       TownRepository townRepository,
                       @Value("${app.storage.public-base-url}") String bucketUrl
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.townRepository = townRepository;
        this.bucketUrl = bucketUrl;
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication =authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().trim().toLowerCase(),request.password())
        );
        User user=userRepository.findByEmail(authentication.getName())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"المستخدم غير موجود"));
        String token=jwtService.generateToken(user.getEmail());
        Instant expiration=jwtService.getTokenExpiration(token).toInstant();
        String role=user.getRole().name();
        String displayName=user.getDisplayName();
        return new LoginResponse(
                token,
                displayName,
                role,
                expiration,
                user.getId()
        );
    }
    public MyProfileUserResponse register(CreateUserRequest request) {
        if(userRepository.existsByEmail(request.email().trim().toLowerCase())){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"الايميل مستخدم بالفعل");
        }
        String passwordHash=passwordEncoder.encode(request.password());
        Town town=townRepository.findById(request.townId())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"البلدة المختارة غير موجودة"));
        User user= AuthMapper.toUser(request,town,passwordHash);
        User savedUser=userRepository.save(user);
        return AuthMapper.toMyProfileUserResponse(savedUser,bucketUrl);
    }
}
