export default function handler(req, res) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/user=([^;]+)/);

  if (!match) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const user = JSON.parse(decodeURIComponent(match[1]));
  res.status(200).json(user);
}
