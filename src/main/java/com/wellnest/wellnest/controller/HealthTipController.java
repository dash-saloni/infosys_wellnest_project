package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.HealthTip;
import com.wellnest.wellnest.service.HealthTipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api/tips")
@CrossOrigin(origins = "*")
public class HealthTipController {

    @Autowired
    private HealthTipService healthTipService;

    @GetMapping("/daily")
    public HealthTip getDailyTip() {
        return healthTipService.getTipForToday();
    }
}
