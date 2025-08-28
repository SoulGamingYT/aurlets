// pages/api/points.js
let userPoints = {}; // { userId: points }

export default function handler(req, res) {
  const userCookie = req.cookies.user;
  if (!userCookie) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const user = JSON.parse(userCookie);
  const userId = user.id;

  if (req.method === "GET") {
    return res.json({ points: userPoints[userId] || 0 });
  }

  if (req.method === "POST") {
    userPoints[userId] = (userPoints[userId] || 0) + 1;
    return res.json({ points: userPoints[userId] });
  }

  res.status(405).end();
}
