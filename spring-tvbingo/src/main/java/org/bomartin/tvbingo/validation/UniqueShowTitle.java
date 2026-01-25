package org.bomartin.tvbingo.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = UniqueShowTitleValidator.class)
@Documented
public @interface UniqueShowTitle {
    String message() default "Show title must be unique";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
} 