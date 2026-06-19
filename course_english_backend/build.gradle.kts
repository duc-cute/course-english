plugins {
	java
	id("org.springframework.boot") version "3.2.4"
	id("io.spring.dependency-management") version "1.1.4"
	id("io.freefair.lombok") version "8.6"
}

group = "com.courseenglish"
version = "0.0.1-SNAPSHOT"

java {
	sourceCompatibility = JavaVersion.VERSION_17
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.boot:spring-boot-starter-validation")
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-websocket")
	implementation("org.springframework.boot:spring-boot-starter-mail")
	implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
	implementation("org.springframework.boot:spring-boot-starter-data-redis")
	implementation("com.turkraft.springfilter:jpa:3.1.7")
	implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
	implementation("com.google.api-client:google-api-client:2.7.2")
	implementation("org.apache.poi:poi-ooxml:5.2.5")
	implementation("org.apache.pdfbox:pdfbox:3.0.3")
	developmentOnly("org.springframework.boot:spring-boot-devtools")
	runtimeOnly("com.mysql:mysql-connector-j")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("org.springframework.security:spring-security-test")
}

tasks.withType<Test> {
	useJUnitPlatform()
}

/** Load .env into bootRun (IDE/Gradle cwd = backend module root). */
tasks.named<org.springframework.boot.gradle.tasks.run.BootRun>("bootRun") {
	val dotEnv = file(".env")
	if (dotEnv.exists()) {
		dotEnv.readLines()
			.map { it.trim() }
			.filter { it.isNotEmpty() && !it.startsWith("#") }
			.forEach { line ->
				val idx = line.indexOf('=')
				if (idx > 0) {
					environment(line.substring(0, idx).trim(), line.substring(idx + 1).trim())
				}
			}
	}
}
