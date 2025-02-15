console.log('IT\'S ALIVE!');
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/aaadit24', title: 'GitHub' },
  { url: 'resume/', title: 'Resume' },
  { url: 'meta/', title: 'Meta' }

];

const ARE_WE_HOME = document.documentElement.classList.contains('home');

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  
  if (!ARE_WE_HOME && !url.startsWith('http')) {
    url = '../' + url;
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

    // Get reference to select element
    const select = document.querySelector('.color-scheme select');

    // Set initial value from localStorage if it exists
    if ("colorScheme" in localStorage) {
    const savedScheme = localStorage.colorScheme;
    document.documentElement.style.setProperty('color-scheme', savedScheme);
    select.value = savedScheme;
    }

    // Handle theme changes
    select.addEventListener('input', function(event) {
    const newScheme = event.target.value;
    document.documentElement.style.setProperty('color-scheme', newScheme);
    localStorage.colorScheme = newScheme;
    });

export async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    return response.json();
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    containerElement.innerHTML = '';
    
    projects.forEach(project => {
        const article = document.createElement('article');
        article.innerHTML = `
            <${headingLevel}>${project.title}</${headingLevel}>
            <img src="${project.image}" alt="${project.title}">
            <div class="project-content">
                <p>${project.description}</p>
                <p class="project-year">${project.year}</p>
            </div>
        `;
        containerElement.appendChild(article);
    });
}

export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
}