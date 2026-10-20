package com.darza.darza.exception;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request)
    {
        int statusCode=ex.getStatusCode().value();
        Map<String,String> fieldErrors=new HashMap<>();
        for(FieldError fieldError:ex.getBindingResult().getFieldErrors()){
            fieldErrors.putIfAbsent(fieldError.getField(),fieldError.getDefaultMessage());
        }
        ApiErrorResponse error=new ApiErrorResponse(
                Instant.now(),
                statusCode,
                ex.getBody().getTitle(),
                ex.getBody().getDetail(),
                request.getRequestURI(),
                fieldErrors
        );
        return ResponseEntity.status(statusCode).body(error);
    }
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatusException(
            ResponseStatusException ex,
            HttpServletRequest request
    ){
        int statusCode=ex.getStatusCode().value();
     ApiErrorResponse error=new ApiErrorResponse(
             Instant.now(),
             statusCode,
             ex.getBody().getTitle(),
             ex.getBody().getDetail(),
             request.getRequestURI(),
             null
     );
     return ResponseEntity.status(statusCode).body(error);
    }
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthenticationException(
            AuthenticationException ex,
            HttpServletRequest request){

        HttpStatus status=HttpStatus.UNAUTHORIZED;
        ApiErrorResponse error=new ApiErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                "بيانات الدخول غير صحيحة",
                request.getRequestURI(),
                null
        );
        return ResponseEntity.status(status).body(error);
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleHttpMessageNotReadableException(HttpMessageNotReadableException ex, HttpServletRequest request){
        HttpStatus status=HttpStatus.BAD_REQUEST;
        ApiErrorResponse error=new ApiErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                "خطب ما في البيانات المرسلة",
                request.getRequestURI(),
                null
        );
        return ResponseEntity.status(status).body(error);
    }
}
