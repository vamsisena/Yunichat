# Multi-stage build for Render free tier deployment
# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copy parent pom and common module first (for better caching)
COPY YuniChat\ Backend/pom.xml ./
COPY YuniChat\ Backend/common ./common

# Copy chat service
COPY YuniChat\ Backend/chat-service ./chat-service

# Build the entire project
RUN mvn clean install -DskipTests -pl chat-service -am

# Stage 2: Runtime image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built JAR from builder stage
COPY --from=builder /build/chat-service/target/chat-service-1.0.0.jar app.jar

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]
