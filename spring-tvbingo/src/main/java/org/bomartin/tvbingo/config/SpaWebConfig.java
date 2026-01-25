package org.bomartin.tvbingo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Configuration for serving the Vue.js SPA from Spring Boot.
 * 
 * This handles:
 * - Serving static assets from /static/
 * - Forwarding client-side routes to index.html for Vue Router
 */
@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve static resources and fall back to index.html for SPA routing
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        
                        // If the resource exists and is readable, serve it
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }
                        
                        // For non-API routes without a file extension, serve index.html
                        // This enables Vue Router's history mode
                        if (!resourcePath.startsWith("api/") && !resourcePath.contains(".")) {
                            return new ClassPathResource("/static/index.html");
                        }
                        
                        return requestedResource;
                    }
                });
    }
}
