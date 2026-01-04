console.log("signup.js loaded");

const API_BASE_URL = 'http://localhost:8081/api';

document.addEventListener('DOMContentLoaded', () => {

    const btn = document.getElementById('signupButton');
    const emailInput = document.getElementById("signupEmail");
    const passInput = document.getElementById('signupPassword');
    const confirmInput = document.getElementById('signupConfirmPassword');
    const matchDiv = document.getElementById('passwordMatch');

    const reqLength = document.getElementById('crit-length');
    const reqUpper = document.getElementById('crit-upper');
    const reqSpecial = document.getElementById('crit-special');

    let emailExists = false;

    /* ================= EMAIL EXIST CHECK ================= */

    emailInput.addEventListener('blur', async () => {
        const email = emailInput.value.trim();
        if (!email) return;

        try {
            const res = await fetch(`${API_BASE_URL}/auth/check-email?email=${encodeURIComponent(email)}`);
            emailExists = await res.json();

            if (emailExists) {
                emailInput.style.borderColor = "#d93025";
                alert("Email already exists ❌");
            } else {
                emailInput.style.borderColor = "#18b046";
            }
        } catch (err) {
            console.error("Email check failed", err);
        }
    });

    /* ================= PASSWORD STRENGTH ================= */

    function validatePasswordUI(password) {
        let valid = true;

        if (password.length >= 8) {
            reqLength.style.color = "#18b046";
            reqLength.innerHTML = "✅ At least 8 characters";
        } else {
            reqLength.style.color = "#777";
            reqLength.innerHTML = "• At least 8 characters";
            valid = false;
        }

        if (/[A-Z]/.test(password)) {
            reqUpper.style.color = "#18b046";
            reqUpper.innerHTML = "✅ One uppercase letter (A-Z)";
        } else {
            reqUpper.style.color = "#777";
            reqUpper.innerHTML = "• One uppercase letter (A-Z)";
            valid = false;
        }

        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            reqSpecial.style.color = "#18b046";
            reqSpecial.innerHTML = "✅ One special character (!@#$...)";
        } else {
            reqSpecial.style.color = "#777";
            reqSpecial.innerHTML = "• One special character (!@#$...)";
            valid = false;
        }

        return valid;
    }

    passInput.addEventListener('input', () => {
        validatePasswordUI(passInput.value);
        checkMatch();
    });

    confirmInput.addEventListener('input', checkMatch);

    function checkMatch() {
        if (!confirmInput.value) {
            matchDiv.textContent = "";
            return;
        }

        if (passInput.value === confirmInput.value) {
            matchDiv.textContent = "Passwords Match ✅";
            matchDiv.style.color = "#18b046";
        } else {
            matchDiv.textContent = "❌ Passwords do not match";
            matchDiv.style.color = "#d93025";
        }
    }

    /* ================= SIGNUP ================= */

    btn.addEventListener('click', async (e) => {
        e.preventDefault();

        if (emailExists) {
            alert("Email already exists. Please login.");
            return;
        }

        const passwordValid = validatePasswordUI(passInput.value);

        if (!passwordValid) {
            alert("Password does not meet strength requirements.");
            return;
        }

        if (passInput.value !== confirmInput.value) {
            alert("Passwords do not match!");
            return;
        }

        await signup();
    });
    /* ================= PASSWORD VISIBILITY TOGGLE ================= */
    function setupToggle(toggleId, inputId) {
        const toggleBtn = document.getElementById(toggleId);
        const inputField = document.getElementById(inputId);

        if (toggleBtn && inputField) {
            toggleBtn.addEventListener('click', () => {
                const type = inputField.getAttribute('type') === 'password' ? 'text' : 'password';
                inputField.setAttribute('type', type);

                // Toggle Eye Icon (Simple opacity change or color change for feedback)
                toggleBtn.style.color = type === 'text' ? '#18b046' : '#aaa';
            });
        }
    }

    setupToggle('togglePassword', 'signupPassword');
    setupToggle('toggleConfirmPassword', 'signupConfirmPassword');

});

/* ================= TOGGLE ROLE ================= */
window.switchRole = function (role) {
    const signupRole = document.getElementById('signupRole');
    const btnUser = document.getElementById('btnUser');
    const btnTrainer = document.getElementById('btnTrainer');
    const userFields = document.getElementById('userFields');
    const trainerFields = document.getElementById('trainerFields');

    signupRole.value = role;

    if (role === 'USER') {
        btnUser.classList.add('active');
        btnTrainer.classList.remove('active');
        userFields.style.display = 'block';
        trainerFields.style.display = 'none';

        // Toggle required attributes
        document.getElementById('signupAge').required = true;
        document.getElementById('signupWeight').required = true;
        document.getElementById('signupExperience').required = false;
    } else {
        btnUser.classList.remove('active');
        btnTrainer.classList.add('active');
        userFields.style.display = 'none';
        trainerFields.style.display = 'block';

        // Toggle required attributes
        document.getElementById('signupAge').required = false;
        document.getElementById('signupWeight').required = false;
        document.getElementById('signupExperience').required = true;
    }
}

/* ================= API CALL ================= */

async function signup() {
    try {
        const role = document.getElementById('signupRole').value;
        const fullName = document.getElementById('signupFullName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        const payload = {
            fullName: fullName,
            email: email,
            password: password,
            role: role
        };

        if (role === 'USER') {
            payload.age = Number(document.getElementById('signupAge').value);
            payload.weight = Number(document.getElementById('signupWeight').value);
            payload.goal = document.getElementById('signupGoal').value;
        } else {
            payload.experience = Number(document.getElementById('signupExperience').value);
            payload.specialization = document.getElementById('signupSpecialization').value;
        }

        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const msg = await res.text();
            alert("Signup Failed: " + msg);
            return;
        }

        alert("Account created successfully 🎉");
        window.location.href = "login.html";

    } catch (err) {
        console.error(err);
        alert("Signup failed: " + err.message);
    }
}
