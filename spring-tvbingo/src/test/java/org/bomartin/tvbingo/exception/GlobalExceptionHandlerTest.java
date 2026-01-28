package org.bomartin.tvbingo.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    @InjectMocks
    private GlobalExceptionHandler globalExceptionHandler;

    @Mock
    private MethodArgumentNotValidException methodArgumentNotValidException;

    @Mock
    private BindingResult bindingResult;

    @BeforeEach
    void setUp() {
        // Common setup if needed
    }

    @Test
    void handleValidationExceptions_ShouldFormatErrorsToMap() {
        // Arrange
        FieldError fieldError = new FieldError("show", "showTitle", "must not be blank");
        when(methodArgumentNotValidException.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getAllErrors()).thenReturn(List.of(fieldError));

        // Act
        ResponseEntity<Map<String, String>> response = 
            globalExceptionHandler.handleValidationExceptions(methodArgumentNotValidException);

        // Assert
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).containsEntry("showTitle", "must not be blank");
    }

    @Test
    void handleValidationExceptions_ShouldReturn400Status() {
        // Arrange
        FieldError fieldError = new FieldError("show", "showTitle", "must not be blank");
        when(methodArgumentNotValidException.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getAllErrors()).thenReturn(List.of(fieldError));

        // Act
        ResponseEntity<Map<String, String>> response = 
            globalExceptionHandler.handleValidationExceptions(methodArgumentNotValidException);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void handleValidationExceptions_WithMultipleErrors_ShouldReturnAllErrors() {
        // Arrange
        FieldError error1 = new FieldError("show", "showTitle", "must not be blank");
        FieldError error2 = new FieldError("show", "gameTitle", "must not be blank");
        FieldError error3 = new FieldError("show", "phrases", "size must be between 25 and 2147483647");
        
        when(methodArgumentNotValidException.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getAllErrors()).thenReturn(Arrays.asList(error1, error2, error3));

        // Act
        ResponseEntity<Map<String, String>> response = 
            globalExceptionHandler.handleValidationExceptions(methodArgumentNotValidException);

        // Assert
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).hasSize(3);
        assertThat(response.getBody()).containsEntry("showTitle", "must not be blank");
        assertThat(response.getBody()).containsEntry("gameTitle", "must not be blank");
        assertThat(response.getBody()).containsEntry("phrases", "size must be between 25 and 2147483647");
    }

    @Test
    void handleIllegalArgumentException_WithUniqueTitleError_ShouldReturnProperError() {
        // Arrange
        IllegalArgumentException exception = 
            new IllegalArgumentException("Show title must be unique");

        // Act
        ResponseEntity<Map<String, String>> response = 
            globalExceptionHandler.handleIllegalArgumentException(exception);

        // Assert
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).containsEntry("showTitle", "Show title must be unique");
        assertThat(response.getBody()).doesNotContainKey("error");
    }

    @Test
    void handleIllegalArgumentException_ShouldReturn409StatusForUniqueConstraint() {
        // Arrange
        IllegalArgumentException exception = 
            new IllegalArgumentException("Show title must be unique");

        // Act
        ResponseEntity<Map<String, String>> response = 
            globalExceptionHandler.handleIllegalArgumentException(exception);

        // Assert - uniqueness violations should return 409 Conflict
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void handleIllegalArgumentException_ShouldReturn400StatusForOtherErrors() {
        // Arrange
        IllegalArgumentException exception = 
            new IllegalArgumentException("Some other error");

        // Act
        ResponseEntity<Map<String, String>> response = 
            globalExceptionHandler.handleIllegalArgumentException(exception);

        // Assert - other errors should return 400 Bad Request
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void handleDataIntegrityViolation_WithUniqueConstraint_ShouldHandleDBConstraints() {
        // Arrange
        DataIntegrityViolationException exception = 
            new DataIntegrityViolationException("constraint [uk_shows_show_title]; nested exception");

        // Act
        ResponseEntity<Map<String, String>> response = 
            globalExceptionHandler.handleDataIntegrityViolation(exception);

        // Assert
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).containsEntry("showTitle", "Show title must be unique");
    }

    @Test
    void handleDataIntegrityViolation_ShouldReturn409Status() {
        // Arrange
        DataIntegrityViolationException exception = 
            new DataIntegrityViolationException("constraint [uk_shows_show_title]; nested exception");

        // Act
        ResponseEntity<Map<String, String>> response = 
            globalExceptionHandler.handleDataIntegrityViolation(exception);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void errorResponses_ShouldHaveConsistentFormat() {
        // Arrange
        FieldError fieldError = new FieldError("show", "showTitle", "must not be blank");
        when(methodArgumentNotValidException.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getAllErrors()).thenReturn(List.of(fieldError));
        
        IllegalArgumentException illegalArgException = 
            new IllegalArgumentException("Show title must be unique");
        
        DataIntegrityViolationException dataIntegrityException = 
            new DataIntegrityViolationException("constraint [uk_shows_show_title]");

        // Act
        ResponseEntity<Map<String, String>> validationResponse = 
            globalExceptionHandler.handleValidationExceptions(methodArgumentNotValidException);
        ResponseEntity<Map<String, String>> illegalArgResponse = 
            globalExceptionHandler.handleIllegalArgumentException(illegalArgException);
        ResponseEntity<Map<String, String>> dataIntegrityResponse = 
            globalExceptionHandler.handleDataIntegrityViolation(dataIntegrityException);

        // Assert - All responses should return Map<String, String> with at least one entry
        assertThat(validationResponse.getBody()).isInstanceOf(Map.class);
        assertThat(validationResponse.getBody()).isNotEmpty();
        
        assertThat(illegalArgResponse.getBody()).isInstanceOf(Map.class);
        assertThat(illegalArgResponse.getBody()).isNotEmpty();
        
        assertThat(dataIntegrityResponse.getBody()).isInstanceOf(Map.class);
        assertThat(dataIntegrityResponse.getBody()).isNotEmpty();
    }
}
