# Multi-stage build for Render free tier deployment
# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copy parent pom and common module first (for better caching)
COPY ["YuniChat Backend/pom.xml", "./"]
COPY ["YuniChat Backend/common", "./common"]

# Copy gateway service
COPY ["YuniChat Backend/gateway-service", "./gateway-service"]

# Install parent POM first (skip validation of missing child modules)
RUN mvn install:install-file -Dfile=pom.xml -DgroupId=com.yunichat -DartifactId=yunichat-backend -Dversion=1.0.0 -Dpackaging=pom -DgeneratePom=true

# Build common module
RUN mvn clean install -DskipTests -f common/pom.xml

# Build gateway service
RUN mvn clean package -DskipTests -f gateway-service/pom.xml

# Stage 2: Runtime image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built JAR from builder stage
COPY --from=builder /build/gateway-service/target/gateway-service-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
