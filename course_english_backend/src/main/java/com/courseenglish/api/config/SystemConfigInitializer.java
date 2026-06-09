package com.courseenglish.api.config;

import com.courseenglish.api.service.SystemConfigService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class SystemConfigInitializer implements ApplicationRunner {

    private final SystemConfigService systemConfigService;

    public SystemConfigInitializer(SystemConfigService systemConfigService) {
        this.systemConfigService = systemConfigService;
    }

    @Override
    public void run(ApplicationArguments args) {
        systemConfigService.initConfig();
    }
}
