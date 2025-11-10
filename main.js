// main.js

let allConferences = [];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('search-box').addEventListener('input', renderConferences);
    document.getElementById('filter-sub').addEventListener('change', renderConferences);
    document.getElementById('layout-toggle').addEventListener('click', toggleLayout);
    
    fetchConferenceData();
});

async function fetchConferenceData() {
    try {
        const response = await fetch('conferences.json');
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
        
        renderConferences();

    } catch (error) {
        console.error('Error fetching conference data:', error);
        const container = document.getElementById('countdown-container');
        container.innerHTML = '<p>Loading confs date failed, please try again later.</p>';
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

function renderConferences() {
    const container = document.getElementById('countdown-container');
    
    const subFilter = document.getElementById('filter-sub').value;
    const searchQuery = document.getElementById('search-box').value.toLowerCase();

    const filteredConferences = allConferences.filter(conf => {
        const subMatch = (subFilter === 'all') || (conf.sub === subFilter);

        const searchMatch = (conf.title.toLowerCase().includes(searchQuery));
        
        return subMatch && searchMatch;
    });


    container.innerHTML = ''; // 
    
    if (filteredConferences.length === 0) {
        container.innerHTML = '<p>None</p>';
        return;
    }

    const now = new Date();

    for (const conf of filteredConferences) {
        const card = document.createElement('div');
        card.className = 'conference-card';

        const startDate = new Date(conf.startDate);
        const endDate = new Date(conf.endDate);
        endDate.setHours(23, 59, 59); 

        let statusHTML = '';
        
        if (now < startDate) {
            const diffTime = startDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            statusHTML = `<p class="countdown-status status-countdown">
                            ${diffDays === 0 ? 'Start on today' : `Start in ${diffDays} days`}
                          </p>`;
        } else if (now >= startDate && now <= endDate) {
            statusHTML = `<p class="countdown-status status-ongoing">In progress</p>`;
        } else {
             statusHTML = `<p class="countdown-status status-ended">Already ended</p>`;
        }

        let ccfTag = conf.ccfRank && conf.ccfRank !== 'N/A' 
            ? `<span class="tag tag-rank">CCF ${conf.ccfRank}</span>` 
            : '';
        let subTag = conf.sub && conf.sub !== 'N/A' 
            ? `<span class="tag tag-sub">${conf.sub}</span>` 
            : '';

        card.innerHTML = `
            <div>
                <h2><a href="${conf.link || '#'}" target="_blank">${conf.title} ${conf.year}</a></h2>
                <div class="tags">
                    ${ccfTag}
                    ${subTag}
                </div>
                <p><strong>date:</strong> ${conf.dateString || 'N/A'}</p>
                <p><strong>place:</strong> ${conf.place || 'N/A'}</p>
            </div>
            ${statusHTML}
        `;
        
        container.appendChild(card);
    }
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
