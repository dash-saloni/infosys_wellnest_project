document.addEventListener('DOMContentLoaded', () => {
    initTrainerDashboard();
});

let currentTrainerId = null;
let activeRelationshipId = null; // For modal context

async function initTrainerDashboard() {
    const trainerEmail = localStorage.getItem('userEmail');
    if (!trainerEmail) {
        window.location.href = 'login.html';
        return;
    }

    // We need Trainer ID.
    // Auth logic now ensures 'trainerId' is set in localStorage for Trainers.

    currentTrainerId = localStorage.getItem('trainerId');

    if (!currentTrainerId) {
        // Fallback for older sessions or dev
        console.warn("No trainerId found. Falling back to userId.");
        currentTrainerId = localStorage.getItem('userId');
    }

    if (localStorage.getItem('role') !== 'TRAINER') {
        alert("Access Denied");
        window.location.href = 'index.html';
        return;
    }

    loadClients();
    loadPendingRequests();
    startUnreadPolling();
}

async function startUnreadPolling() {
    await updateUnreadCounts(); // Run immediately
    setInterval(updateUnreadCounts, 3000);
}

async function updateUnreadCounts() {
    if (!currentTrainerId) return;
    try {
        const res = await fetch(`http://localhost:8081/api/chat/unread/trainer/${currentTrainerId}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        if (res.ok) {
            const counts = await res.json();

            // Only hide badges that we are about to update? 
            // Actually simpler: Hide all, then show relevant ones.
            // But doing this every 3s might cause flicker if DOM is slow.
            // Better: Loop though all potential badges?
            // "document.querySelectorAll" is fine.

            const badges = document.querySelectorAll('.notification-badge');
            // We can't clear all if we want to avoid flicker, but for now exact logic matches previous pattern
            // To be safer: Set all to display:none, then Loop counts to show.

            // Improve: Reset logic inside the loop or map check
            // Let's stick to simple reliable logic
            badges.forEach(el => el.style.display = 'none');

            for (const [relId, count] of Object.entries(counts)) {
                const badge = document.getElementById(`badge-${relId}`);
                if (badge) {
                    badge.innerText = count;
                    badge.style.display = 'flex';
                }
            }
        }
    } catch (e) { console.error("Polling error", e); }
}

async function markAsRead(relId) {
    try {
        await fetch(`http://localhost:8081/api/chat/${relId}/read?readerType=TRAINER`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const badge = document.getElementById(`badge-${relId}`);
        if (badge) badge.style.display = 'none';

        // Refresh counts immediately to prevent polling from showing it again for 3s
        setTimeout(updateUnreadCounts, 500);
    } catch (e) { console.error(e); }
}

async function loadClients() {
    const list = document.getElementById('clientsList');
    list.innerHTML = '<p style="text-align:center; color:#666;">Loading...</p>';

    try {
        const res = await fetch(`http://localhost:8081/api/trainer-client/clients/${currentTrainerId}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });

        if (res.ok) {
            const clients = await res.json();
            list.innerHTML = '';

            if (clients.length === 0) {
                list.innerHTML = '<p style="text-align:center; color:#aaa;">No active clients yet.</p>';
                document.getElementById('activeClientCount').innerText = '0';
                return;
            }

            // Update Stats
            document.getElementById('activeClientCount').innerText = clients.length;

            clients.forEach(c => {
                const li = document.createElement('li');
                li.className = 'client-item';

                // Avatar initials
                const initials = c.user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                li.innerHTML = `
                    <div class="client-info">
                        <div class="client-avatar">${initials}</div>
                        <div class="client-details">
                            <h4>${c.user.fullName}</h4>
                            <p>${c.user.goal} • ${c.user.age} yrs</p>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center;">
                        <button onclick="openChat(${c.id}, '${c.user.fullName}')" class="action-chip btn-chat" id="chat-btn-${c.id}">
                            CHAT
                            <span id="badge-${c.id}" class="notification-badge" style="display:none">0</span>
                        </button>
                        <button onclick="openWorkoutModal(${c.id}, '${c.user.fullName}')" class="action-chip btn-work">WORKOUT</button>
                        <button onclick="openDietModal(${c.id}, '${c.user.fullName}')" class="action-chip btn-diet">DIET</button>
                    </div>
                `;
                list.appendChild(li);
            });
        }

        loadPastClients(); // Trigger past load
    } catch (e) { console.error(e); }
}

async function loadPastClients() {
    const list = document.getElementById('pastClientsList');
    if (!list) return;
    list.innerHTML = '<p style="text-align:center; color:#666;">Loading...</p>';

    try {
        const res = await fetch(`http://localhost:8081/api/trainer-client/clients-past/${currentTrainerId}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        if (res.ok) {
            const clients = await res.json();
            list.innerHTML = '';
            if (clients.length === 0) {
                list.innerHTML = '<p style="text-align:center; color:#aaa;">No previous clients.</p>';
                return;
            }

            clients.forEach(c => {
                const li = document.createElement('li');
                li.className = 'client-item';
                const initials = c.user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                li.innerHTML = `
                    <div class="client-info" style="opacity:0.7;">
                        <div class="client-avatar" style="background:#444;">${initials}</div>
                        <div class="client-details">
                            <h4 style="color:#aaa;">${c.user.fullName}</h4>
                            <p>${c.status}</p>
                        </div>
                    </div>
                    <div style="position:relative;">
                        <button onclick="toggleHistoryMenu(${c.id})" style="background:transparent; border:none; color:#aaa; font-size:20px; cursor:pointer;" title="View History">⋮</button>
                        <div id="hist-menu-${c.id}" class="dropdown-menu" style="right:0; top:100%; min-width:140px;">
                            <a href="javascript:void(0)" onclick="openChat(${c.id}, '${c.user.fullName}')">View Chats</a>
                        </div>
                    </div>
                 `;
                list.appendChild(li);
            });
        }
    } catch (e) { console.error(e); }
}

function toggleHistoryMenu(id) {
    const menu = document.getElementById(`hist-menu-${id}`);
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        // Close others
        document.querySelectorAll('.dropdown-menu').forEach(d => d.style.display = 'none');
        menu.style.display = 'block';
    }
}

// ... (rest of loadPendingRequests and others) ...

// Updated openChat
function openChat(relId, name) {
    activeRelationshipId = relId;
    document.getElementById('chatClientName').textContent = name;
    document.getElementById('chatModal').style.display = 'flex';

    markAsRead(relId); // Mark as read when opening
    loadTrainerChat();
}

// ... rest of file (loadPendingRequests, respondRequest etc kept via diff matching or verify positioning)
// The instruction implies replacing chunks. I will target specific blocks. 
// Specifically `initTrainerDashboard` block, `loadClients` block and `openChat` block.
// To use REPLACE_FILE_CONTENT properly with a LARGE file, I should use `multi_replace_file_content` if blocks are far apart or just replace a contiguous chunk if they are close.
// `init` is at top. `loadClients` is next. `openChat` is further down.
// `multi_replace` is better.


async function loadPendingRequests() {
    const panel = document.getElementById('pendingPanel');
    const list = document.getElementById('pendingList');

    try {
        const res = await fetch(`http://localhost:8081/api/trainer-client/requests/${currentTrainerId}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });

        if (res.ok) {
            const reqs = await res.json();
            if (reqs.length > 0) {
                panel.style.display = 'block';
                list.innerHTML = '';

                reqs.forEach(r => {
                    const li = document.createElement('li');
                    li.className = 'client-item';
                    li.innerHTML = `
                         <div class="client-info">
                            <div class="client-details">
                                <h4>${r.user.fullName}</h4>
                                <p>Wants to enroll</p>
                            </div>
                        </div>
                        <div>
                            <button onclick="respondRequest(${r.id}, 'ACCEPT')" style="background:#18b046; color:white; border:none; padding:5px 10px; border-radius:4px; font-size:11px; cursor:pointer; margin-right:5px;">ACCEPT</button>
                            <button onclick="respondRequest(${r.id}, 'REJECT')" style="background:transparent; border:1px solid #d32f2f; color:#d32f2f; padding:5px 10px; border-radius:4px; font-size:11px; cursor:pointer;">REJECT</button>
                        </div>
                    `;
                    list.appendChild(li);
                });
            } else {
                panel.style.display = 'none';
            }
        }
    } catch (e) { console.error(e); }
}

async function respondRequest(requestId, status) {
    try {
        const res = await fetch(`http://localhost:8081/api/trainer-client/respond?requestId=${requestId}&status=${status}`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        if (res.ok) {
            loadPendingRequests();
            loadClients();
        }
    } catch (e) { console.error(e); }
}

// --- Modals ---

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

async function openWorkoutModal(relId, name, readOnly = false) {
    activeRelationshipId = relId;
    document.getElementById('workoutClientName').textContent = name + (readOnly ? ' (History)' : '');

    const form = document.getElementById('workoutForm');
    const list = document.getElementById('workoutHistoryList');
    const btnSubmit = document.getElementById('btnSubmitWorkout');

    // Reset Form
    document.getElementById('workoutTitle').value = '';
    document.getElementById('workoutOverview').value = '';
    document.getElementById('workoutExercises').value = '';

    if (readOnly) {
        // Toggle Views
        form.style.display = 'none';
        list.style.display = 'block';
        if (btnSubmit) btnSubmit.style.display = 'none';

        list.innerHTML = '<p style="text-align:center; color:#666;">Loading history...</p>';

        // Fetch
        try {
            const res = await fetch(`http://localhost:8081/api/plans/workout/${relId}`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            if (res.ok) {
                const plans = await res.json();
                list.innerHTML = '';

                if (plans.length === 0) {
                    list.innerHTML = '<p style="text-align:center; color:#aaa;">No past workouts found.</p>';
                    return;
                }

                plans.forEach(p => {
                    const date = new Date(p.assignedAt).toLocaleDateString();
                    const div = document.createElement('div');
                    div.style.cssText = "background:#222; border:1px solid #333; padding:15px; border-radius:8px; margin-bottom:10px;";
                    div.innerHTML = `
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <strong style="color:#18b046; font-size:14px;">${p.title}</strong>
                            <span style="font-size:11px; color:#888;">${date}</span>
                        </div>
                        <div style="font-size:13px; color:#ddd; margin-bottom:8px;">
                            <span style="color:#aaa; font-size:11px; text-transform:uppercase; font-weight:bold;">Overview:</span><br>
                            ${p.overview || '-'}
                        </div>
                         <div style="font-size:13px; color:#ddd;">
                            <span style="color:#aaa; font-size:11px; text-transform:uppercase; font-weight:bold;">Exercises:</span><br>
                            <pre style="font-family:inherit; white-space:pre-wrap; margin:0;">${p.exercises}</pre>
                        </div>
                    `;
                    list.appendChild(div);
                });
            }
        } catch (e) { console.error(e); list.innerHTML = '<p style="color:red;">Error loading history.</p>'; }

    } else {
        // Assign Mode
        form.style.display = 'block';
        list.style.display = 'none';
        if (btnSubmit) btnSubmit.style.display = 'inline-block';
    }

    const modal = document.getElementById('workoutModal');
    modal.style.display = 'flex';
}

async function openDietModal(relId, name, readOnly = false) {
    activeRelationshipId = relId;
    document.getElementById('dietClientName').textContent = name + (readOnly ? ' (History)' : '');

    const form = document.getElementById('dietForm');
    const list = document.getElementById('dietHistoryList');
    const btnSubmit = document.getElementById('btnSubmitDiet');

    // Reset
    document.getElementById('dietTitle').value = '';
    document.getElementById('dietCalories').value = '';
    document.getElementById('dietMeals').value = '';

    if (readOnly) {
        form.style.display = 'none';
        list.style.display = 'block';
        if (btnSubmit) btnSubmit.style.display = 'none';

        list.innerHTML = '<p style="text-align:center; color:#666;">Loading history...</p>';

        try {
            const res = await fetch(`http://localhost:8081/api/plans/meal/${relId}`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            if (res.ok) {
                const plans = await res.json();
                list.innerHTML = '';
                if (plans.length === 0) {
                    list.innerHTML = '<p style="text-align:center; color:#aaa;">No past meal plans.</p>';
                    return;
                }
                plans.forEach(p => {
                    const date = new Date(p.assignedAt).toLocaleDateString();
                    const div = document.createElement('div');
                    div.style.cssText = "background:#222; border:1px solid #333; padding:15px; border-radius:8px; margin-bottom:10px;";
                    div.innerHTML = `
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <strong style="color:#ff9800; font-size:14px;">${p.title}</strong>
                            <span style="font-size:11px; color:#888;">${date}</span>
                        </div>
                         <div style="font-size:13px; color:#ddd; margin-bottom:8px;">
                            <span style="color:#aaa; font-size:11px; text-transform:uppercase; font-weight:bold;">Calorie Target:</span> ${p.dailyCalorieTarget}
                        </div>
                         <div style="font-size:13px; color:#ddd;">
                            <span style="color:#aaa; font-size:11px; text-transform:uppercase; font-weight:bold;">Meals:</span><br>
                            <pre style="font-family:inherit; white-space:pre-wrap; margin:0;">${p.meals}</pre>
                        </div>
                    `;
                    list.appendChild(div);
                });
            }
        } catch (e) { console.error(e); list.innerHTML = '<p style="color:red;">Error loading history.</p>'; }
    } else {
        form.style.display = 'block';
        list.style.display = 'none';
        if (btnSubmit) btnSubmit.style.display = 'inline-block';
    }

    const modal = document.getElementById('dietModal');
    modal.style.display = 'flex';
}

async function submitWorkoutPlan() {
    if (!activeRelationshipId) return;

    const title = document.getElementById('workoutTitle').value;
    const overview = document.getElementById('workoutOverview').value;
    const exercises = document.getElementById('workoutExercises').value;

    if (!title || !exercises) { alert("Please fill details"); return; }

    try {
        const res = await fetch(`http://localhost:8081/api/plans/workout`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                relationshipId: activeRelationshipId,
                title, overview, exercises
            })
        });
        if (res.ok) {
            alert("Workout Assigned!");
            closeModal('workoutModal');
        }
    } catch (e) { console.error(e); }
}

// Duplicate function 'openDietModal' removed. 


async function submitDietPlan() {
    if (!activeRelationshipId) return;

    const title = document.getElementById('dietTitle').value;
    const calories = document.getElementById('dietCalories').value;
    const meals = document.getElementById('dietMeals').value;

    if (!title || !meals) { alert("Please fill details"); return; }

    try {
        const res = await fetch(`http://localhost:8081/api/plans/meal`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                relationshipId: activeRelationshipId,
                title, dailyCalorieTarget: calories, meals
            })
        });
        if (res.ok) {
            alert("Diet Assigned!");
            closeModal('dietModal');
        }
    } catch (e) { console.error(e); }
}

// --- Chat ---

// function openChat removed (duplicate)

async function loadTrainerChat() {
    const box = document.getElementById('trainerChatMessages');
    box.innerHTML = 'Loading...';

    try {
        const res = await fetch(`http://localhost:8081/api/chat/${activeRelationshipId}`, {
            headers: { "Authorization": "Bearer " + localStorage.getItem('token') }
        });
        if (res.ok) {
            const msgs = await res.json();
            box.innerHTML = '';
            msgs.forEach(msg => {
                const div = document.createElement("div");
                const isMe = (msg.senderType === 'TRAINER');

                div.className = `chat-msg ${isMe ? 'me' : 'them'}`;

                // Timestamp logic
                let timeStr = "";
                if (msg.sentAt) {
                    const date = new Date(msg.sentAt);
                    timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                div.innerHTML = `
                    <div style="margin-bottom:2px;">${msg.message}</div>
                    <div style="font-size: 10px; opacity: 0.7; text-align: right; margin-top: 2px;">${timeStr}</div>
                `;
                box.appendChild(div);
            });
            box.scrollTop = box.scrollHeight;
        }
    } catch (e) { console.error(e); }
}

async function sendTrainerMessage() {
    const input = document.getElementById('trainerChatInput');
    const msg = input.value.trim();
    if (!msg || !activeRelationshipId) return;

    const trainerName = localStorage.getItem('fullName');
    const trainerId = localStorage.getItem('userId');

    try {
        const res = await fetch(`http://localhost:8081/api/chat`, {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + localStorage.getItem('token'),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                relationshipId: activeRelationshipId,
                senderId: trainerId,
                senderType: "TRAINER",
                senderName: trainerName,
                message: msg
            })
        });

        if (res.ok) {
            input.value = '';
            loadTrainerChat();
        }
    } catch (e) { console.error(e); }
}

// --- Add Client ---

function openAddClientModal() {
    document.getElementById('addClientEmail').value = '';
    document.getElementById('addClientModal').style.display = 'flex';
}

async function submitAddClient() {
    const email = document.getElementById('addClientEmail').value.trim();
    if (!email) { alert("Please enter an email"); return; }

    // Simple email regex logic check if desired, or let backend handle it

    try {
        const res = await fetch(`http://localhost:8081/api/trainer-client/add?trainerId=${currentTrainerId}&userEmail=${email}`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });

        if (res.ok) {
            alert("Client Added Successfully!");
            closeModal('addClientModal');
            loadClients(); // Refresh list and stats
        } else {
            const err = await res.text();
            alert("Failed to add: " + err);
        }
    } catch (e) { console.error(e); alert("Network Error"); }
}
