// index.js

const CLIENT_ID = "1410157454137884754"; // replace with your bot's OAuth2 client_id
const REDIRECT_URI = window.location.origin + window.location.pathname; // redirects back here
const API_ENDPOINT = "https://discord.com/api/users/@me";

// DOM targets
const authAreaDesktop = document.getElementById("auth-area-desktop");
const authAreaMobile = document.getElementById("auth-area-mobile");

// Build Discord OAuth2 link
const discordAuthURL =
  `https://discord.com/api/oauth2/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=token&scope=identify`;

// Handle login success (token in URL fragment)
function handleRedirect() {
  const hash = window.location.hash;
  if (hash.includes("access_token")) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    localStorage.setItem("discord_token", accessToken);

    // remove the fragment from URL
    window.location.hash = "";
  }
}

// Fetch user info from Discord API
async function fetchUser(token) {
  const response = await fetch(API_ENDPOINT, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return response.json();
}

// Render login/logout UI
async function renderAuth() {
  const token = localStorage.getItem("discord_token");

  if (!token) {
    // Show login button
    const loginBtn = `<a href="${discordAuthURL}" class="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg hover:scale-105 transition flex items-center gap-2">
      <i class="fab fa-discord"></i> Login with Discord
    </a>`;
    authAreaDesktop.innerHTML = loginBtn;
    authAreaMobile.innerHTML = loginBtn;
    return;
  }

  // Fetch user
  const user = await fetchUser(token);
  if (!user) {
    localStorage.removeItem("discord_token");
    return renderAuth();
  }

  // User info
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  const userUI = `
    <div class="flex items-center gap-2">
      <img src="${avatarUrl}" class="w-8 h-8 rounded-full border border-gray-600" alt="avatar"/>
      <span class="text-sm font-semibold">${user.username}</span>
      <button onclick="logout()" class="px-2 py-1 bg-red-600 rounded text-xs hover:bg-red-700">Logout</button>
    </div>
  `;

  authAreaDesktop.innerHTML = userUI;
  authAreaMobile.innerHTML = userUI;

  // Save for AFK page
  localStorage.setItem("discord_user", JSON.stringify(user));
}

// Logout
function logout() {
  localStorage.removeItem("discord_token");
  localStorage.removeItem("discord_user");
  renderAuth();
}

// --- AFK PAGE HELPER ---
function checkAFKLogin() {
  const userData = localStorage.getItem("discord_user");
  if (!userData) {
    document.body.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-screen text-center text-white bg-black">
        <h1 class="text-2xl font-bold mb-4">You must log in with Discord first!</h1>
        <a href="/" class="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg hover:scale-105 transition">Go to Home</a>
      </div>`;
    return;
  }

  const user = JSON.parse(userData);
  document.body.insertAdjacentHTML("afterbegin", `
    <div class="fixed top-4 right-4 flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg shadow">
      <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64" class="w-6 h-6 rounded-full border border-gray-600"/>
      <span class="text-sm">${user.username}</span>
    </div>
  `);
}

// --- RUN ---
handleRedirect();
renderAuth();

// If this is AFK page, call checkAFKLogin()
if (window.location.pathname.includes("afk.html")) {
  checkAFKLogin();
}
