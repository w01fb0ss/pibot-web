// roles.pibot.space: the website's header menu and footer year (site.js without its download
// statistics), plus search and category filters on the library page.
import { setLabel } from "./display.js";

const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("#mobile-nav");
function closeMenu() {
  menuToggle?.setAttribute("aria-expanded", "false");
  if (menuToggle) setLabel(menuToggle, "打开导航");
  if (mobileNav) mobileNav.hidden = true;
}
menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  setLabel(menuToggle, open ? "打开导航" : "关闭导航");
  if (mobileNav) mobileNav.hidden = open;
});
for (const link of mobileNav?.querySelectorAll("a") ?? [])
  link.addEventListener("click", closeMenu);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) closeMenu();
});
const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());

const search = document.querySelector("[data-search]");
if (search) {
  const cards = [...document.querySelectorAll(".role-card")];
  const buttons = [...document.querySelectorAll("[data-filter]")];
  let filter = "all";
  const apply = () => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    for (const card of cards) {
      const ok =
        (filter === "all" || card.dataset.category === filter) &&
        (!query || card.dataset.text.includes(query));
      card.hidden = !ok;
      if (ok) shown++;
    }
    for (const block of document.querySelectorAll("[data-block]"))
      block.hidden = ![...block.querySelectorAll(".role-card")].some((card) => !card.hidden);
    document.querySelector("[data-empty]").hidden = shown > 0;
  };
  search.addEventListener("input", apply);
  for (const button of buttons)
    button.addEventListener("click", () => {
      filter = button.dataset.filter;
      for (const other of buttons) other.setAttribute("aria-pressed", String(other === button));
      apply();
    });
}
