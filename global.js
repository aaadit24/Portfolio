console.log('IT\'S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/aaadit24', title: 'GitHub' },
  { url: 'resume/', title: 'Resume' }
];

const ARE_WE_HOME = document.documentElement.classList.contains('home');
const IS_GITHUB_PAGES = location.hostname.includes('github.io');
const BASE_PATH = IS_GITHUB_PAGES ? '/Portfolio/' : '/';

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  
  if (!url.startsWith('http')) {
    if (ARE_WE_HOME) {
      url = BASE_PATH + url;
    } else {
      url = '../' + url;
    }
  }
  
  let a = document.createElement('a');
  a.href = url;
  a.textContent = p.title;
  
  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
  }
  
  if (a.host !== location.host) {
    a.target = "_blank";
  }
  
  nav.append(a);
}