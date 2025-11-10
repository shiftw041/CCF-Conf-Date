// main.js
let allConferences = [];

const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme');

if (currentTheme) {
    document.body.classList.add(currentTheme);
    if (currentTheme === 'dark-mode') {
        themeToggle.textContent = '☀️';
    }
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    let theme = 'light-mode';
    if (document.body.classList.contains('dark-mode')) {
        theme = 'dark-mode';
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }
    localStorage.setItem('theme', theme);
});

const scrollToTopBtn = document.getElementById('scroll-to-top');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollToTopBtn.classList.add('show');
    } else {
        scrollToTopBtn.classList.remove('show');
    }
});

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('search-box').addEventListener('input', renderConferences);
    document.getElementById('filter-sub').addEventListener('change', renderConferences);
    document.getElementById('layout-toggle').addEventListener('click', toggleLayout);
    
    document.getElementById('filter-rank').addEventListener('change', renderConferences);
    
    fetchConferenceData();
});

async function fetchConferenceData() {
    try {
        const response = await fetch('conferences.json?v=' + new Date().getTime());
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        let conferences = await response.json();
        
        const now = new Date();
        now.setHours(0, 0, 0, 0); 

        const validConferences = conferences.filter(conf => {
            if (!conf.endDate) return false;
            const endDate = new Date(conf.endDate);
            return endDate >= now;
        });

        validConferences.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        allConferences = validConferences;

        populateSubFilter(allConferences);
        populateRankFilter(allConferences); 
        
        renderConferences();

    } catch (error) {
        console.error('Error fetching conference data:', error);
        const container = document.getElementById('countdown-container');
        container.innerHTML = '<p>Loading confs data failed, please try again later.</p>';
    }
}

function populateSubFilter(conferences) {
    const subSet = new Set();
    conferences.forEach(conf => {
        if (conf.sub && conf.sub !== 'N/A') {
            subSet.add(conf.sub);
        }
    });

    const filterSub = document.getElementById('filter-sub');
    while (filterSub.options.length > 1) {
        filterSub.remove(1);
    }
    
    [...subSet].sort().forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.textContent = sub;
        filterSub.appendChild(option);
    });
}

function populateRankFilter(conferences) {
    const rankSet = new Set();
    conferences.forEach(conf => {
        rankSet.add(conf.ccfRank || 'N/A'); 
    });

    const filterRank = document.getElementById('filter-rank');
    while (filterRank.options.length > 1) {
        filterRank.remove(1);
    }
    
    const sortedRanks = [...rankSet].sort((a, b) => {
        if (a === 'N/A') return 1;
        if (b === 'N/A') return -1;
        if (a === b) return 0;
        return a < b ? -1 : 1;
    });
    
    sortedRanks.forEach(rank => {
        const option = document.createElement('option');
        option.value = rank;
        option.textContent = rank;
        filterRank.appendChild(option);
    });
}


function renderConferences() {
    const container = document.getElementById('countdown-container');
    
    const subFilter = document.getElementById('filter-sub').value;
    const rankFilter = document.getElementById('filter-rank').value; 
    const searchQuery = document.getElementById('search-box').value.toLowerCase();

    const filteredConferences = allConferences.filter(conf => {
        const subMatch = (subFilter === 'all') || (conf.sub === subFilter);
        const rankMatch = (rankFilter === 'all') || (conf.ccfRank === rankFilter);  
        const searchMatch = (conf.title.toLowerCase().includes(searchQuery));
        
        return subMatch && searchMatch && rankMatch; 
    });

    const now = new Date();
    const ongoingConfs = [];
    const upcomingConfs = [];

    for (const conf of filteredConferences) {
        const startDate = new Date(conf.startDate);
        const endDate = new Date(conf.endDate);
        endDate.setHours(23, 59, 59); 

        if (now >= startDate && now <= endDate) {
            ongoingConfs.push(conf);
        } else if (now < startDate) {
            upcomingConfs.push(conf);
        }
    }

    container.innerHTML = ''; 
    
    if (ongoingConfs.length === 0 && upcomingConfs.length === 0) {
        container.innerHTML = '<p>None</p>';
        return;
    }

    if (ongoingConfs.length > 0) {
        container.innerHTML += '<h2 class="section-header">On going</h2>';
        ongoingConfs.forEach(conf => {
            container.appendChild(createConferenceCard(conf, 'ongoing'));
        });
    }

    if (upcomingConfs.length > 0) {
        container.innerHTML += '<h2 class="section-header">About to start</h2>';
        upcomingConfs.forEach(conf => {
            container.appendChild(createConferenceCard(conf, 'upcoming'));
        });
    }
}

function createConferenceCard(conf, status) {
    const card = document.createElement('div');
    card.className = 'conference-card';

    let statusHTML = '';
    const now = new Date();

    if (status === 'ongoing') {
        statusHTML = `<p class="countdown-status status-ongoing">On going</p>`;
    } else if (status === 'upcoming') {
        const startDate = new Date(conf.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDay = new Date(startDate.getTime());
        startDay.setHours(0, 0, 0, 0);

        const diffTime = startDay - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        statusHTML = `<p class="countdown-status status-countdown">
                        ${diffDays <= 0 ? 'Start on today' : `Start in ${diffDays} days`}
                      </p>`;
    }

    let ccfTag = (conf.ccfRank && conf.ccfRank !== 'N/A')
        ? `<span class="tag tag-rank">CCF ${conf.ccfRank}</span>`
        : '';
    let subTag = (conf.sub && conf.sub !== 'N/A')
        ? `<span class="tag tag-sub">${conf.sub}</span>`
        : '';

    card.innerHTML = `
        <div>
            <h2><a href="${conf.link || '#'}" target="_blank">${conf.title} ${conf.year}</a></h2>
            <div class="tags">
                ${ccfTag}
                ${subTag}
            </div>
            <p><strong>Date:</strong> ${conf.dateString || 'N/A'}</p>
            <p><strong>Place:</strong> ${conf.place || 'N/A'}</p>
        </div>
        ${statusHTML}
    `;
    
    return card;
}


function toggleLayout() {
    const container = document.getElementById('countdown-container');
    const button = document.getElementById('layout-toggle');

    if (container.classList.contains('single-column')) {
        container.classList.remove('single-column');
        container.classList.add('double-column');
        button.textContent = 'single-column';
    } else {
        container.classList.remove('double-column');
        container.classList.add('single-column');
        button.textContent = 'double-column';
    }
}
