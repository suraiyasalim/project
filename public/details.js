const urlParams = new URLSearchParams(window.location.search);
const facilityId = urlParams.get('id') || 1;
let currentFacilityPrice = 0;
let currentFacilityName = '';
const currentUser = JSON.parse(localStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', async () => {
    if (currentUser) {
        document.getElementById('navAuthSection').innerHTML = `<span style="color:#22c55e;">Hi, ${currentUser.name}</span>`;
    }
    await loadFacilityDetails();
});

async function loadFacilityDetails() {
    const res = await fetch(`http://localhost:5000/api/facilities/${facilityId}`);
    const facility = await res.json();
    document.getElementById('turfName').innerText = facility.name;
    document.getElementById('turfType').innerText = facility.type;
    document.getElementById('turfDesc').innerText = facility.description;
    document.getElementById('slotPrice').innerText = `৳ ${facility.price} BDT`;
    document.getElementById('mainTurfImg').src = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1000&q=80';
    currentFacilityPrice = facility.price;
    currentFacilityName = facility.name;
}

document.getElementById('detailBookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return alert('Please Login first!');

    const booking_date = document.getElementById('bookDate').value;
    const [start_time, end_time] = document.getElementById('bookSlot').value.split('-');
    const payMethod = document.getElementById('payMethod').value;
    const trxId = document.getElementById('trxId').value;

    const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: currentUser.id,
            facility_id: facilityId,
            booking_date,
            start_time,
            end_time,
            amount_paid: currentFacilityPrice,
            transaction_id: trxId
        })
    });

    if (res.ok) {
        document.getElementById('successDetails').innerHTML = `
            📌 <strong>Arena:</strong> ${currentFacilityName}<br>
            📅 <strong>Date:</strong> ${booking_date}<br>
            ⏰ <strong>Slot:</strong> ${start_time} - ${end_time}<br>
            💳 <strong>Paid:</strong> ৳${currentFacilityPrice} BDT (${payMethod})<br>
            🆔 <strong>TrxID:</strong> ${trxId}
        `;
        document.getElementById('thankYouModal').style.display = 'flex';
    } else {
        const data = await res.json();
        alert(data.message);
    }
});

async function openMyBookings() {
    if (!currentUser) return alert('Please Login first!');
    document.getElementById('myBookingsModal').style.display = 'flex';
    const res = await fetch(`http://localhost:5000/api/bookings/user/${currentUser.id}`);
    const bookings = await res.json();
    
    document.getElementById('bookingsList').innerHTML = bookings.map(b => `
        <div style="background:#f1f5f9; padding:10px; margin-bottom:10px; border-radius:6px;">
            <h4>${b.facility_name}</h4>
            <p>${b.booking_date} | ${b.start_time} - ${b.end_time}</p>
            <p style="color:#059669; font-weight:bold;">Paid: ৳${b.amount_paid} BDT (Status: ${b.status})</p>
        </div>
    `).join('');
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }