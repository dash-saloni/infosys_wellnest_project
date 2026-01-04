package com.wellnest.wellnest.util;

import java.security.SecureRandom;

public class OtpGenerator {

    private static final SecureRandom random = new SecureRandom();

    /**
     * Generates a numeric OTP of given length.
     * @param length number of digits for OTP (e.g., 4, 6)
     * @return String representing the OTP
     */
    public static String generateOtp(int length) {
        if (length <= 0) throw new IllegalArgumentException("OTP length must be positive");

        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < length; i++) {
            otp.append(random.nextInt(10)); // 0–9
        }
        return otp.toString();
    }
}
