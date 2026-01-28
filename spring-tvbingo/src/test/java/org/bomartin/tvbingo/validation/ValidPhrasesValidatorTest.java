package org.bomartin.tvbingo.validation;

import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ValidPhrasesValidatorTest {

    private ValidPhrasesValidator validator;

    @Mock
    private ConstraintValidatorContext context;

    @Mock
    private ConstraintValidatorContext.ConstraintViolationBuilder builder;

    @BeforeEach
    void setUp() {
        validator = new ValidPhrasesValidator();
        ValidPhrases annotation = mock(ValidPhrases.class);
        when(annotation.maxLength()).thenReturn(50);
        validator.initialize(annotation);
    }

    @Test
    void isValid_WithNullPhrases_ShouldReturnTrue() {
        // When
        boolean result = validator.isValid(null, context);

        // Then
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_WithEmptyList_ShouldReturnTrue() {
        // When
        boolean result = validator.isValid(Collections.emptyList(), context);

        // Then
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_WithValidPhrases_ShouldReturnTrue() {
        // Given
        List<String> phrases = Arrays.asList(
            "Short phrase",
            "Another valid phrase",
            "12345678901234567890123456789012345678901234567890" // exactly 50 chars
        );

        // When
        boolean result = validator.isValid(phrases, context);

        // Then
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_WithPhraseTooLong_ShouldReturnFalse() {
        // Given
        List<String> phrases = Arrays.asList(
            "Valid phrase",
            "This phrase is way too long and exceeds the fifty character limit" // 66 chars
        );

        when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(builder);

        // When
        boolean result = validator.isValid(phrases, context);

        // Then
        assertFalse(result);
        verify(context).disableDefaultConstraintViolation();
        verify(context).buildConstraintViolationWithTemplate(contains("index 1"));
        verify(context).buildConstraintViolationWithTemplate(contains("50 characters"));
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_WithFirstPhraseTooLong_ShouldReturnFalse() {
        // Given - first phrase exceeds limit
        List<String> phrases = Arrays.asList(
            "This is the first phrase and it is definitely way too long for the limit", // 74 chars
            "Valid phrase"
        );

        when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(builder);

        // When
        boolean result = validator.isValid(phrases, context);

        // Then
        assertFalse(result);
        verify(context).disableDefaultConstraintViolation();
        verify(context).buildConstraintViolationWithTemplate(contains("index 0"));
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_WithNullPhrasesInList_ShouldSkipNulls() {
        // Given - list with null entries
        List<String> phrases = Arrays.asList(
            "Valid phrase",
            null,
            "Another valid phrase"
        );

        // When
        boolean result = validator.isValid(phrases, context);

        // Then
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_WithExactly50Characters_ShouldReturnTrue() {
        // Given - phrase with exactly 50 characters
        String exactly50 = "12345678901234567890123456789012345678901234567890";
        List<String> phrases = Collections.singletonList(exactly50);

        // When
        boolean result = validator.isValid(phrases, context);

        // Then
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_With51Characters_ShouldReturnFalse() {
        // Given - phrase with 51 characters (1 over limit)
        String over50 = "123456789012345678901234567890123456789012345678901";
        List<String> phrases = Collections.singletonList(over50);

        when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(builder);

        // When
        boolean result = validator.isValid(phrases, context);

        // Then
        assertFalse(result);
        verify(context).disableDefaultConstraintViolation();
        verify(context).buildConstraintViolationWithTemplate(contains("51"));
        verify(builder).addConstraintViolation();
    }
}
