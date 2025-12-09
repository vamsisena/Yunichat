# Multi-stage build for Render free tier deployment
# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copy parent pom and common module first (for better caching)
COPY ["YuniChat Backend/pom.xml", "./"]
COPY ["YuniChat Backend/common", "./common"]

# Copy notification service
COPY ["YuniChat Backend/notification-service", "./notification-service"]

# Remove modules section from parent POM to avoid validation errors, then install it
RUN sed -i '/<modules>/,/<\/modules>/d' pom.xml && \
    mvn install:install-file -Dfile=pom.xml -DgroupId=com.yunichat -DartifactId=yunichat-backend -Dversion=1.0.0 -Dpackaging=pom

# Build common module
RUN mvn clean install -DskipTests -f common/pom.xml

# Build notification service
RUN mvn clean package -DskipTests -f notification-service/pom.xml

# Stage 2: Runtime image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built JAR from builder stage
COPY --from=builder /build/notification-service/target/notification-service-1.0.0.jar app.jar

# Expose port (will be overridden by Render's PORT env variable)
EXPOSE 8085

# Use ENTRYPOINT with PORT environment variable support
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8085} -jar app.jar"]
