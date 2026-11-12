// Home page header menu and footer year.
import {setLabel} from './display.js';
const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  setLabel(menuToggle,'打开导航');
  mobileNav.hidden = true;
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!open));
  setLabel(menuToggle,open ? '打开导航' : '关闭导航');
  mobileNav.hidden = open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
document.addEventListener('pi-display-change',()=>setLabel(menuToggle,menuToggle.getAttribute('aria-expanded')==='true'?'关闭导航':'打开导航'));
document.querySelector('#year').textContent = new Date().getFullYear();
