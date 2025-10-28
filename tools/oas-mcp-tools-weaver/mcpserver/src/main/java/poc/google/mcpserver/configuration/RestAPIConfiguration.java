package poc.google.mcpserver.configuration;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

/**
 * Configuration for REST API communication.
 * This class sets up the RestTemplate bean used for making outbound HTTP requests.
 */
@Configuration
public class RestAPIConfiguration {
    
    /**
     * Creates and configures a {@link RestTemplate} bean.
     * The RestTemplate is configured with default headers to accept and send JSON.
     * @param builder The {@link RestTemplateBuilder} to construct the RestTemplate.
     * @return A configured {@link RestTemplate} instance.
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}
