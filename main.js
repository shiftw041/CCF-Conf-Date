document.addEventListener('DOMContentLoaded', () => {
    fetchConferenceData();
});

async function fetchConferenceData() {
    try {
        const response = await fetch('conferences.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        let conferences = await response.json();

        conferences.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        displayCountdowns(conferences);

    } catch (error) {
        console.error('Error fetching conference data:', error);
        const container = document.getElementById('countdown-container');
        container.innerHTML = '<p>Load data failed, please try again later.</p>';
    }
}

function displayCountdowns(conferences) {
    const container = document.getElementById('countdown-container');
    container.innerHTML = ''; // clear "loading"

    const now = new Date();

    for (const conf of conferences) {
        const startDate = new Date(conf.startDate);

        // count the day
        const diffTime = startDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // show the future confs only
        if (diffDays >= 0) {
            const card = document.createElement('div');
            card.className = 'conference-card';

            let html = `
                <h2><a href="${conf.link || '#'}" target="_blank">${conf.title} ${conf.year}</a></h2>
                <p><strong>place:</strong> ${conf.place || 'N/A'}</p>
                <p><strong>conf date:</strong> ${conf.dateString}</p>
                <p class="countdown-days">
                    ${diffDays === 0 ? 'Start on today！' : `Start in ${diffDays} days！`}
                </p>
            `;

            card.innerHTML = html;
            container.appendChild(card);
        }
    }

    if (container.innerHTML === '') {
        container.innerHTML = '<p>No upcoming meetings currently！</p>';
    }
}
