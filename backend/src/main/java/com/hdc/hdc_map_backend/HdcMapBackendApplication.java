package com.hdc.hdc_map_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import javax.sql.DataSource;
import java.sql.Connection;

@SpringBootApplication
public class HdcMapBackendApplication {

	public static void main(String[] args) {
		System.out.println("🚀 Starting HDC Map Spring Boot Application...");
		ConfigurableApplicationContext context = SpringApplication.run(HdcMapBackendApplication.class, args);

		// Verify database connection
		try {
			DataSource dataSource = context.getBean(DataSource.class);
			Connection conn = dataSource.getConnection();
			String dbUrl = conn.getMetaData().getURL();
			System.out.println("✅ Successfully connected to RDS: " + dbUrl);
			conn.close();
		} catch (Exception e) {
			System.out.println("❌ Failed to connect to RDS: " + e.getMessage());
		}

		System.out.println("\n ✅ HDC Map Spring Boot Application started successfully! \n" +
				"   Access the API at: http://localhost:8080/api/v1\n" +
				"   Check the Swagger UI at: http://localhost:8080/swagger-ui/index.html\n" +
				"📍 Map endpoints available at:\n" +
				"   • http://localhost:8080/HDC_Map/getDataServlet (Properties)\n" +
				"   • http://localhost:8080/HDC_Map/getSchoolsServlet (Schools)\n" +
				"   • http://localhost:8080/HDC_Map/getCompsServlet (Comps)\n" +
				"   • http://localhost:8080/HDC_Map/test (Connection Test)\n" +
				"🌐 CORS enabled for local development\n");
	}

}
