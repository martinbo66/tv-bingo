/**
 * Validator class that checks if a show title is unique in the database.
 * This validator is used in conjunction with the {@link UniqueShowTitle} annotation
 * to ensure that show titles are not duplicated when creating or updating shows.
 */
package org.bomartin.tvbingo.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.bomartin.tvbingo.repository.ShowRepository;
import org.springframework.beans.factory.annotation.Autowired;

public class UniqueShowTitleValidator implements ConstraintValidator<UniqueShowTitle, String> {
    
    private final ShowRepository showRepository;
    
    @Autowired
    public UniqueShowTitleValidator(ShowRepository showRepository) {
        this.showRepository = showRepository;
    }
    
    @Override
    public void initialize(UniqueShowTitle constraintAnnotation) {
    }
    
    @Override
    public boolean isValid(String showTitle, ConstraintValidatorContext context) {
        if (showTitle == null) {
            return true;
        }
        return !showRepository.existsByShowTitle(showTitle);
    }
} 