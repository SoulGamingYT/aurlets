// public/index.js

document.addEventListener("DOMContentLoaded", async () => {
  const loginBtn = document.getElementById("login-btn");
  const userBox = document.getElementById("user-box");

  try {
    // Check if user is logged in
    const res = await fetch("/api/me");
    if (res.ok) {
      const user = await res.json();

      // Hide login button
      loginBtn.classList.add("hidden");
      userBox.classList.remove("hidden");

      // Show avatar + username
      userBox.innerHTML = `
        <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" 
             alt="avatar" class="w-10 h-10 rounded-full mr-2">
        <span class="text-white font-semibold">${user.username}#${user.discriminator}</span>
      `;
    } else {
      // Not logged in
      loginBtn.classList.remove("hidden");
      userBox.classList.add("hidden");
    }
  } catch (err) {
    console.error("Error fetching user:", err);
  }
});

// OPTIONAL: redirect with 5s countdown after login
if (window.location.pathname === "/") {
  const params = new URLSearchParams(window.location.search);
  if (params.get("login") === "success") {
    let countdown = 5;
    const interval = setInterval(() => {
      if (countdown <= 0) {
        clearInterval(interval);
        window.location.href = "/";
      } else {
        console.log(`Redirecting in ${countdown}s...`);
        countdown--;
      }
    }, 1000);
  }
}
