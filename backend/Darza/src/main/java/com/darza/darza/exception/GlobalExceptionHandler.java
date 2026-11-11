package com.darza.darza.exception;

import jakarta.servlet.http.HttpServletRequest;

import jakarta.transaction.TransactionalException;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.ObjectError;
import org.springframework.validation.FieldError;
import org.springframework.validation.method.ParameterErrors;
import org.springframework.validation.method.ParameterValidationResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
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
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request
    ){
        HttpStatus status=HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status.value()).body(new ApiErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                "القيمة المدخلة غير صالحة",
                request.getRequestURI(),
                null

        ));
    }
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingServletRequestParameterException(
            MissingServletRequestParameterException ex,
            HttpServletRequest request
    ){
        HttpStatus status=HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status.value()).body(new ApiErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                "القيمة المدخلة غير صالحة",
                request.getRequestURI(),
                null
        ));
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
//    in case of error in RequestBody & path/query variable at the same time , spring could pass both errors to this handler
//    so it must handles both and return fieldErrors map.
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiErrorResponse> handleHandlerMethodValidationException(
            HandlerMethodValidationException ex,
            HttpServletRequest request
    ){
        Map<String,String> fieldErrors=new HashMap<>();
//        for each failed field validation do :
        for (ParameterValidationResult result : ex.getParameterValidationResults()) {
//            checks whether the error is from RequestBody or path/query variable
            if (result instanceof ParameterErrors parameterErrors) {
//            if the error is from RequestBody put all field errors inside fieldErrors Map
                for (FieldError fieldError : parameterErrors.getFieldErrors()) {
                    fieldErrors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
                }
//            put general errors related to the whole RequestBody
                for (ObjectError globalError : parameterErrors.getGlobalErrors()) {
                    fieldErrors.putIfAbsent(parameterErrors.getObjectName(), globalError.getDefaultMessage());
                }
            } else {
//              if the error is from path/query variable get the name (or index if name null) and keep only the first related error to the field
                String parameterName=result.getMethodParameter().getParameterName();
                if (parameterName==null) {
                    parameterName="parameter"+result.getMethodParameter().getParameterIndex();
                }
                for (var error : result.getResolvableErrors()) {
                    fieldErrors.putIfAbsent(parameterName, error.getDefaultMessage());
                }
            }
        }
        int statusCode=ex.getStatusCode().value();
        return ResponseEntity.status(statusCode).body(new ApiErrorResponse(
                Instant.now(),
                statusCode,
                ex.getBody().getTitle(),
                ex.getBody().getDetail(),
                request.getRequestURI(),
                fieldErrors
        ));
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
    @ExceptionHandler({DataAccessException.class, TransactionalException.class})
    public ResponseEntity<ApiErrorResponse> handleDataAccessException(RuntimeException ex, HttpServletRequest request){
        HttpStatus status=HttpStatus.INTERNAL_SERVER_ERROR;
        ApiErrorResponse error=new ApiErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                "حدث خطأ ما , حاول لاحقا",
                request.getRequestURI(),
                null
        );
        return  ResponseEntity.status(status).body(error);
    }
}
