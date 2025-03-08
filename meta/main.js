let data = [];
let commits = [];
let selectedCommits = []; // New top-level variable
let filteredCommits = []; // Variable to store filtered commits
let fileTypeColors; // Declare color scale globally

const width = 1000;
const height = 600;
let xScale, yScale;

// Scrollytelling variables
let NUM_ITEMS = 0; // Will be set to commits.length
let ITEM_HEIGHT = 90; // Height for each item
let VISIBLE_COUNT = 10; // Number of visible items
let totalHeight = 0; // Will be calculated

function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (!link || !date || !time || !author || !lines) return;
  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
  time.textContent = commit.time;
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  if (tooltip) tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  if (tooltip) {
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
  }
}

async function loadData() {
  try {
    console.log('Loading data...');
    data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line),
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    
    console.log('Data loaded successfully:', data.length, 'rows');
    
    // Initialize the color scale
    fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
    
    displayStats();
    processCommits();
    
    console.log('Commits processed:', commits.length);
    
    // Initialize scatterplot
    createScatterplot();
    
    // Initialize scrollytelling after everything else
    initScrollytelling();
    
    // Initialize file visualization
    displayCommitFiles(filteredCommits);
    
    console.log('Initialization complete');
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function processCommits() {
  commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/aaadit24/Portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        configurable: true,
        writable: true,
        enumerable: false
      });

      return ret;
    });
  
  // Sort commits by datetime
  commits.sort((a, b) => a.datetime - b.datetime);
  
  // Set initial filteredCommits to all commits
  filteredCommits = [...commits];
}

function displayStats() {
  const statsDiv = document.getElementById('stats');
  if (!statsDiv) {
    console.error('Stats div not found');
    return;
  }
  
  d3.select('#stats').html(''); // Clear any existing content
  
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);
  
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);
  
  dl.append('dt').text('Number of files');
  dl.append('dd').text(d3.group(data, d => d.file).size);
  
  dl.append('dt').text('Maximum file length');
  const maxLength = d3.max(d3.groups(data, d => d.file), 
    group => d3.max(group[1], d => d.line));
  dl.append('dd').text(maxLength);
}

// Scrollytelling functions exactly as specified in requirements

// Focus only on fixing the scroll container on the left

function initScrollytelling() {
  // Check if elements exist
  const scrollContainer = document.getElementById('scroll-container');
  const itemsContainer = document.getElementById('items-container');
  
  if (!scrollContainer || !itemsContainer) {
    console.error('Scrollytelling elements not found');
    return;
  }
  
  // No need for spacer with normal document flow
  // Remove spacer if it exists
  const spacer = document.getElementById('spacer');
  if (spacer) {
    spacer.remove();
  }
  
  // Create all commit items at once using normal document flow
  d3.select('#items-container').selectAll('.item').remove();
  
  // Create items for all commits
  d3.select('#items-container')
    .selectAll('.item')
    .data(commits)
    .enter()
    .append('div')
    .attr('class', 'item')
    .attr('data-index', (d, i) => i) // Store the index for easy reference
    .html((d, i) => {
      const fileCount = d.lines ? d3.rollups(d.lines, D => D.length, d => d.file).length : '?';
      return `
        <p>
          On ${d.datetime.toLocaleString("en", {dateStyle: "full", timeStyle: "short"})}, I made
          <a href="${d.url}" target="_blank">
            ${i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
          </a>. I edited ${d.totalLines} lines across 
          ${fileCount} files. Then I looked over all I had made, and I saw that it was very good.
        </p>
      `;
    });
  
  // Track the highest index seen so far
  let highestIndexSeen = -1;
  
  // Set up scroll event to update visualization
  scrollContainer.addEventListener('scroll', function() {
    // Get all items
    const items = itemsContainer.querySelectorAll('.item');
    if (items.length === 0) return;
    
    // Determine which items are currently visible
    const containerTop = this.scrollTop;
    const containerBottom = containerTop + this.clientHeight;
    
    // Find the highest visible index
    let currentHighestIndex = -1;
    
    items.forEach((item) => {
      const itemTop = item.offsetTop;
      const itemBottom = itemTop + item.offsetHeight;
      const index = parseInt(item.getAttribute('data-index'));
      
      // Check if item is visible
      if (itemBottom > containerTop && itemTop < containerBottom) {
        currentHighestIndex = Math.max(currentHighestIndex, index);
      }
    });
    
    // If the current highest visible index has changed, update the visualization
    if (currentHighestIndex !== highestIndexSeen) {
      // Update to show all commits from 0 to the highest visible index
      const visibleCommits = commits.slice(0, currentHighestIndex + 1);
      
      // Update visualizations
      updateScatterplot(visibleCommits);
      
      // Update file visualization if needed
      if (typeof displayCommitFiles === 'function') {
        displayCommitFiles(visibleCommits);
      }
      
      // Update the highest index seen
      highestIndexSeen = currentHighestIndex;
    }
  });
  
  // Initial update
  scrollContainer.dispatchEvent(new Event('scroll'));
}

function renderItems(startIndex) {
  // Clear previous items
  const itemsContainer = d3.select('#items-container');
  itemsContainer.selectAll('.item').remove();
  
  // Get slice of commits to display - ensure we don't go past the end
  const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
  let newCommitSlice = commits.slice(startIndex, endIndex);
  
  if (newCommitSlice.length === 0) return;
  
  // Update scatterplot with the visible commits
  updateScatterplot(newCommitSlice);
  
  // Create items with absolute positioning
  itemsContainer.selectAll('.item')
    .data(newCommitSlice)
    .enter()
    .append('div')
    .attr('class', 'item')
    .html((d, i) => {
      const fileCount = d.lines ? d3.rollups(d.lines, D => D.length, d => d.file).length : '?';
      return `
        <p>
          On ${d.datetime.toLocaleString("en", {dateStyle: "full", timeStyle: "short"})}, I made
          <a href="${d.url}" target="_blank">
            ${startIndex + i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
          </a>. I edited ${d.totalLines} lines across 
          ${fileCount} files. Then I looked over all I had made, and I saw that it was very good.
        </p>
      `;
    })
    .style('position', 'absolute')
    .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`);
}

function createScatterplot() {
  const chartDiv = document.getElementById('chart');
  if (!chartDiv) return;
  
  // Clear any existing SVG
  d3.select('#chart').html('');
  
  // Define scales for the first time
  const margin = { top: 30, right: 40, bottom: 50, left: 60 };
  
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
  
  // Create the SVG element
  const svg = d3.select('#chart')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`);
  
  // y-scale only defined once
  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);
  
  // Create x-scale
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();
  
  // Add gridlines
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  gridlines.call(
    d3.axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usableArea.width)
  );
  
  // Add axes
  svg
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(d3.axisBottom(xScale));

  svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale)
      .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00'));
  
  // Create dots group
  svg.append('g').attr('class', 'dots');
  
  // Set up brush
  brushSelector();
  
  // Update with all commits initially
  updateScatterplot(filteredCommits);
}

function updateScatterplot(visibleCommits) {
  if (!visibleCommits || visibleCommits.length === 0) {
    console.error('No visible commits to display in scatterplot');
    return;
  }
  
  const margin = { top: 10, right: 30, bottom: 30, left: 40 };
  
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // Sort commits by total lines in descending order
  const sortedCommits = d3.sort(visibleCommits, (d) => -d.totalLines);

  // Dynamically update x-scale based on visible commits
  xScale = d3
    .scaleTime()
    .domain(d3.extent(visibleCommits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  // Get SVG element
  const svg = d3.select('#chart svg');
  if (svg.empty()) {
    console.error('SVG element not found');
    return;
  }

  // Update the axes when the scale changes
  svg.select('.x-axis')
    .transition()
    .duration(300)
    .call(d3.axisBottom(xScale));
    
  // Update gridlines
  svg.select('.gridlines')
    .transition()
    .duration(300)
    .call(d3.axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usableArea.width));

  // Calculate range of edited lines for visible commits
  const minLines = d3.min(visibleCommits, (d) => d.totalLines) || 1;
  const maxLines = d3.max(visibleCommits, (d) => d.totalLines) || 100;

  // Create radius scale based on visible commits
  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([3, 25])
    .nice();

  // Calculate left edge for exit animation
  const leftEdge = usableArea.left - 50;
  
  // Join pattern with enter/update transitions
  const dots = svg.select('.dots');
  const circles = dots.selectAll('circle')
    .data(sortedCommits, d => d.id); // Key by commit id for better transitions
  
  // Enter new circles - appear at their final position and grow
  circles.enter()
    .append('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', 0) // Start with radius 0
    .style('fill-opacity', 0.7)
    .attr('fill', 'steelblue')
    .on('mouseenter', function(event, d) {
      d3.select(this).style('fill-opacity', 1);
      d3.select(this).classed('selected', isCommitSelected(d));
      updateTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).style('fill-opacity', 0.7);
      d3.select(this).classed('selected', isCommitSelected(d));
      updateTooltipContent({});
      updateTooltipVisibility(false);
    })
    .transition() // Animate only radius
    .duration(300)
    .attr('r', d => rScale(d.totalLines));
  
  // Update existing circles - smooth transition to new positions
  circles.transition()
    .duration(300)
    .attr('cx', d => xScale(d.datetime)) // Smooth transition to new x position
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines));
  
  // Remove circles no longer in the dataset with animation to the left
  circles.exit()
    .transition()
    .duration(300)
    .attr('cx', leftEdge)
    .style('fill-opacity', 0)
    .remove();
}

function brushSelector() {
  const svg = document.querySelector('#chart svg');
  if (!svg) {
    console.error('SVG not found for brush');
    return;
  }
  
  d3.select(svg).call(d3.brush().on('start brush end', brushed));
  d3.select(svg).select('.dots').raise();
  d3.select(svg).selectAll('.selection, .handle').raise();
}

function brushed(event) {
  if (!event.selection) {
    selectedCommits = [];
  } else {
    const brushSelection = event.selection;
    
    selectedCommits = filteredCommits.filter((commit) => {
      const min = { x: brushSelection[0][0], y: brushSelection[0][1] };
      const max = { x: brushSelection[1][0], y: brushSelection[1][1] };
      const x = xScale(commit.datetime);
      const y = yScale(commit.hourFrac);
      
      return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
    });
  }
      
  updateSelection();
  updateSelectionCount();
  updateLanguageBreakdown();
}

function isCommitSelected(commit) {
  return selectedCommits.includes(commit);
}

function updateSelection() {
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
  const countElement = document.getElementById('selection-count');
  if (!countElement) return;
  
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;
}

function updateLanguageBreakdown() {
  const container = document.getElementById('language-breakdown');
  if (!container) return;

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  const requiredCommits = selectedCommits.length ? selectedCommits : filteredCommits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }
}

function displayCommitFiles(commits = filteredCommits) {
  const filesContainer = document.querySelector('.files');
  if (!filesContainer) {
    console.error('Files container not found');
    return;
  }
  
  if (!commits || commits.length === 0) {
    console.warn('No commits to display in files visualization');
    d3.select('.files').html('');
    return;
  }
  
  const lines = commits.flatMap((d) => d.lines);
  
  if (!lines || lines.length === 0) {
    console.warn('No lines to display in files visualization');
    d3.select('.files').html('');
    return;
  }
  
  let files = d3.groups(lines, (d) => d.file).map(([name, lines]) => {
    return { name, lines };
  });
  
  // Sort files by number of lines in descending order
  files = d3.sort(files, (d) => -d.lines.length);
  
  // Clear existing files
  d3.select('.files').selectAll('div').remove();
  
  // Create new file containers
  let filesDivs = d3.select('.files')
    .selectAll('div')
    .data(files)
    .enter()
    .append('div');
  
  // Add file name and line count
  filesDivs.append('dt')
    .html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);
  
  // Add dots for each line
  filesDivs.append('dd')
    .selectAll('div')
    .data(d => d.lines)
    .enter()
    .append('div')
    .attr('class', 'line')
    .style('background', d => fileTypeColors(d.type));
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, initializing...');
  await loadData();
});