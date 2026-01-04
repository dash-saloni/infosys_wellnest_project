
package com.wellnest.wellnest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableAsync
public class WellnestApplication {

	public static void main(String[] args) {
		SpringApplication.run(WellnestApplication.class, args);
	}

}
