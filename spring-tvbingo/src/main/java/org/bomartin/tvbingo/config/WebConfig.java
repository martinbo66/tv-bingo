package org.bomartin.tvbingo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {

    /**
     * Origins allowed to call the API, as origin patterns.
     *
     * <p>Defaults to local development origins. Override per environment via the
     * {@code tvbingo.cors.allowed-origins} property (comma-separated). Because
     * credentials are allowed, a wildcard {@code *} cannot be used here; list real
     * origins instead.
     */
    @Value("${tvbingo.cors.allowed-origins:http://localhost:*}")
    private String[] allowedOriginPatterns;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOriginPatterns(allowedOriginPatterns)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}