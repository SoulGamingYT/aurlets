import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Discord OAuth settings
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:3000/callback";

// Step 1: Redirect user to Discord login
app.get("/login", (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=identify%20email`;
  res.redirect(url);
});

// Step 2: Discord redirects back with code → exchange for access token
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("No code provided");

  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      scope: "identify email",
    });

    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    res.json(userResponse.data); // shows user info (id, username, avatar, etc.)
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("Error during Discord login");
  }
});

// Default route
app.get("/", (req, res) => res.send("Backend is running"));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
