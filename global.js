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

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url
  
  if (!ARE_WE_HOME) {
    console.log('Works')
    url = '../' + url;
  }
  else {
    url = 'Portfolio/' + url;
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

document.body.insertAdjacentHTML(
    'afterbegin',
    `<label class="color-scheme">
      Theme:
      <select>
        <option value="light dark">Automatic (${matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light"})</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>`
  );
  
  const select = document.querySelector('.color-scheme select');
  
  if ("colorScheme" in localStorage) {
    const savedScheme = localStorage.colorScheme;
    document.documentElement.style.setProperty('color-scheme', savedScheme);
    select.value = savedScheme;
  }
  
  select.addEventListener('input', function(event) {
    const newScheme = event.target.value;
    document.documentElement.style.setProperty('color-scheme', newScheme);
    localStorage.colorScheme = newScheme;
  });