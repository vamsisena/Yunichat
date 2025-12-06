FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/file-service-1.0.0.jar app.jar
RUN mkdir -p /app/uploads
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
