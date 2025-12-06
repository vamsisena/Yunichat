package com.yunichat.file.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
@ConfigurationProperties(prefix = "file")
@Data
public class FileStorageProperties {
    
    private Storage storage = new Storage();
    private Upload upload = new Upload();
    private Avatar avatar = new Avatar();
    
    @Data
    public static class Storage {
        private String type = "local";  // local or s3
        private String location = "./uploads";
        private String baseUrl = "http://localhost:8084/api/files";
    }
    
    @Data
    public static class Upload {
        private Long maxSize = 10485760L;  // 10MB
        private Map<String, String> allowedTypes;
    }
    
    @Data
    public static class Avatar {
        private Long maxSize = 2097152L;  // 2MB
        private String allowedTypes;
        private Integer thumbnailSize = 200;
    }
}
