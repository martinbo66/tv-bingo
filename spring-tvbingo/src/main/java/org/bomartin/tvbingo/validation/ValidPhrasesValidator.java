package org.bomartin.tvbingo.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

        // Check for duplicate phrases
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < phrases.size(); i++) {
            String phrase = phrases.get(i);
            if (phrase != null) {
                if (seen.contains(phrase)) {
                    // Disable default message
                    context.disableDefaultConstraintViolation();

                    // Add custom message for duplicate
                    String customMessage = String.format("Duplicate phrase found at index %d: '%s'",
                            i, phrase);
                    context.buildConstraintViolationWithTemplate(customMessage)
                        .addConstraintViolation();

                    return false;
                }
                seen.add(phrase);
            }
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
