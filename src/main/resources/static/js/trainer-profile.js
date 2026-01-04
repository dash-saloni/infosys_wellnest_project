const API_URL = 'http://localhost:8081/api/trainers';

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = localStorage.getItem('userEmail');
        const formData = new FormData();
        formData.append('email', email);
        formData.append('name', document.getElementById('tName').value);
        formData.append('specialization', document.getElementById('tSpec').value);
        formData.append('bio', document.getElementById('tBio').value);
        formData.append('location', document.getElementById('tLoc').value);
        formData.append('experience', document.getElementById('tExp').value);
        formData.append('availability', document.getElementById('tAvail').value);

        const fileInput = document.getElementById('tImage');
        if (fileInput.files.length > 0) {
            formData.append('image', fileInput.files[0]);
        }

        try {
            const res = await fetch(`${API_URL}/update`, {
                method: 'PUT',
                body: formData
            });

            if (res.ok) {
                alert("Profile updated successfully!");
                location.reload();
            } else {
                alert("Update failed.");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating profile.");
        }
    });

    // Image preview
    document.getElementById('tImage').addEventListener('change', function (e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('previewImg').src = e.target.result;
            }
            reader.readAsDataURL(this.files[0]);
        }
    });
});

async function loadProfile() {
    const email = localStorage.getItem('userEmail');
    if (!email) {
        alert("Not logged in!");
        window.location.href = "login.html";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/profile?email=${email}`);
        if (!res.ok) throw new Error("Failed to load profile");
        const t = await res.json();

        document.getElementById('tName').value = t.name;
        document.getElementById('tSpec').value = t.specialization;
        document.getElementById('tBio').value = t.bio;
        document.getElementById('tLoc').value = t.location;
        document.getElementById('tExp').value = t.experienceYears;
        document.getElementById('tAvail').value = t.availability;

        if (t.imageUrl) {
            document.getElementById('previewImg').src = t.imageUrl;
        }

    } catch (e) {
        console.error(e);
        alert("Could not load profile data.");
    }
}
