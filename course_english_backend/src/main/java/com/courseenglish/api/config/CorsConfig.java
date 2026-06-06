package com.courseenglish.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();

        //Cho phép url nào có thể kết nối tới BE
        corsConfiguration.setAllowedOrigins(Arrays.asList("http://localhost:7070", "http://localhost:3000", "http://localhost:4173", "http://localhost:5173","http://localhost:3001","http://localhost:5174"));

        corsConfiguration.setAllowedMethods(Arrays.asList("GET","POST","PUT","DELETE","PATCH"));

        corsConfiguration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept","x-no-retry"));

        // gửi kèm cookies hay không
        corsConfiguration.setAllowCredentials(true);

        // thời gian pre-flight request có thể cache (tính theo seconds)
        corsConfiguration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        // cấu hình cors cho tất cả api
        source.registerCorsConfiguration("/**", corsConfiguration);
        return source;



    }
}
