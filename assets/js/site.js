const body = document.body;
const header = document.querySelector("[data-site-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const primaryNav = document.querySelector("[data-primary-nav]");
const playlistStage = document.querySelector("[data-playlist-stage]");
const playerTarget = document.querySelector("[data-player-target]");
const closePlayer = document.querySelector("[data-close-player]");

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

const closeNav = () => {
  body.classList.remove("nav-open");
  primaryNav?.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
};

navToggle?.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  body.classList.toggle("nav-open", !isOpen);
  primaryNav?.classList.toggle("is-open", !isOpen);
});

primaryNav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    closeNav();
  }
});

document.querySelectorAll("[data-playlist]").forEach((button) => {
  button.addEventListener("click", () => {
    const playlistId = button.getAttribute("data-playlist");
    if (!playlistId || !playlistStage || !playerTarget) return;

    playerTarget.innerHTML = `
      <iframe
        src="https://www.youtube.com/embed/videoseries?list=${playlistId}&rel=0"
        title="A Funeral Star album playlist"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
      </iframe>
    `;

    playlistStage.hidden = false;
    closePlayer?.focus();
  });
});

const hidePlayer = () => {
  if (!playlistStage || !playerTarget) return;
  playlistStage.hidden = true;
  playerTarget.innerHTML = "";
};

closePlayer?.addEventListener("click", hidePlayer);

playlistStage?.addEventListener("click", (event) => {
  if (event.target === playlistStage) {
    hidePlayer();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNav();
    hidePlayer();
  }
});

window.addEventListener("scroll", setHeaderState, { passive: true });
setHeaderState();
