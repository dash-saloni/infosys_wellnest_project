document.addEventListener('DOMContentLoaded', () => {
    fetchTrainers();
});

async function fetchTrainers(filters = {}) {
    const userEmail = localStorage.getItem('userEmail');
    const allGrid = document.getElementById('allTrainersGrid');
    const recGrid = document.getElementById('recommendedGrid');
    const recSection = document.getElementById('recommendedSection');

    // Build query params
    let query = `?userEmail=${userEmail}`;
    if (filters.type) query += `&type=${filters.type}`;
    if (filters.location) query += `&location=${filters.location}`;
    if (filters.availability) query += `&availability=${filters.availability}`;

    try {
        // 1. Fetch Recommendations (with filters applied)
        allGrid.innerHTML = '<p style="text-align:center;">Loading...</p>';
        recGrid.innerHTML = '';

        const recResponse = await fetch(`/api/trainers/recommend${query}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });

        if (recResponse.ok) {
            const recTrainers = await recResponse.json();

            // If filters are active, we treat the "Recommended" section as the "Results" section
            // But structurally, we can just show them in the recommended grid and hide the 'All' grid if filtering?
            // Let's keep it simple: Show results in Recommended section.

            if (recTrainers.length > 0) {
                recSection.style.display = 'block';
                renderTrainers(recTrainers, recGrid);
            } else {
                recSection.style.display = 'block';
                recGrid.innerHTML = '<p>No matches found with these filters.</p>';
            }
        }

        // 2. Fetch All Trainers (Only on initial load, skip if filtering)
        const isFiltering = filters.type || filters.location || filters.availability;

        if (!isFiltering) {
            const allResponse = await fetch('/api/trainers', {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            if (allResponse.ok) {
                const allTrainers = await allResponse.json();
                renderTrainers(allTrainers, allGrid);
            }
        } else {
            allGrid.innerHTML = ''; // Clear "All Trainers" when filtering specific matches
        }

    } catch (error) {
        console.error('Error loading trainers:', error);
        allGrid.innerHTML = '<p style="text-align:center;">Error loading trainers.</p>';
    }
}

function applyFilters() {
    const type = document.getElementById('filterType').value;
    const location = document.getElementById('filterLocation').value;
    const availability = document.getElementById('filterAvailability').value;

    fetchTrainers({ type, location, availability });
}

function renderTrainers(trainers, gridElement) {
    gridElement.innerHTML = '';

    if (trainers.length === 0) {
        gridElement.innerHTML = '<p style="color:#666;">No trainers found.</p>';
        return;
    }

    trainers.forEach(t => {
        const card = document.createElement('div');
        card.className = 'trainer-card';

        // Check if user has this trainer already? (Ideally passed from backend, but simple approach first)

        card.innerHTML = `
            <div class="trainer-img-wrapper">
                <img src="${t.imageUrl || 'https://via.placeholder.com/300x220?text=Trainer'}" class="trainer-img" alt="${t.name}">
                <div class="specialization-badge">${t.specialization}</div>
            </div>
            <div class="trainer-info">
                <div class="trainer-name">${t.name}</div>
                <div class="trainer-exp">${t.experienceYears} Years Experience</div>
                <div class="trainer-bio" style="font-size:12px; margin-bottom:10px;">${t.bio}</div>
                
                <div style="font-size:12px; color:#aaa; margin-bottom:15px;">
                    📍 ${t.location || 'Online'} <br>
                    🕒 ${t.availability || 'Flexible'}
                </div>

                <button onclick="confirmBooking(${t.id}, '${t.name}')" class="contact-btn">Book / Contact</button>
            </div>
        `;
        gridElement.appendChild(card);
    });
}

// Booking Logic
async function confirmBooking(trainerId, trainerName) {
    // 1. Show Pop-up (Browser native confirm for simplicity as requested, or Custom Modal)
    // User request: "when user will click on book or contact it must show a pop up like 'do you want to enroll with this trainer'"

    const confirmed = confirm(`Do you want to enroll with ${trainerName}?`);

    if (confirmed) {
        try {
            const userId = localStorage.getItem('userId'); // Ensure we have this stored!
            // Note: Make sure userId is in localStorage on login. If not, we need to fix login.

            if (!userId) {
                alert("Please log in again to book a trainer.");
                window.location.href = 'login.html';
                return;
            }

            const response = await fetch(`/api/trainer-client/book?userId=${userId}&trainerId=${trainerId}`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });

            if (response.ok) {
                // User request: "it must show 'you have successfully enrolled'"
                alert("You have successfully enrolled! The trainer has been notified.");
                // Update UI or redirect?
            } else if (response.status === 409) {
                // User request: "alert as you have already chosen a trainer you can't choose more than one"
                const msg = await response.text();
                alert(msg); // Backend sends descriptive message
            } else {
                alert("Failed to book trainer. Please try again.");
            }
        } catch (e) {
            console.error(e);
            alert("An error occurred during booking.");
        }
    }
}
