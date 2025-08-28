const DISCORD_CLIENT_ID = "1410157454137884754";
const REDIRECT_URI = "https://aurlets.vercel.app/api/callback";
const OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;

const loginBtn = document.getElementById("login-btn");
const userInfo = document.getElementById("user-info");

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    window.location.href = OAUTH_URL;
  });
}

async function fetchUser() {
  try {
    const res = await fetch("/api/user");
    if (!res.ok) throw new Error("Not logged in");
    const data = await res.json();

    localStorage.setItem("discordUser", JSON.stringify(data));
    showUser(data);

    setTimeout(() => {
      window.location.href = "/afk.html";
    }, 5000);
  } catch (err) {
    console.log("No session:", err);
    localStorage.removeItem("discordUser");
  }
}

function showUser(user) {
  if (!userInfo) return;

  if (loginBtn) loginBtn.style.display = "none";

  userInfo.innerHTML = `
    <div class="flex items-center gap-2">
      <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" 
           alt="Avatar" class="w-8 h-8 rounded-full border border-white/20"/>
      <span class="text-white font-medium">${user.username}#${user.discriminator}</span>
    </div>
  `;
  userInfo.classList.remove("hidden");
  userInfo.style.display = "flex";
}

window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("discordUser");
  if (saved) {
    showUser(JSON.parse(saved));
  } else {
    fetchUser();
  }
});
