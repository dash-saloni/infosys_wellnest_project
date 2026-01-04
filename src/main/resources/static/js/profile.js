document.addEventListener('DOMContentLoaded', () => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return;

    fetchProfile(userEmail);

    document.getElementById('profileForm').addEventListener('submit', handleSave);
});

async function fetchProfile(email) {
    try {
        const response = await fetch(`/api/profile?email=${email}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        if (!response.ok) throw new Error('Failed to load profile');

        const user = await response.json();

        // Populate fields
        document.getElementById('fullName').value = user.fullName || '';
        document.getElementById('age').value = user.age || '';
        document.getElementById('weight').value = user.weight || '';

        let goal = user.goal || 'General Fitness';
        if (goal === 'General Health') goal = 'General Fitness'; // Legacy mapping
        document.getElementById('goal').value = goal;

        document.getElementById('email').value = user.email || email;

        // Initials
        if (user.fullName) {
            const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            document.getElementById('userInitials').textContent = initials;
        }

    } catch (error) {
        console.error(error);
        showMessage('Error loading profile data.', 'error');
    }
}

async function handleSave(e) {
    e.preventDefault();

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    const userEmail = localStorage.getItem('userEmail');
    const fullName = document.getElementById('fullName').value;
    const age = document.getElementById('age').value;
    const weight = document.getElementById('weight').value;
    const goal = document.getElementById('goal').value;

    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                email: userEmail,
                fullName,
                age,
                weight,
                goal
            })
        });

        if (response.ok) {
            showMessage('Profile updated successfully!', 'success');

            // Update localStorage for other pages
            localStorage.setItem('fullName', fullName);
            localStorage.setItem('goal', goal);

            // Update initials
            const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            document.getElementById('userInitials').textContent = initials;

        } else {
            showMessage('Failed to update profile.', 'error');
        }
    } catch (error) {
        console.error(error);
        showMessage('Error updating profile.', 'error');
    } finally {
        saveBtn.textContent = 'Save Changes';
        saveBtn.disabled = false;
    }
}

function showMessage(text, type) {
    const box = document.getElementById('msgBox');
    box.textContent = text;
    box.className = 'message ' + (type === 'success' ? 'msg-success' : 'msg-error');

    // Clear after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            box.textContent = '';
        }, 3000);
    }
}
