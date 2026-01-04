package com.wellnest.wellnest.service;

import com.wellnest.wellnest.model.HealthTip;
import com.wellnest.wellnest.repository.HealthTipRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.time.LocalDate;
import java.util.Optional;
import java.util.Random;

@Service
public class HealthTipService {

    @Autowired
    private HealthTipRepository healthTipRepository;

    private final String API_URL = "https://api.adviceslip.com/advice/search/health";

    // Fallback tips if API fails or returns nothing relevant
    private final String[] FALLBACK_TIPS = {
            "Drink a glass of water as soon as you wake up to rehydrate your body.",
            "Aim for 7-9 hours of quality sleep every night.",
            "A 20-minute brisk walk counts as valid cardio exercise.",
            "Fill half your plate with colorful vegetables.",
            "Take deep breaths to reduce stress levels instantly.",
            "Avoid processed sugars to keep energy levels stable.",
            "Stretch for 5 minutes daily to improve flexibility."
    };

    public HealthTip getTipForToday() {
        LocalDate today = LocalDate.now();
        Optional<HealthTip> existingTip = healthTipRepository.findByTipDate(today);

        if (existingTip.isPresent()) {
            HealthTip tip = existingTip.get();
            // Check if it's a fallback tip
            if (isFallbackTip(tip.getText())) {
                System.out.println("⚠️ CACHED TIP IS FALLBACK. Retrying API fetch...");
                // Ideally we should update the existing one or delete it.
                // For simplicity, let's try to fetch new data.
                // If API succeeds, we update this tip. If fails, we keep it.
                String newContent = fetchContentFromApi();
                if (newContent != null) {
                    tip.setText(newContent);
                    System.out.println("✅ REPLACED FALLBACK WITH API TIP: " + newContent);
                    return healthTipRepository.save(tip);
                } else {
                    System.out.println("❌ API RETRY FAILED. Keeping fallback.");
                    return tip;
                }
            }

            System.out.println("✅ RETURNING CACHED API TIP: " + tip.getText());
            return tip;
        }

        // Fetch new tip
        return fetchAndSaveTip(today);
    }

    private boolean isFallbackTip(String content) {
        for (String fb : FALLBACK_TIPS) {
            if (fb.equals(content))
                return true;
        }
        return false;
    }

    // Helper to just get string from API (refactored from fetchAndSaveTip)
    private String fetchContentFromApi() {
        try {
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(3000);
            factory.setReadTimeout(3000);
            RestTemplate restTemplate = new RestTemplate(factory);

            String result = restTemplate.getForObject(API_URL, String.class);
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(result);

            if (root.has("slips")) {
                JsonNode slips = root.get("slips");
                if (slips.isArray() && slips.size() > 0) {
                    int index = new Random().nextInt(slips.size());
                    return slips.get(index).get("advice").asText();
                }
            }
        } catch (Exception e) {
            System.out.println("API Check Failed: " + e.getMessage());
        }
        return null;
    }

    private HealthTip fetchAndSaveTip(LocalDate date) {
        String tipText = "Stay active and eat healthy!";
        try {
            // Set timeout to avoid hanging (3 seconds)
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(3000);
            factory.setReadTimeout(3000);
            RestTemplate restTemplate = new RestTemplate(factory);

            // We use the search endpoint for 'health' to ensure relevance
            String result = restTemplate.getForObject(API_URL, String.class);
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(result);

            if (root.has("slips")) {
                JsonNode slips = root.get("slips");
                if (slips.isArray() && slips.size() > 0) {
                    // Pick a random one from the search results
                    int index = new Random().nextInt(slips.size());
                    tipText = slips.get(index).get("advice").asText();
                    System.out.println("✅ FETCHED HEALTH TIP FROM API: " + tipText);
                } else {
                    tipText = getRandomFallback();
                    System.out.println("⚠️ API RESPONDED BUT NO 'HEALTH' SLIPS FOUND. USING FALLBACK.");
                }
            } else {
                tipText = getRandomFallback();
                System.out.println("⚠️ API RESPONDED BUT INVALID FORMAT. USING FALLBACK.");
            }

        } catch (Exception e) {
            System.err.println("❌ FAILED TO FETCH TIP FROM API: " + e.getMessage());
            e.printStackTrace();
            tipText = getRandomFallback();
            System.out.println("⚠️ USING FALLBACK TIP: " + tipText);
        }

        HealthTip newTip = new HealthTip(tipText, "Daily Health Tip", date);
        try {
            return healthTipRepository.save(newTip);
        } catch (Exception e) {
            System.err.println("Database save failed: " + e.getMessage());
            return newTip;
        }
    }

    private String getRandomFallback() {
        return FALLBACK_TIPS[new Random().nextInt(FALLBACK_TIPS.length)];
    }
}
