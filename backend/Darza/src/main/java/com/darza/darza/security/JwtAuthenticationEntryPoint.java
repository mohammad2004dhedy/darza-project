package com.darza.darza.security;
import com.darza.darza.exception.ApiErrorResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.Instant;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
     ObjectMapper objectMapper;
     public JwtAuthenticationEntryPoint(ObjectMapper objectMapper) {
         this.objectMapper = objectMapper;
     }
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
        HttpStatus status=HttpStatus.UNAUTHORIZED;
        ApiErrorResponse errorResponse=new ApiErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                "يجب تسجيل الدخول حتى تتمكن من الوصول الى هذا المصدر",
                request.getRequestURI(),
                null
        );
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getOutputStream(),errorResponse);
    }
}
