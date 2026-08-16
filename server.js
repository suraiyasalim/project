const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Binta@1031',
    database: 'campus_sports'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to MySQL Database!');
    }
});

// Root Route - Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Registration API
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required!' });
    }

    // Role dynamic/default na thakle table insert e shudhu name, email, password rakha hoyeche
    const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    
    db.query(query, [name, email, password], (err, result) => {
        if (err) {
            console.error("Database Registration Error:", err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Email already exists!' });
            } else {
                return res.status(500).json({ success: false, message: 'DB Error: ' + (err.sqlMessage || err.message) });
            }
        }
        res.json({ success: true, message: 'User registered successfully!' });
    });
});

// Login API
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    
    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error("Login DB Error:", err);
            return res.status(500).json({ success: false, message: 'Database Error: ' + err.sqlMessage });
        }
        
        if (results.length > 0) {
            const user = results[0];
            res.json({
                success: true,
                user: { 
                    id: user.id, 
                    name: user.name, 
                    email: user.email, 
                    role: user.role || 'user' 
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password!' });
        }
    });
});

// Fetch All Facilities API
app.get('/api/facilities', (req, res) => {
    db.query('SELECT * FROM facilities', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Fetch Single Facility Details API
app.get('/api/facilities/:id', (req, res) => {
    db.query('SELECT * FROM facilities WHERE id = ?', [req.params.id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: 'Facility not found' });
        res.json(results[0]);
    });
});

// Enable All Facilities (Admin)
app.patch('/api/facilities/enable-all', (req, res) => {
    db.query('UPDATE facilities SET is_available = 1', (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Update Facility Status (Admin)
app.patch('/api/facilities/:id/status', (req, res) => {
    const { is_available } = req.body;
    db.query('UPDATE facilities SET is_available = ? WHERE id = ?', [is_available, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Book Slot API
app.post('/api/bookings', (req, res) => {
    const { user_id, facility_id, booking_date, booking_time, price } = req.body;
    if (!user_id) return res.status(401).json({ success: false, message: 'Unauthorized! Please login.' });

    const query = 'INSERT INTO bookings (user_id, facility_id, booking_date, booking_time, price) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [user_id, facility_id, booking_date, booking_time, price], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Booking confirmed!' });
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));