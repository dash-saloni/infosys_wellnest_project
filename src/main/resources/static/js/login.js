const API_BASE_URL = 'http://localhost:8081/api';

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorText = await response.text();
      alert("Login failed: " + errorText);
      return;
    }

    const data = await response.json();

    // Clear old data
    localStorage.clear();

    // Store login info
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("role", data.role);
    localStorage.setItem("fullName", data.fullName);
    localStorage.setItem("userEmail", email);

    if (data.age !== null) localStorage.setItem("age", data.age);
    if (data.weight !== null) localStorage.setItem("weight", data.weight);
    if (data.goal !== null) localStorage.setItem("goal", data.goal);
    if (data.trainerId) localStorage.setItem("trainerId", data.trainerId);

    alert("Login successful!");

    if (data.role === "TRAINER") {
      window.location.href = "trainer-home.html";
    } else {
      window.location.href = "dashboard.html";
    }

  } catch (error) {
    console.error("Login error:", error);
    alert("Backend not reachable. Is server running?");
  }
}
