const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
  const updatesPath = path.join(__dirname, '../updates.json');
  fs.readFile(updatesPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read updates' });
    const updates = JSON.parse(data);
    res.json({ updates });
  });
});

module.exports = router;
