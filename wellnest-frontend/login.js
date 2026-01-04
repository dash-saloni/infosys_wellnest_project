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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      alert(`Login failed: ${errorText}`);
      return;
    }

    const data = await response.json();

    // CLEAR previous user data to prevent showing old age/weight/goal
    localStorage.clear();

    // Save token and user info to localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('role', data.role);
    localStorage.setItem('fullName', data.fullName); // Use real name from DB

    // Store profile data if available (fallback to empty if not set)
    if (data.age) localStorage.setItem('age', data.age);
    if (data.weight) localStorage.setItem('weight', data.weight);
    if (data.goal) localStorage.setItem('goal', data.goal);

    localStorage.setItem('userEmail', email);

    console.log("Login successful:", data);
    alert("Login successful! Redirecting to dashboard...");
    window.location.href = "dashboard.html";

  } catch (error) {
    console.error("Error during login:", error);
    alert("An error occurred during login. Please make sure the backend server is running.");
  }
}
