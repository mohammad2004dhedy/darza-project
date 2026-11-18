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
import java.util.regex.Pattern;

@Service
public class AuthService {
    private static final Pattern ISRAELI_MOBILE = Pattern.compile("(?:50|52|53|54|55|58)[0-9]{7}");
    private static final Pattern PALESTINIAN_MOBILE = Pattern.compile("(?:56|59)[0-9]{7}");
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
        String phoneNumber = formatPhoneNumber(request.countryCode(), request.phoneNumber());
        if(userRepository.existsByEmail(request.email().trim().toLowerCase())){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"الايميل مستخدم بالفعل");
        }
        String passwordHash=passwordEncoder.encode(request.password());
        Town town=townRepository.findById(request.townId())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"البلدة المختارة غير موجودة"));
        User user= AuthMapper.toUser(request,town,passwordHash);
        user.setPhoneNumber(phoneNumber);
        User savedUser=userRepository.save(user);
        return AuthMapper.toMyProfileUserResponse(savedUser,bucketUrl);
    }

    private String formatPhoneNumber(String countryCode, String phoneNumber) {
        String localNumber = phoneNumber.startsWith("0") ? phoneNumber.substring(1) : phoneNumber;
        boolean valid = switch (countryCode) {
            case "972" -> ISRAELI_MOBILE.matcher(localNumber).matches()
                    || PALESTINIAN_MOBILE.matcher(localNumber).matches();
            case "970" -> PALESTINIAN_MOBILE.matcher(localNumber).matches();
            default -> false;
        };
        if (!valid)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "كود الدولة أو رقم الهاتف غير صالح");
        return "+" + countryCode + localNumber;
    }
}
