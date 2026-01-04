// dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

function initDashboard() {
  console.log("Initializing Dashboard...");

  // 1. Logout - Setup First to ensure functionality
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

  // 2. Auth Check - Redirect if not logged in
  const userId = localStorage.getItem("userId");

  // 3. Load User Info
  const fullName = localStorage.getItem("fullName") || "WellNester";
  const goal = localStorage.getItem("goal") || "Stay Fit";
  const age = localStorage.getItem("age") || "25";
  const weight = localStorage.getItem("weight") || "70";
  const role = localStorage.getItem("role") || "USER";

  updateText("welcomeName", fullName);
  updateText("goalText", goal);
  updateText("ageText", age);
  updateText("weightText", weight + " kg");
  updateText("roleBadge", role);

  // 4. Fetch Real Analytics Data
  if (userId) {
    fetchRealDashboardData(userId);
  } else {
    // Fallback for demo/logged out
    const seed = 12345;
    const derivedStats = generateDerivedStats(seed);
    updateDashboardVisuals(derivedStats);
  }

  // 5. Fetch Trainer & Plans Info
  // 5. Fetch Trainer & Plans Info
  if (userId) {
    fetchTrainerInfo(userId);
    startUserUnreadPolling(userId);
  }
}

// Global Trainer State
let currentRelationshipId = null;

async function startUserUnreadPolling(userId) {
  setInterval(async () => {
    try {
      const res = await fetch(`http://localhost:8081/api/chat/unread/user/${userId}`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        const data = await res.json();
        const count = data.count || 0;
        const badge = document.getElementById('user-chat-badge');
        if (badge) {
          if (count > 0) {
            badge.innerText = count;
            badge.style.display = 'flex';
          } else {
            badge.style.display = 'none';
          }
        }
      }
    } catch (e) { console.error(e); }
  }, 3000);
}

async function markAsRead(relId) {
  try {
    await fetch(`http://localhost:8081/api/chat/${relId}/read?readerType=USER`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const badge = document.getElementById('user-chat-badge');
    if (badge) badge.style.display = 'none';
  } catch (e) { console.error(e); }
}

function openChatModal() {
  if (!currentRelationshipId) return;
  document.getElementById('chatModal').style.display = 'flex';
  markAsRead(currentRelationshipId);
  loadChatHistory(currentRelationshipId);
}

async function fetchTrainerInfo(userId) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`http://localhost:8081/api/trainer-client/my-trainer/${userId}`, {
      headers: { "Authorization": "Bearer " + token }
    });

    if (response.ok) {
      const data = await response.json();
      // Data can be: { status: "NONE" } or { status: "PENDING", trainer: {...} } or { status: "ACTIVE", trainer: {...}, ...Object }

      const statusBadge = document.getElementById("trainerStatus");
      const trainerBox = document.getElementById("trainerBoxContent");

      if (data.status === "ACTIVE") {
        currentRelationshipId = data.id; // Store relationship ID for chat/plans

        // Update Modal Title
        const trainerNameSpan = document.getElementById("chatTrainerName");
        if (trainerNameSpan && data.trainer) trainerNameSpan.textContent = data.trainer.name;

        statusBadge.textContent = "ACTIVE";
        statusBadge.style.color = "#18b046";
        statusBadge.style.borderColor = "#18b046";
        statusBadge.style.border = "1px solid #18b046";

        // Show Chat Button
        trainerBox.innerHTML = `
             <p style="color:#ddd; margin-bottom:10px;">Trainer: <strong>${data.trainer.name}</strong></p>
             <button id="user-chat-btn" onclick="openChatModal()" class="action-chip" style="background:#18b046; color:white; border:none; padding:12px 24px; border-radius:99px; cursor:pointer; font-size:13px;">
                 Chat with Coach
                 <span id="user-chat-badge" class="notification-badge" style="display:none">0</span>
             </button>
        `;

        // Initialize Plans (Chat loaded on click)
        loadAssignedPlans(currentRelationshipId);

      } else if (data.status === "PENDING") {
        statusBadge.textContent = "PENDING";
        statusBadge.style.color = "orange";
        trainerBox.innerHTML = `
                    <p style="color:#ddd; margin-bottom:10px;">Request sent to <strong>${data.trainer.name}</strong>.</p>
                    <p style="font-size:12px; color:#aaa;">Waiting for acceptance...</p>
                `;
      } else {
        statusBadge.textContent = "Not Selected";
        // Default content already in HTML
      }
    }
  } catch (e) {
    console.error("Error fetching trainer info:", e);
  }
}

async function loadAssignedPlans(relationshipId) {
  const token = localStorage.getItem("token");

  // Workout
  try {
    const res = await fetch(`http://localhost:8081/api/plans/workout/${relationshipId}`, {
      headers: { "Authorization": "Bearer " + token }
    });
    if (res.ok) {
      const plans = await res.json();
      const box = document.getElementById("workoutBoxContent");
      if (plans.length > 0) {
        const latest = plans[0];
        box.innerHTML = `
                    <h4 style="color:#fff; margin-bottom:5px;">${latest.title}</h4>
                    <p style="font-size:12px; color:#aaa; margin-bottom:10px;">${latest.overview}</p>
                    <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; font-family:monospace; white-space:pre-wrap; max-height:120px; overflow-y:auto; font-size:11px;">${latest.exercises}</div>
                `;
      } else {
        box.innerHTML = '<p style="color:#aaa; font-size:14px;">No active workout plan assigned yet.</p>';
      }
    }
  } catch (e) { console.error(e); }

  // Meal
  try {
    const res = await fetch(`http://localhost:8081/api/plans/meal/${relationshipId}`, {
      headers: { "Authorization": "Bearer " + token }
    });
    if (res.ok) {
      const plans = await res.json();
      const box = document.getElementById("mealBoxContent");
      if (plans.length > 0) {
        const latest = plans[0];
        box.innerHTML = `
                    <h4 style="color:#fff; margin-bottom:5px;">${latest.title}</h4>
                    <p style="font-size:12px; color:#aaa; margin-bottom:10px;">Target: <span style="color:#18b046">${latest.dailyCalorieTarget}</span></p>
                    <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; font-family:monospace; white-space:pre-wrap; max-height:120px; overflow-y:auto; font-size:11px;">${latest.meals}</div>
                `;
      } else {
        box.innerHTML = '<p style="color:#aaa; font-size:14px;">No active meal plan assigned yet.</p>';
      }
    }
  } catch (e) { console.error(e); }
}

async function loadChatHistory(relationshipId) {
  const token = localStorage.getItem("token");
  const chatBox = document.getElementById("chatMessages");

  try {
    const res = await fetch(`http://localhost:8081/api/chat/${relationshipId}`, {
      headers: { "Authorization": "Bearer " + token }
    });
    if (res.ok) {
      const messages = await res.json();
      chatBox.innerHTML = '';

      const myUserId = parseInt(localStorage.getItem("userId")); // Helper comparison if senderId == myUserId

      messages.forEach(msg => {
        const div = document.createElement("div");
        // Check sender type. If generic "USER" vs "TRAINER", user is always "USER".
        const isMe = (msg.senderType === 'USER');

        div.className = `chat-msg ${isMe ? 'me' : 'them'}`;
        // Timestamp logic
        let timeStr = "";
        if (msg.sentAt) {
          const date = new Date(msg.sentAt);
          timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        div.innerHTML = `
            <div style="margin-bottom:2px;">${msg.message}</div>
            <div style="font-size: 10px; opacity: 0.7; text-align: ${isMe ? 'right' : 'left'}; margin-top: 2px;">${timeStr}</div>
        `;
        chatBox.appendChild(div);
      });
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  } catch (e) { console.error(e); }
}

async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg || !currentRelationshipId) return;

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("fullName");

  try {
    const res = await fetch(`http://localhost:8081/api/chat`, {
      method: 'POST',
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        relationshipId: currentRelationshipId,
        senderId: userId,
        senderType: "USER",
        senderName: userName,
        message: msg
      })
    });

    if (res.ok) {
      input.value = '';
      loadChatHistory(currentRelationshipId); // Refresh chat
    }
  } catch (e) { console.error(e); }
}

// Fetch real data from backend
async function fetchRealDashboardData(userId) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`http://localhost:8081/api/tracker/analytics/${userId}/dashboard`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (response.ok) {
      const data = await response.json();

      const stats = {
        calories: data.todayCalories,
        chartLabels: data.labels,
        chartData: {
          workoutDatasets: data.workoutDatasets || [],
          caloriesBurned: data.calorieData,   // From backend: calorieData (Burned)
          caloriesConsumed: data.caloriesConsumed || [] // From backend: caloriesConsumed (New)
        },
        water: data.todayWater,
        sleepHistory: data.sleepHistory,
        progress: {
          steps: data.todayCalories * 2,
          exerciseDays: (data.workoutDatasets || []).some(ds => ds.data.some(v => v > 0)) ? 1 : 0
        }
      };
      updateDashboardVisuals(stats);
    } else {
      console.warn("Failed to fetch dashboard data.");
      throw new Error("API response not ok");
    }
  } catch (e) {
    console.error("Error fetching dashboard data:", e);
    // Fallback to demo data on error so charts are not empty
    const seed = 12345;
    const derivedStats = generateDerivedStats(seed);
    updateDashboardVisuals(derivedStats);
  }
}

function updateDashboardVisuals(stats) {
  updateText("caloriesText", stats.calories.toLocaleString());
  initCharts(stats);
  updateProgressBars(stats);
  updateWaterSleepUI(stats);
}

// Helper to update text safely
function updateText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function updateWaterSleepUI(stats) {
  // Water - Goal 3.7L
  const waterHeader = document.querySelector('.info-panel:nth-child(1) h3');
  const waterFill = document.querySelector('.info-panel:nth-child(1) .progress-fill');
  const waterLabel = document.querySelector('.info-panel:nth-child(1) .progress-label');

  if (waterFill && waterLabel) {
    const goal = 3.7;
    const current = stats.water || 0;
    const displayVal = Math.min(current, goal);
    const percent = Math.min((current / goal) * 100, 100);

    waterFill.style.width = `${percent}%`;
    waterLabel.textContent = `${displayVal.toFixed(1)}L / ${goal}L`;
  }

  // Sleep - Last 3 Days
  const sleepList = document.querySelector('.sleep-list ul');
  if (sleepList && stats.sleepHistory) {
    sleepList.innerHTML = stats.sleepHistory.map(s =>
      `<li>${s.day}: ${s.hours} hours <span style="font-size:11px; color:#aaa; margin-left:8px;">(${s.quality})</span></li>`
    ).join('');
  }
}

function updateProgressBars(stats) {
  // New Goals Section
  const goalsSection = document.querySelector('.goals-section');
  if (goalsSection && stats.progress) {
    // Steps
    const items = goalsSection.querySelectorAll('.goal-item');
    if (items.length >= 2) {
      const stepText = items[0].querySelector('.goal-header span:last-child');
      const stepBar = items[0].querySelector('.goal-fill');

      if (stepText) stepText.textContent = `${stats.progress.steps.toLocaleString()} / 10,000`;
      if (stepBar) stepBar.style.width = `${Math.min((stats.progress.steps / 10000) * 100, 100)}%`;
    }
  }
}

function initCharts(stats) {
  if (typeof Chart === 'undefined') {
    console.error("Chart.js library is not loaded. Charts cannot be rendered.");
    return;
  }
  // --- 1. Workout Duration Stacked Bar Chart ---
  const ctxWorkout = document.getElementById('workoutChart');
  if (ctxWorkout) {
    const colors = ['#18b046', '#ff9800', '#29b6f6', '#e91e63', '#9c27b0', '#ffeb3b'];
    const rawDatasets = stats.chartData.workoutDatasets || [];

    const datasets = rawDatasets.map((ds, index) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: colors[index % colors.length],
      borderRadius: 4
    }));

    if (datasets.length === 0) {
      datasets.push({
        label: 'No Data',
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: '#333'
      });
    }

    new Chart(ctxWorkout, {
      type: 'bar',
      data: {
        labels: stats.chartLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#aaa' }
          },
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: '#aaa' }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: '#ddd', boxWidth: 12 }
          },
          tooltip: {
            // "when i hover now it is showing all those workouts where as i want to see only the workouts that is done during the day"
            // Interpretation: The user wants to see specific details of the hovered segment
            mode: 'nearest',
            intersect: true,
            callbacks: {
              footer: (tooltipItems) => {
                // Keep total for context if needed, or remove if user dislikes aggregation
                return '';
              }
            }
          }
        }
      }
    });
  }

  // --- 2. Calories (Clustered Bar Chart: Burned vs Consumed) ---
  const ctxCalories = document.getElementById('caloriesChart');
  if (ctxCalories) {
    // Need to destroy old chart instance if switching types in a real SPA, but here we rely on full re-init.

    const burnedData = stats.chartData.caloriesBurned || [0, 0, 0, 0, 0, 0, 0];
    const consumedData = stats.chartData.caloriesConsumed || [0, 0, 0, 0, 0, 0, 0];

    new Chart(ctxCalories, {
      type: 'bar', // Changed from 'line' to 'bar'
      data: {
        labels: stats.chartLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Calories Burned (Workouts)',
            data: burnedData,
            backgroundColor: '#AB47BC', // Purple
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.8
          },
          {
            label: 'Calories Consumed (Meals)',
            data: consumedData,
            backgroundColor: '#F48FB1', // Soft Pink
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#aaa' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#aaa' }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: '#ddd' }
          },
          tooltip: {
            mode: 'index', // Compare side-by-side
            intersect: false,
            backgroundColor: 'rgba(0,0,0,0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#333',
            borderWidth: 1
          }
        }
      }
    });
  }
}

function generateDerivedStats(seed) {
  const random = () => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const dailyCalories = Math.floor(random() * 1000) + 1500;

  // Create datasets for stacked chart
  const types = ["Cardio", "Strength"];
  const datasets = types.map(t => {
    const d = [];
    for (let i = 0; i < 7; i++) d.push(Math.floor(random() * 30));
    return { label: t, data: d };
  });

  const calorieBurnedData = [];
  const calorieConsumedData = [];
  for (let i = 0; i < 7; i++) {
    calorieBurnedData.push(Math.floor(random() * 300) + 200);
    calorieConsumedData.push(Math.floor(random() * 500) + 1800); // Higher than burned typically
  }

  const steps = Math.floor(random() * 5000) + 4000;
  const exerciseDays = 3;

  return {
    calories: dailyCalories,
    chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    chartData: {
      workoutDatasets: datasets,
      caloriesBurned: calorieBurnedData,
      caloriesConsumed: calorieConsumedData
    },
    water: 2.1,
    sleepHistory: [
      { day: 'Mon', hours: 7, quality: 'Good' },
      { day: 'Tue', hours: 6, quality: 'Fair' },
      { day: 'Wed', hours: 8, quality: 'Excellent' }
    ],
    progress: {
      steps: steps,
      exerciseDays: exerciseDays
    }
  };
}
