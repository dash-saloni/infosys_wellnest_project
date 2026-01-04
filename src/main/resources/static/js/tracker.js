// tracker.js – connects tracker UI to Spring Boot backend

const API_BASE_URL = "http://localhost:8081/api/tracker";

function getAuthInfo() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    alert("Please login first.");
    window.location.href = "login.html";
    return null;
  }

  return { token, userId };
}

// -------- WORKOUTS --------

async function logWorkout() {
  const auth = getAuthInfo();
  if (!auth) return;

  const exerciseType = document.getElementById("exerciseType").value.trim();
  const durationStr = document.getElementById("durationMinutes").value;
  const caloriesStr = document.getElementById("caloriesBurned").value;

  if (!exerciseType || !durationStr) {
    alert("Please enter exercise type and duration.");
    return;
  }

  const payload = {
    userId: auth.userId,
    exerciseType,
    durationMinutes: parseInt(durationStr, 10),
    caloriesBurned: caloriesStr ? parseInt(caloriesStr, 10) : null,
    logDate: new Date().toISOString().slice(0, 10) // yyyy-MM-dd
  };

  try {
    const res = await fetch(`${API_BASE_URL}/workouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + auth.token
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Workout log error:", text);
      alert("Failed to log workout.\n" + text);
      return;
    }

    await loadWorkouts();
    // clear inputs
    document.getElementById("durationMinutes").value = "";
    document.getElementById("caloriesBurned").value = "";
  } catch (err) {
    console.error("Workout fetch error:", err);
    alert("Error while logging workout. Check console.");
  }
}

async function loadWorkouts() {
  const auth = getAuthInfo();
  if (!auth) return;

  const listEl = document.getElementById("workoutList");
  listEl.innerHTML = "Loading...";

  try {
    const res = await fetch(
      `${API_BASE_URL}/workouts/${auth.userId}/today`, {
      headers: { "Authorization": "Bearer " + auth.token }
    }
    );
    if (!res.ok) {
      listEl.innerHTML = "Could not load workouts for today.";
      return;
    }
    const items = await res.json();

    if (!items || items.length === 0) {
      listEl.className = "list-empty";
      listEl.textContent = "No workouts logged today";
      return;
    }

    listEl.className = "";
    listEl.innerHTML = "";
    items.forEach((w) => {
      const div = document.createElement("div");
      div.className = "log-item";
      div.innerHTML = `
        <div class="log-main">
          <div class="log-title">${w.exerciseType || "Workout"}</div>
          <div class="log-meta">
            ${w.durationMinutes || 0} min
            ${w.caloriesBurned ? " • " + w.caloriesBurned + " kcal" : ""}
          </div>
        </div>
        <div class="log-secondary">
          ${w.logDate || ""}
        </div>
      `;
      listEl.appendChild(div);
    });
  } catch (err) {
    console.error("Load workouts error:", err);
    listEl.innerHTML = "Error loading workouts.";
  }
}

// -------- MEALS --------

async function logMeal() {
  const auth = getAuthInfo();
  if (!auth) return;

  const mealType = document.getElementById("mealType").value.trim();
  const mealTime = document.getElementById("mealTime").value;
  const description = document.getElementById("mealDescription").value.trim();
  const caloriesStr = document.getElementById("mealCalories").value;
  const proteinStr = document.getElementById("mealProtein").value;
  const carbsStr = document.getElementById("mealCarbs").value;

  if (!mealType || !description) {
    alert("Please enter meal type and description.");
    return;
  }

  // ------------------------------------------
  // MEAL VALIDATION LOGIC
  // ------------------------------------------

  // 1. Time Limits (Gentle Schedule)
  if (mealTime) {
    const [h, m] = mealTime.split(':').map(Number);
    const timeInMinutes = h * 60 + m;

    const ranges = {
      'Breakfast': { start: 6 * 60, end: 11 * 60, label: '06:00 to 11:00 (6 AM to 11 AM)' },
      'Lunch': { start: 11 * 60, end: 15 * 60, label: '11:00 to 15:00 (11 AM to 3 PM)' },
      'Snack': { start: 15 * 60, end: 18 * 60 + 30, label: '15:00 to 18:30 (3 PM to 6:30 PM)' },
      'Dinner': { start: 18 * 60 + 30, end: 23 * 60, label: '18:30 to 23:00 (6:30 PM to 11 PM)' }
    };

    const rule = ranges[mealType];
    if (rule) {
      if (timeInMinutes < rule.start || timeInMinutes > rule.end) {
        alert(`The gentle time for ${mealType} is from ${rule.label}.`);
        return; // Stop execution
      }
    }
  }

  // 2. Duplicate Check
  // We need to fetch today's meals first to assume the list is current. 
  // Ideally, we maintain a local state or fetch. Here we fetch for safety.
  try {
    const checkRes = await fetch(`${API_BASE_URL}/meals/${auth.userId}/today`, {
      headers: { "Authorization": "Bearer " + auth.token }
    });
    if (checkRes.ok) {
      const existingMeals = await checkRes.json();
      const alreadyLogged = existingMeals.find(m => m.mealType === mealType);

      if (alreadyLogged) {
        alert(`You have already logged ${mealType} for today! You can only add it once per day.`);
        return;
      }
    }
  } catch (e) {
    console.warn("Could not verify duplicate meals", e);
    // We proceed if check fails? Or block? Safe to proceed or warn user.
  }

  const payload = {
    userId: auth.userId,
    mealType,
    description,
    calories: caloriesStr ? parseInt(caloriesStr, 10) : null,
    protein: proteinStr ? parseInt(proteinStr, 10) : null,
    carbs: carbsStr ? parseInt(carbsStr, 10) : null,
    logDate: new Date().toISOString().slice(0, 10),
    mealTime: mealTime || null
  };


  try {
    const res = await fetch(`${API_BASE_URL}/meals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + auth.token
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Meal log error:", text);
      alert("Failed to log meal.\n" + text);
      return;
    }

    await loadMeals();

    document.getElementById("mealDescription").value = "";
    document.getElementById("mealCalories").value = "";
    document.getElementById("mealProtein").value = "";
    document.getElementById("mealCarbs").value = "";
  } catch (err) {
    console.error("Meal fetch error:", err);
    alert("Error while logging meal. Check console.");
  }
}

async function loadMeals() {
  const auth = getAuthInfo();
  if (!auth) return;

  const listEl = document.getElementById("mealList");
  listEl.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_BASE_URL}/meals/${auth.userId}/today`, {
      headers: { "Authorization": "Bearer " + auth.token }
    });
    if (!res.ok) {
      listEl.innerHTML = "Could not load meals for today.";
      return;
    }
    const items = await res.json();

    if (!items || items.length === 0) {
      listEl.className = "list-empty";
      listEl.textContent = "No meals logged today";
      return;
    }

    listEl.className = "";
    listEl.innerHTML = "";
    items.forEach((m) => {
      const div = document.createElement("div");
      div.className = "log-item";
      // Format time to 12h AM/PM
      let displayTime = "";
      if (m.mealTime) {
        const [h, min] = m.mealTime.split(":");
        const H = parseInt(h, 10);
        const ampm = H >= 12 ? "PM" : "AM";
        const h12 = H % 12 || 12;
        displayTime = `${h12}:${min} ${ampm}`;
      }

      div.innerHTML = `
        <div class="log-main">
          <div class="log-title">${m.mealType || "Meal"}</div>
          <div class="log-meta">
            ${m.calories ? m.calories + " kcal" : "Calories not set"}
          </div>
          <div class="log-secondary">${m.description || ""}</div>
        </div>
        <div class="log-secondary">
          ${displayTime}<br/>
          ${m.logDate || ""}
        </div>
      `;
      listEl.appendChild(div);
    });
  } catch (err) {
    console.error("Load meals error:", err);
    listEl.innerHTML = "Error loading meals.";
  }
}

// -------- WATER & SLEEP --------

async function logWaterSleep() {
  const auth = getAuthInfo();
  if (!auth) return;

  const waterStr = document.getElementById("waterIntakeLiters").value;
  const sleepStr = document.getElementById("sleepHours").value;
  // const quality = document.getElementById("sleepQuality").value; // Removed manual input

  if (!waterStr && !sleepStr) {
    alert("Enter at least water intake or sleep hours.");
    return;
  }

  // ------------------------------------------
  // CUMULATIVE LIMIT VALIDATION
  // ------------------------------------------
  try {
    const checkRes = await fetch(`${API_BASE_URL}/water-sleep/${auth.userId}/today`, {
      headers: { "Authorization": "Bearer " + auth.token }
    });

    let currentWater = 0;
    let currentSleep = 0;

    if (checkRes.ok) {
      const items = await checkRes.json();
      items.forEach(ws => {
        currentWater += (ws.waterIntakeLiters || 0);
        currentSleep += (ws.sleepHours || 0);
      });
    }

    // Check cumulative Water
    if (waterStr) {
      const inputWater = parseFloat(waterStr);
      const newTotalWater = currentWater + inputWater;
      if (newTotalWater > 3.7) {
        const remaining = Math.max(0, 3.7 - currentWater).toFixed(1);
        alert(`Daily water limit is 3.7 Liters.\nYou have already consumed ${currentWater.toFixed(1)} L.\nYou can only add up to ${remaining} L more.`);
        return;
      }
    }

    // Check cumulative Sleep
    if (sleepStr) {
      const inputSleep = parseFloat(sleepStr);
      const newTotalSleep = currentSleep + inputSleep;
      if (newTotalSleep > 9) {
        const remaining = Math.max(0, 9 - currentSleep).toFixed(1);
        alert(`Daily sleep limit is 9 hours.\nYou have already logged ${currentSleep.toFixed(1)} hrs.\nYou can only add up to ${remaining} hrs more.`);
        return;
      }
    }

  } catch (e) {
    console.warn("Could not verify cumulative limits", e);
  }

  // Auto-calculate Sleep Quality
  let quality = "Poor";
  if (sleepStr) {
    const hours = parseFloat(sleepStr);
    if (hours >= 7 && hours <= 9) {
      quality = "Excellent";
    } else if ((hours >= 6 && hours < 7) || (hours > 9)) {
      quality = "Good";
    } else if (hours >= 5 && hours < 6) {
      quality = "Average";
    } else {
      quality = "Poor";
    }

    // Update UI input just so user sees it
    const qInput = document.getElementById("sleepQuality");
    if (qInput) qInput.value = quality;
  }

  const payload = {
    userId: auth.userId,
    waterIntakeLiters: waterStr ? parseFloat(waterStr) : null,
    sleepHours: sleepStr ? parseFloat(sleepStr) : null,
    sleepQuality: quality,
    logDate: new Date().toISOString().slice(0, 10)
  };

  try {
    const res = await fetch(`${API_BASE_URL}/water-sleep`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + auth.token
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Water/sleep log error:", text);
      alert("Failed to log water/sleep.\n" + text);
      return;
    }

    await loadWaterSleep();
  } catch (err) {
    console.error("Water/sleep fetch error:", err);
    alert("Error while logging water/sleep. Check console.");
  }
}

async function loadWaterSleep() {
  const auth = getAuthInfo();
  if (!auth) return;

  const listEl = document.getElementById("waterSleepList");
  listEl.innerHTML = "Loading...";

  try {
    const res = await fetch(
      `${API_BASE_URL}/water-sleep/${auth.userId}/today`, {
      headers: { "Authorization": "Bearer " + auth.token }
    }
    );
    if (!res.ok) {
      listEl.innerHTML = "Could not load water/sleep logs.";
      return;
    }
    const items = await res.json();

    if (!items || items.length === 0) {
      listEl.className = "list-empty";
      listEl.textContent = "No water & sleep logs for today";
      return;
    }

    listEl.className = "";
    listEl.innerHTML = "";
    items.forEach((ws) => {
      const div = document.createElement("div");
      div.className = "log-item";
      div.innerHTML = `
        <div class="log-main">
          <div class="log-title">
            ${ws.waterIntakeLiters || 0} L water
          </div>
          <div class="log-meta">
            ${ws.sleepHours ? ws.sleepHours + " hrs sleep" : "Sleep not set"}
          </div>
          <div class="log-secondary">
            ${ws.sleepQuality || ""}
          </div>
        </div>
        <div class="log-secondary">
          ${ws.logDate || ""}
        </div>
      `;
      listEl.appendChild(div);
    });
  } catch (err) {
    console.error("Load water/sleep error:", err);
    listEl.innerHTML = "Error loading water & sleep logs.";
  }
}

// -------- INIT --------

document.addEventListener("DOMContentLoaded", () => {
  const workoutBtn = document.getElementById("logWorkoutBtn");
  const mealBtn = document.getElementById("logMealBtn");
  const waterSleepBtn = document.getElementById("logWaterSleepBtn");

  if (workoutBtn) workoutBtn.addEventListener("click", logWorkout);
  if (mealBtn) mealBtn.addEventListener("click", logMeal);
  if (waterSleepBtn) waterSleepBtn.addEventListener("click", logWaterSleep);

  // Load today's logs
  loadWorkouts();
  loadMeals();
  loadWaterSleep();
});
