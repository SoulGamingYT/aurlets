import userPoints from './points';

export default function handler(req, res) {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  res.json({ afkPoints: userPoints[userId] || 0 });
}
