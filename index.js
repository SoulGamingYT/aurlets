// ================== CONFIG ==================
const CLIENT_ID = "1410157454137884754";
const REDIRECT_URI = "https://aurlets.vercel.app/api/callback";
const API_BASE = "https://discord.com/api";
const OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
  REDIRECT_URI
)}&response_type=code&scope=identify`;

// ================== HELPERS ==================
function setUser(user) {
  const loginBtn = document.getElementById("login-btn");
  const userBox = document.getElementById("user-box");

  if (user) {
    loginBtn.style.display = "none";
    userBox.innerHTML = `
      <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" 
           alt="avatar" class="w-10 h-10 rounded-full inline-block">
      <span class="ml-2 font-bold text-white">${user.username}#${user.discriminator}</span>
    `;
    userBox.style.display = "flex";
  } else {
    loginBtn.style.display = "block";
    userBox.style.display = "none";
  }
}

async function getUserInfo(token) {
  const res = await fetch(`${API_BASE}/users/@me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return await res.json();
}

// ================== MAIN FLOW ==================
document.addEventListener("DOMContentLoaded", async () => {
  const loginBtn = document.getElementById("login-btn");
  const userBox = document.getElementById("user-box");

  loginBtn.addEventListener("click", () => {
    window.location.href = OAUTH_URL;
  });

  // 1. Check if we already have a token
  let token = localStorage.getItem("discord_token");
  if (token) {
    const user = await getUserInfo(token);
    if (user) {
      setUser(user);
      return;
    } else {
      localStorage.removeItem("discord_token"); // invalid token
    }
  }

  // 2. If redirected from Discord OAuth2 with ?code=...
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  if (code) {
    try {
      // Exchange code for token via backend
      const res = await fetch(`/api/callback?code=${code}`);
      const data = await res.json();

      if (data.access_token) {
        localStorage.setItem("discord_token", data.access_token);
        const user = await getUserInfo(data.access_token);
        setUser(user);

        // redirect to homepage clean URL
        setTimeout(() => {
          window.location.href = "/";
        }, 3000);
      }
    } catch (err) {
      console.error("OAuth2 Error:", err);
    }
  } else {
    setUser(null);
  }
});
