const API_BASE_URL = 'http://localhost:8081/api';

async function signup() {
    const fullName = document.getElementById("signupFullName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const role = document.getElementById("signupRole").value;
    const age = document.getElementById("signupAge").value;
    const weight = document.getElementById("signupWeight").value;
    const goal = document.getElementById("signupGoal").value;

    if (!email || !password) {
        alert("Email and password are required");
        return;
    }

    try {
        const payload = {
            fullName: fullName,
            email: email,
            password: password,
            role: role,
            age: age ? Number(age) : null,
            weight: weight ? Number(weight) : null,
            goal: goal || null
        };
        console.log("Sending Register Payload:", payload);

        // STEP 1: Register user
        const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!registerResponse.ok) {
            const errorText = await registerResponse.text();
            alert(`Registration failed: ${errorText}`);
            return;
        }

        const registerMessage = await registerResponse.text();
        console.log("REGISTER RESPONSE:", registerMessage);

        // STEP 2: Login after registration
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        if (!loginResponse.ok) {
            alert("Login failed after registration");
            return;
        }

        const loginData = await loginResponse.json();
        console.log("LOGIN DATA:", loginData);

        // STEP 3: Save info in localStorage
        localStorage.setItem('token', loginData.token || 'demo-token');
        localStorage.setItem('userId', loginData.userId || '');
        localStorage.setItem('role', loginData.role || role || 'USER');
        localStorage.setItem('fullName', fullName);

        // These are returned by login potentially, but we have them here anyway
        localStorage.setItem('age', age || "");
        localStorage.setItem('weight', weight || "");
        localStorage.setItem('goal', goal || "");

        alert("Account created successfully! Redirecting to dashboard...");
        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Error during signup:", error);
        alert(`An error occurred during signup: ${error.message}`);
    }
}

// Make signup() available for inline onclick (if used)
window.signup = signup;

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('signupButton');
    const passInput = document.getElementById('signupPassword');
    const confirmInput = document.getElementById('signupConfirmPassword');
    const togglePassBtn = document.getElementById('togglePassword');
    const toggleConfBtn = document.getElementById('toggleConfirmPassword');
    const matchDiv = document.getElementById('passwordMatch');

    // Icons
    const eyeOpen = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#18b046" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeClosed = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    function setupToggle(btn, input) {
        if (btn && input) {
            btn.addEventListener('click', () => {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                btn.innerHTML = type === 'password' ? eyeClosed : eyeOpen;
            });
        }
    }
    setupToggle(togglePassBtn, passInput);
    setupToggle(toggleConfBtn, confirmInput);

    // Detailed Validation
    if (passInput) {
        passInput.addEventListener('input', () => {
            const val = passInput.value;

            const reqLength = document.getElementById('crit-length');
            const reqUpper = document.getElementById('crit-upper');
            const reqSpecial = document.getElementById('crit-special');

            if (reqLength) {
                if (val.length >= 8) {
                    reqLength.style.color = "#18b046";
                    reqLength.innerHTML = "✅ At least 8 characters";
                } else {
                    reqLength.style.color = "#777";
                    reqLength.innerHTML = "• At least 8 characters";
                }
            }

            if (reqUpper) {
                if (/[A-Z]/.test(val)) {
                    reqUpper.style.color = "#18b046";
                    reqUpper.innerHTML = "✅ One uppercase letter (A-Z)";
                } else {
                    reqUpper.style.color = "#777";
                    reqUpper.innerHTML = "• One uppercase letter (A-Z)";
                }
            }

            if (reqSpecial) {
                if (/[!@#$%^&*(),.?":{}|<>]/.test(val)) {
                    reqSpecial.style.color = "#18b046";
                    reqSpecial.innerHTML = "✅ One special character (!@#$...)";
                } else {
                    reqSpecial.style.color = "#777";
                    reqSpecial.innerHTML = "• One special character (!@#$...)";
                }
            }

            checkMatch(); // Check match as we type password too
        });
    }

    // Password Match Logic
    const checkMatch = () => {
        if (passInput && confirmInput) {
            const p1 = passInput.value;
            const p2 = confirmInput.value;

            if (!p2) {
                if (matchDiv) matchDiv.textContent = "";
                return;
            }

            if (p1 === p2) {
                if (matchDiv) {
                    matchDiv.textContent = "Passwords Match ✅";
                    matchDiv.style.color = "#18b046";
                    matchDiv.style.fontWeight = "bold";
                }
            } else {
                if (matchDiv) {
                    matchDiv.textContent = "❌ Passwords do not match";
                    matchDiv.style.color = "#d93025";
                    matchDiv.style.fontWeight = "bold";
                }
            }
        }
    };

    if (confirmInput) confirmInput.addEventListener('input', checkMatch);

    if (btn) {
        btn.addEventListener('click', (event) => {
            event.preventDefault();

            const p1 = passInput ? passInput.value : "";
            const p2 = confirmInput ? confirmInput.value : "";
            const hasUpper = /[A-Z]/.test(p1);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(p1);

            if (p1 !== p2) {
                alert("Passwords do not match!");
                return;
            }
            if (p1.length < 8) {
                alert("Password must be at least 8 characters long.");
                return;
            }
            if (!hasUpper || !hasSpecial) {
                alert("Password must contain at least one uppercase letter and one special character.");
                return;
            }

            signup();
        });
    }
});
