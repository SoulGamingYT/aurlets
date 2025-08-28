import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { discordId } = req.body;

  if (!discordId) {
    return res.status(400).json({ error: "Missing discordId" });
  }

  // points.json file to store users
  const filePath = path.join(process.cwd(), "backend", "points.json");
  let data = {};

  // Load existing
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  // Add +1 point
  if (!data[discordId]) {
    data[discordId] = { points: 0 };
  }
  data[discordId].points += 1;

  // Save back
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  res.json({ success: true, points: data[discordId].points });
}
