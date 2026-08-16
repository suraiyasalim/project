let currentUser = JSON.parse(localStorage.getItem('user')) || null;

window.addEventListener('DOMContentLoaded', () => {
    updateUserUI();
});

function updateUserUI() {
    const userInfo = document.getElementById('userInfo');
    const authBtn = document.getElementById('authBtn');

    if (currentUser) {
        userInfo.innerText = `Hi, ${currentUser.name}`;
        authBtn.innerText = 'Logout';
        authBtn.onclick = logout;
    } else {
        userInfo.innerText = '';
        authBtn.innerText = 'Login / Register';
        authBtn.onclick = openAuthModal;
    }
}

function openBookingModal(facilityName, facilityId) {
    document.getElementById('modalTitle').innerText = `Book ${facilityName}`;
    document.getElementById('modalFacilityId').value = facilityId;
    document.getElementById('bookingModal').style.display = 'flex';
}

function openAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function toggleAuth(isRegister) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTitle = document.getElementById('authTitle');

    if (isRegister) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authTitle.innerText = 'Register on TurfHub';
    } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        authTitle.innerText = 'Login to TurfHub';
    }
}

// Login Submit
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    const msgElem = document.getElementById('authMsg');

    if (res.ok) {
        currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(currentUser));
        updateUserUI();
        msgElem.style.color = 'green';
        msgElem.innerText = 'Login successful!';
        setTimeout(() => closeModal('authModal'), 1000);
    } else {
        msgElem.style.color = 'red';
        msgElem.innerText = data.error || data.message;
    }
});

// Register Submit
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    const msgElem = document.getElementById('authMsg');

    if (res.ok) {
        msgElem.style.color = 'green';
        msgElem.innerText = 'Registration successful! Please login.';
        setTimeout(() => toggleAuth(false), 1500);
    } else {
        msgElem.style.color = 'red';
        msgElem.innerText = data.error || data.message;
    }
});

function logout() {
    currentUser = null;
    localStorage.removeItem('user');
    updateUserUI();
}

// Booking Submit (Dropdown Slot-wise)
document.getElementById('modalBookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
        alert('Please login first to book a turf!');
        openAuthModal();
        return;
    }

    const facility_id = document.getElementById('modalFacilityId').value;
    const booking_date = document.getElementById('modalBookingDate').value;
    const slotValue = document.getElementById('modalSlot').value;

    const [start_time, end_time] = slotValue.split('-');

    const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: currentUser.id,
            facility_id,
            booking_date,
            start_time,
            end_time
        })
    });

    const data = await res.json();
    const msgElem = document.getElementById('modalMsg');

    if (res.ok) {
        msgElem.style.color = 'green';
        msgElem.innerText = data.message;
        setTimeout(() => {
            closeModal('bookingModal');
            msgElem.innerText = '';
        }, 1500);
    } else {
        msgElem.style.color = 'red';
        msgElem.innerText = data.message;
    }
});

// Fetch & Display User Bookings
async function openMyBookings() {
    if (!currentUser) {
        alert('Please login to view your bookings!');
        openAuthModal();
        return;
    }

    document.getElementById('myBookingsModal').style.display = 'flex';
    const listDiv = document.getElementById('bookingsList');
    listDiv.innerHTML = 'Loading bookings...';

    const res = await fetch(`http://localhost:5000/api/bookings/user/${currentUser.id}`);
    const bookings = await res.json();

    if (bookings.length === 0) {
        listDiv.innerHTML = '<p>No bookings found.</p>';
        return;
    }

    listDiv.innerHTML = bookings.map(b => `
        <div style="background: #f1f5f9; padding: 15px; margin-bottom: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h4 style="margin-bottom: 5px;">${b.facility_name}</h4>
                <p style="font-size: 13px; color: #64748b;">
                    📅 ${b.booking_date.split('T')[0]} | ⏰ ${b.start_time} - ${b.end_time}
                </p>
                <span style="font-size: 12px; font-weight: bold; color: ${b.status === 'confirmed' ? 'green' : 'red'};">
                    ${b.status.toUpperCase()}
                </span>
            </div>
            ${b.status === 'confirmed' ? `<button onclick="cancelBooking(${b.id})" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Cancel</button>` : ''}
        </div>
    `).join('');
}

async function cancelBooking(id) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        await fetch(`http://localhost:5000/api/bookings/${id}`, { method: 'DELETE' });
        openMyBookings();
    }
}