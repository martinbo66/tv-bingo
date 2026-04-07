/**
 * Global exception handler for the TV Bingo application.
 * Provides centralized exception handling across all controllers.
 * Handles validation exceptions and data integrity violations,
 * particularly focusing on unique constraint violations for show titles.
 */
package org.bomartin.tvbingo.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.relational.core.conversion.DbActionExecutionException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            if (error instanceof FieldError fieldError) {
                errors.put(fieldError.getField(), fieldError.getDefaultMessage());
            }
        });
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(
            IllegalArgumentException ex) {
        Map<String, String> errors = new HashMap<>();
        
        if (ex.getMessage().contains("Show title must be unique")) {
            errors.put("showTitle", ex.getMessage());
            // Return 409 Conflict for uniqueness violations
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errors);
        } else {
            errors.put("error", ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
        }
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex) {
        Map<String, String> errors = new HashMap<>();
        String message = ex.getMostSpecificCause() != null && ex.getMostSpecificCause().getMessage() != null
                ? ex.getMostSpecificCause().getMessage()
                : "Invalid request body";
        errors.put("error", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatusException(
            ResponseStatusException ex) {
        Map<String, String> errors = new HashMap<>();
        errors.put("error", ex.getReason() != null ? ex.getReason() : ex.getMessage());
        return ResponseEntity.status(ex.getStatusCode()).body(errors);
    }

    @ExceptionHandler(DbActionExecutionException.class)
    public ResponseEntity<Map<String, String>> handleDbActionExecutionException(
            DbActionExecutionException ex) {
        Map<String, String> errors = new HashMap<>();

        if (ex.getCause() instanceof DataIntegrityViolationException dive) {
            if (dive.getMessage() != null && dive.getMessage().contains("uk_shows_show_title")) {
                errors.put("showTitle", "Show title must be unique");
            } else {
                errors.put("error", "Database constraint violation");
            }
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errors);
        }

        errors.put("error", "An unexpected error occurred. Please try again.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errors);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(
            DataIntegrityViolationException ex) {
        Map<String, String> errors = new HashMap<>();

        if (ex.getMessage().contains("uk_shows_show_title")) {
            errors.put("showTitle", "Show title must be unique");
        } else {
            errors.put("error", "Database constraint violation");
        }

        return ResponseEntity.status(HttpStatus.CONFLICT).body(errors);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
        log.error("Unhandled exception", ex);
        Map<String, String> errors = new HashMap<>();
        errors.put("error", "An unexpected error occurred. Please try again.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errors);
    }
} 