package org.bomartin.tvbingo.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.List;

public class ValidPhrasesValidator implements ConstraintValidator<ValidPhrases, List<String>> {

    private int maxLength;

    @Override
    public void initialize(ValidPhrases constraintAnnotation) {
        this.maxLength = constraintAnnotation.maxLength();
    }

    @Override
    public boolean isValid(List<String> phrases, ConstraintValidatorContext context) {
        if (phrases == null || phrases.isEmpty()) {
            return true; // Empty list is valid
        }

        // Find first phrase that exceeds max length
        for (int i = 0; i < phrases.size(); i++) {
            String phrase = phrases.get(i);
            if (phrase != null && phrase.length() > maxLength) {
                // Disable default message
                context.disableDefaultConstraintViolation();

                // Add custom message with index
                String customMessage = String.format("Phrase at index %d must not exceed %d characters (got %d)",
                        i, maxLength, phrase.length());
                context.buildConstraintViolationWithTemplate(customMessage)
                    .addConstraintViolation();

                return false;
            }
        }

        return true;
    }
}
