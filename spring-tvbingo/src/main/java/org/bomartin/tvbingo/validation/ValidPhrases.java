package org.bomartin.tvbingo.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ValidPhrasesValidator.class)
public @interface ValidPhrases {
    String message() default "Phrases must be unique and not exceed 50 characters";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    int maxLength() default 50;
}
