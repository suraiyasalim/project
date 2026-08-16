const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all sports facilities
router.get('/', async (req, res) => {
    try {
        const [facilities] = await db.execute('SELECT * FROM facilities');
        res.json(facilities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;