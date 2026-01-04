const API_BASE_URL = "http://localhost:8081/api/auth";

/* ================= STATE & ELEMENTS ================= */
let currentEmail = "";
let currentOtp = "";

const stepEmail = document.getElementById("stepEmail");
const stepOtp = document.getElementById("stepOtp");
const stepPassword = document.getElementById("stepPassword");

const passInput = document.getElementById("fpNewPassword");
const confirmInput = document.getElementById("fpConfirmPassword");
const matchDiv = document.getElementById("passwordMatch");

/* ================= STEP 1: SEND OTP ================= */
function sendOtp() {
    const email = document.getElementById("fpEmail").value;
    if (!email) {
        alert("Please enter email");
        return;
    }

    // UX Feedback
    const btn = document.querySelector("#stepEmail button");
    const originalText = btn.innerText;
    btn.innerText = "Sending OTP...";
    btn.disabled = true;
    btn.style.opacity = "0.7";

    currentEmail = email;

    fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    })
        .then(res => {
            if (!res.ok) throw new Error("User not found or error sending OTP");
            return res.text();
        })
        .then(msg => {
            alert(msg); // "OTP sent to email"
            stepEmail.classList.add("hidden");
            stepOtp.classList.remove("hidden");
        })
        .catch(err => {
            alert(err.message);
            // Reset button on error
            btn.innerText = originalText;
            btn.disabled = false;
            btn.style.opacity = "1";
        });
}

function resendOtp() {
    sendOtp();
}

/* ================= STEP 2: VERIFY OTP ================= */
function verifyOtp() {
    const otp = document.getElementById("fpOtp").value;
    if (!otp) {
        alert("Please enter OTP");
        return;
    }

    currentOtp = otp;

    fetch(`${API_BASE_URL}/validate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail, otp: currentOtp })
    })
        .then(res => {
            if (!res.ok) throw new Error("Invalid or expired OTP");
            return res.text();
        })
        .then(msg => {
            alert(msg); // "OTP verified successfully"
            stepOtp.classList.add("hidden");
            stepPassword.classList.remove("hidden");
        })
        .catch(err => alert(err.message));
}

/* ================= STEP 3: UPDATE PASSWORD ================= */

// Password Validation Logic (Copied from Signup)
const reqLength = document.getElementById('crit-length');
const reqUpper = document.getElementById('crit-upper');
const reqSpecial = document.getElementById('crit-special');

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

// Add Event Listeners if elements exist
if (passInput) {
    passInput.addEventListener('input', () => {
        validatePasswordUI(passInput.value);
        checkMatch();
    });
}
if (confirmInput) {
    confirmInput.addEventListener('input', checkMatch);
}


function updatePassword() {
    const newPassword = passInput.value;
    const confirmPassword = confirmInput.value;

    if (!newPassword || !confirmPassword) {
        alert("Please fill all fields");
        return;
    }

    // Validate Strength
    if (!validatePasswordUI(newPassword)) {
        alert("Password does not meet strength requirements.");
        return;
    }

    // Validate Match
    if (newPassword !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail, otp: currentOtp, newPassword })
    })
        .then(res => {
            if (!res.ok) throw new Error("Failed to reset password");
            return res.text();
        })
        .then(msg => {
            alert("Password has been updated! You can now login. 🎉");
            window.location.href = "login.html";
        })
        .catch(err => alert(err.message));
}
