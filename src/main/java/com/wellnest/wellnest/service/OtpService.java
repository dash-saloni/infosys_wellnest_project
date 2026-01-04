package com.wellnest.wellnest.service;

import com.wellnest.wellnest.model.User;
import com.wellnest.wellnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpService {

    @Autowired
    private UserRepository userRepository;

    private static final int OTP_EXPIRY_MINUTES = 10;

    // 🔐 Generate OTP
    public String generateOtp(User user) {

        String otp = String.valueOf(100000 + new Random().nextInt(900000));

        user.setResetOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));

        userRepository.save(user);
        return otp;
    }

    // ✅ Validate OTP
    public boolean validateOtp(User user, String otp) {

        if (user.getResetOtp() == null || user.getOtpExpiry() == null) {
            return false;
        }

        if (LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            return false;
        }

        return user.getResetOtp().equals(otp);
    }

    // 🧹 Clear OTP after success
    public void clearOtp(User user) {
        user.setResetOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);
    }
}
