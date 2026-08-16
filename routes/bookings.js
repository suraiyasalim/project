const express = require('express');
const router = express.Router();
const db = require('../db');

// ১. নির্দিষ্ট ইউজারের বুকিং ফেচ করা (My Bookings)
router.get('/user/:userId', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT b.id, f.name as facility_name, b.booking_date, b.start_time, b.end_time, b.status 
             FROM bookings b
             JOIN facilities f ON b.facility_id = f.id
             WHERE b.user_id = ? 
             ORDER BY b.id DESC`,
            [req.params.userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ২. বুকিং ক্যানসেল করা
router.delete('/:id', async (req, res) => {
    try {
        await db.execute(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, [req.params.id]);
        res.json({ message: 'Booking cancelled successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ৩. নতুন বুকিং (Overlapping & Time Restriction)
router.post('/', async (req, res) => {
    const { user_id, facility_id, booking_date, start_time, end_time } = req.body;

    // টার্ফের সময়ের (০৮:০০ AM - ২০:০০ PM) বাইরের বুকিং আটকানো
    if (start_time < '08:00:00' || end_time > '20:00:00') {
        return res.status(400).json({ message: 'Turf is open only from 8:00 AM to 8:00 PM.' });
    }

    try {
        // ওভারল্যাপ কুয়েরি
        const [conflicts] = await db.execute(
            `SELECT * FROM bookings 
             WHERE facility_id = ? 
             AND booking_date = ? 
             AND status = 'confirmed'
             AND (start_time < ? AND end_time > ?)`,
            [facility_id, booking_date, end_time, start_time]
        );

        if (conflicts.length > 0) {
            return res.status(400).json({ message: 'Sorry! This slot is already booked. Choose another time.' });
        }

        // বুকিং ইনসার্ট
        await db.execute(
            `INSERT INTO bookings (user_id, facility_id, booking_date, start_time, end_time) 
             VALUES (?, ?, ?, ?, ?)`,
            [user_id, facility_id, booking_date, start_time, end_time]
        );

        res.status(201).json({ message: 'Booking confirmed successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;