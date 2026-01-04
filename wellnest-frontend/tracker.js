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
        "Content-Type": "application/json"
        // "Authorization": "Bearer " + auth.token  // add if you enforce JWT
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
      `${API_BASE_URL}/workouts/${auth.userId}/today`
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
        "Content-Type": "application/json"
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
    const res = await fetch(`${API_BASE_URL}/meals/${auth.userId}/today`);
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
      div.innerHTML = `
        <div class="log-main">
          <div class="log-title">${m.mealType || "Meal"}</div>
          <div class="log-meta">
            ${m.calories ? m.calories + " kcal" : "Calories not set"}
          </div>
          <div class="log-secondary">${m.description || ""}</div>
        </div>
        <div class="log-secondary">
          ${m.mealTime || ""}<br/>
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
  const quality = document.getElementById("sleepQuality").value;

  if (!waterStr && !sleepStr) {
    alert("Enter at least water intake or sleep hours.");
    return;
  }

  const payload = {
    userId: auth.userId,
    waterIntakeLiters: waterStr ? parseFloat(waterStr) : null,
    sleepHours: sleepStr ? parseFloat(sleepStr) : null,
    sleepQuality: quality || null,
    logDate: new Date().toISOString().slice(0, 10)
  };

  try {
    const res = await fetch(`${API_BASE_URL}/water-sleep`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
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
      `${API_BASE_URL}/water-sleep/${auth.userId}/today`
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
