# Multi-stage build for Render free tier deployment
# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copy parent pom and common module first (for better caching)
COPY ["YuniChat Backend/pom.xml", "./"]
COPY ["YuniChat Backend/common", "./common"]

# Copy user service
COPY ["YuniChat Backend/user-service", "./user-service"]

# Build common module first
RUN mvn clean install -DskipTests -f common/pom.xml

# Build user service (standalone, no reactor)
RUN mvn clean package -DskipTests -f user-service/pom.xml

# Stage 2: Runtime image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built JAR from builder stage
COPY --from=builder /build/user-service/target/user-service-1.0.0.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]
