import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let selectedIndex = -1;
let query = '';
let selectedYear = null;

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');

function getFilteredProjects() {
    let filtered = projects;

    if (query) {
        filtered = filtered.filter(project => {
            let values = Object.values(project).join('\n').toLowerCase();
            return values.includes(query.toLowerCase());
        });
    }
    
    if (selectedYear) {
        filtered = filtered.filter(project => project.year === selectedYear);
    }
    
    return filtered;
}

function renderPieChart(projectsToShow) {
    let rolledData = d3.rollups(
        projectsToShow,
        v => v.length,
        d => d.year
    );

    let data = rolledData.map(([year, count]) => ({
        value: count,
        label: year
    }));

    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let sliceGenerator = d3.pie().value(d => d.value);
    let arcData = sliceGenerator(data);
    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    let svg = d3.select('#projects-plot');
    svg.selectAll('path').remove();
    d3.select('.legend').selectAll('li').remove();

    arcData.forEach((d, i) => {
        svg.append('path')
            .attr('d', arcGenerator(d))
            .attr('fill', colors(i))
            .attr('class', data[i].label === selectedYear ? 'selected' : '')
            .on('click', () => {
                if (selectedYear === data[i].label) {
                    selectedYear = null;  // Deselect if clicking same year
                } else {
                    selectedYear = data[i].label;  // Select new year
                }
                
                // Update visualizations
                let filtered = getFilteredProjects();
                renderProjects(filtered, projectsContainer, 'h2');
                renderPieChart(filtered);
            });
    });

    let legend = d3.select('.legend');
    data.forEach((d, i) => {
        legend.append('li')
            .attr('style', `--color:${colors(i)}`)
            .attr('class', d.label === selectedYear ? 'selected' : '')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
}

let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    let filtered = getFilteredProjects();
    renderProjects(filtered, projectsContainer, 'h2');
    renderPieChart(filtered);
});

if (projectsTitle) {
    projectsTitle.textContent = `${projects.length} Projects`;
}
let filtered = getFilteredProjects();
renderProjects(filtered, projectsContainer, 'h2');
renderPieChart(filtered);