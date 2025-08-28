const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 1️⃣ Website status endpoint
app.get('/api/status', (req, res) => {
  res.json({ online: true });
});

// 2️⃣ AFK points endpoint
const afkPointsData = {
  "12345": 10,
  "67890": 5
};
app.get('/api/afk/:userId', (req, res) => {
  const userId = req.params.userId;
  res.json({ afkPoints: afkPointsData[userId] || 0 });
});

// 3️⃣ Updates endpoint
const updatesData = [
  { title: "New Feature", description: "AFK system added!" },
  { title: "Website Update", description: "Improved dashboard" }
];
app.get('/api/updates', (req, res) => {
  res.json({ updates: updatesData });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
