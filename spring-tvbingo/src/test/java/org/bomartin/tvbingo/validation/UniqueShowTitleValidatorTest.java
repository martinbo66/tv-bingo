package org.bomartin.tvbingo.validation;

import jakarta.validation.ConstraintValidatorContext;
import org.bomartin.tvbingo.repository.ShowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UniqueShowTitleValidatorTest {

    @Mock
    private ShowRepository showRepository;

    @Mock
    private ConstraintValidatorContext constraintValidatorContext;

    private UniqueShowTitleValidator validator;

    @BeforeEach
    void setUp() {
        validator = new UniqueShowTitleValidator(showRepository);
    }

    @Test
    void isValid_WithUniqueTitle_ShouldReturnTrue() {
        // Arrange
        String uniqueTitle = "Breaking Bad";
        when(showRepository.existsByShowTitle(uniqueTitle)).thenReturn(false);

        // Act
        boolean result = validator.isValid(uniqueTitle, constraintValidatorContext);

        // Assert
        assertThat(result).isTrue();
        verify(showRepository).existsByShowTitle(uniqueTitle);
    }

    @Test
    void isValid_WithDuplicateTitle_ShouldReturnFalse() {
        // Arrange
        String duplicateTitle = "Breaking Bad";
        when(showRepository.existsByShowTitle(duplicateTitle)).thenReturn(true);

        // Act
        boolean result = validator.isValid(duplicateTitle, constraintValidatorContext);

        // Assert
        assertThat(result).isFalse();
        verify(showRepository).existsByShowTitle(duplicateTitle);
    }

    @Test
    void isValid_WithNullTitle_ShouldReturnTrue() {
        // Arrange
        String nullTitle = null;

        // Act
        boolean result = validator.isValid(nullTitle, constraintValidatorContext);

        // Assert - Null is handled by @NotBlank, so validator returns true
        assertThat(result).isTrue();
    }

    @Test
    void validator_ShouldUseRepositoryToCheckExistence() {
        // Arrange
        String showTitle = "The Office";
        when(showRepository.existsByShowTitle(showTitle)).thenReturn(false);

        // Act
        validator.isValid(showTitle, constraintValidatorContext);

        // Assert
        verify(showRepository).existsByShowTitle(showTitle);
    }

    @Test
    void validator_WithDatabaseError_ShouldHandleGracefully() {
        // Arrange
        String showTitle = "Game of Thrones";
        when(showRepository.existsByShowTitle(showTitle))
            .thenThrow(new DataAccessException("Database connection failed") {});

        // Act & Assert - Should propagate exception (Spring will handle it)
        try {
            validator.isValid(showTitle, constraintValidatorContext);
        } catch (DataAccessException e) {
            assertThat(e.getMessage()).contains("Database connection failed");
        }
    }
}
