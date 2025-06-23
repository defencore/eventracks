// Function to load and parse the schedule
async function loadSchedule() {
    try {
        const response = await fetch('/api/schedule');
        if (!response.ok) {
            throw new Error('Failed to load schedule data');
        }
        const data = await response.json();
        renderSchedule(data);
    } catch (error) {
        document.getElementById('schedule-container').innerHTML = 
            `<div class="error">Error loading schedule: ${error.message}</div>`;
    }
}

// Function to get unique time slots for a day
function getUniqueTimeSlots(sessions) {
    const times = [...new Set(sessions.map(s => s.time))];
    return times.sort((a, b) => {
        const timeA = parseInt(a.split(':')[0]) * 60 + parseInt(a.split(':')[1]);
        const timeB = parseInt(b.split(':')[0]) * 60 + parseInt(b.split(':')[1]);
        return timeA - timeB;
    });
}

// Function to format date from DD.MM.YYYY to "Weekday, DD Month"
function formatDate(dateStr) {
    const parts = dateStr.split('.');
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    
    return `${weekday}, ${day} ${month}`;
}

// Function to render the schedule
function renderSchedule(data) {
    // Update page title if provided
    if (data.title) {
        document.getElementById('page-title').textContent = data.title;
        document.title = data.title;
    }

    const container = document.getElementById('schedule-container');
    container.innerHTML = '';

    // Render each day
    data.days.forEach(day => {
        const dayBlock = document.createElement('div');
        dayBlock.className = 'day-block';

        // Day title
        const dayTitle = document.createElement('h2');
        dayTitle.className = 'day-title';
        dayTitle.textContent = formatDate(day.date);
        dayBlock.appendChild(dayTitle);

        // Day content
        const dayContent = document.createElement('div');
        dayContent.className = 'day-content';

        // Create table
        const table = document.createElement('table');
        table.className = 'schedule-table';

        // Table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Time</th>
                <th>Core A</th>
                <th>Core B</th>
            </tr>
        `;
        table.appendChild(thead);

        // Table body
        const tbody = document.createElement('tbody');
        
        // Get all unique time slots and sort them
        const timeSlots = getUniqueTimeSlots(day.sessions);

        // Create rows for each time slot
        timeSlots.forEach(time => {
            const tr = document.createElement('tr');
            
            // Time column
            const timeCell = document.createElement('td');
            timeCell.className = 'time-column';
            timeCell.textContent = time;
            tr.appendChild(timeCell);

            // Find sessions for this time
            const sessionsAtTime = day.sessions.filter(s => s.time === time);
            
            // Check if there's a session for everyone
            const everyoneSession = sessionsAtTime.find(s => s.track === 'everyone');
            
            if (everyoneSession) {
                // Merged cell for everyone
                const mergedCell = document.createElement('td');
                mergedCell.colSpan = 2;
                mergedCell.className = 'merged-cell';
                mergedCell.innerHTML = createSessionContent(everyoneSession);
                tr.appendChild(mergedCell);
            } else {
                // Separate cells for Core A and Core B
                const coreASession = sessionsAtTime.find(s => s.track === 'coreA');
                const coreBSession = sessionsAtTime.find(s => s.track === 'coreB');
                
                // Core A cell
                const coreACell = document.createElement('td');
                if (coreASession) {
                    coreACell.innerHTML = createSessionContent(coreASession);
                } else {
                    coreACell.className = 'empty-cell';
                }
                tr.appendChild(coreACell);
                
                // Core B cell
                const coreBCell = document.createElement('td');
                if (coreBSession) {
                    coreBCell.innerHTML = createSessionContent(coreBSession);
                } else {
                    coreBCell.className = 'empty-cell';
                }
                tr.appendChild(coreBCell);
            }
            
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        dayContent.appendChild(table);
        dayBlock.appendChild(dayContent);
        container.appendChild(dayBlock);
    });
}

// Function to create session content HTML
function createSessionContent(session) {
    let html = '';
    
    if (session.title) {
        if (session.mainLink) {
            html += `<a href="${session.mainLink}" target="_blank" class="session-title-link">${session.title}</a>`;
        } else {
            html += session.title;
        }
    }
    
    if (session.lecturer) {
        html += `<span class="lecturer">${session.lecturer}</span>`;
    }
    
    if (session.zoomLink || session.discordLink || session.videoLink) {
        html += '<div class="buttons">';
        
        if (session.zoomLink) {
            html += `<a href="${session.zoomLink}" target="_blank" class="btn blue">Zoom link</a>`;
        }
        
        if (session.discordLink) {
            html += `<a href="${session.discordLink}" target="_blank" class="btn discord">Discord</a>`;
        }
        
        if (session.videoLink) {
            html += `<a href="${session.videoLink}" target="_blank" class="btn video">Video</a>`;
        }
        
        html += '</div>';
    }
    
    return html;
}

// Function to show toast notification
function showToast(message) {
    // Create toast element if it doesn't exist
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Function to subscribe to calendar
function subscribeToCalendar() {
    // Check if we're on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // For localhost, offer alternative options
        const message = `For local testing:\n\n` +
            `1. Copy the calendar URL and add it manually to your calendar app\n` +
            `2. Or download the .ics file directly: ${window.location.origin}/calendar.ics\n\n` +
            `Note: Direct subscription (webcal://) works best with a public domain.`;
        
        if (confirm(message + '\n\nWould you like to download the .ics file instead?')) {
            window.location.href = '/calendar.ics';
        }
    } else {
        // For production, use webcal
        window.location.href = webcalUrl;
        
        // Show instructions after a delay
        setTimeout(() => {
            showToast('Calendar subscription initiated. Follow the prompts in your calendar app.');
        }, 1000);
    }
}

// Function to copy URL to clipboard
async function copyUrl() {
    const input = document.getElementById('calendar-url');
    
    try {
        // Try using the modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(input.value);
            showToast('URL copied to clipboard!');
        } else {
            // Fallback for older browsers
            input.select();
            document.execCommand('copy');
            showToast('URL copied to clipboard!');
        }
    } catch (err) {
        console.error('Failed to copy:', err);
        // Final fallback - select the text
        input.select();
        showToast('Press Ctrl+C or Cmd+C to copy');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load the schedule
    loadSchedule();
    
    // Add event listeners
    document.getElementById('subscribe-webcal').addEventListener('click', subscribeToCalendar);
    document.getElementById('copy-url').addEventListener('click', copyUrl);
    
    // Make the URL input selectable on click
    document.getElementById('calendar-url').addEventListener('click', function() {
        this.select();
    });
});