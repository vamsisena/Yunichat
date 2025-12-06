# Multi-stage build for Render free tier deployment
# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copy parent pom and common module first (for better caching)
COPY ["YuniChat Backend/pom.xml", "./"]
COPY ["YuniChat Backend/common", "./common"]

# Copy gateway service
COPY ["YuniChat Backend/gateway-service", "./gateway-service"]

# Build the entire project
RUN mvn clean install -DskipTests -pl gateway-service -am

# Stage 2: Runtime image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built JAR from builder stage
COPY --from=builder /build/gateway-service/target/gateway-service-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
