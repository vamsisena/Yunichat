# Multi-stage build for Render free tier deployment
# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copy parent pom and common module first (for better caching)
COPY ["YuniChat Backend/pom.xml", "./"]
COPY ["YuniChat Backend/common", "./common"]

# Copy user service
COPY ["YuniChat Backend/user-service", "./user-service"]

# Install parent POM first (required for dependency resolution)
RUN mvn install:install-file -Dfile=pom.xml -DpomFile=pom.xml -DgroupId=com.yunichat -DartifactId=yunichat-backend -Dversion=1.0.0 -Dpackaging=pom

# Build common module
RUN mvn clean install -DskipTests -f common/pom.xml

# Build user service
RUN mvn clean package -DskipTests -f user-service/pom.xml

# Stage 2: Runtime image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built JAR from builder stage
COPY --from=builder /build/user-service/target/user-service-1.0.0.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]
