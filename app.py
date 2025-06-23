#!/usr/bin/env python3
import os
import json
from datetime import datetime
from flask import Flask, render_template, Response, jsonify, request
from werkzeug.middleware.proxy_fix import ProxyFix
import re
import random
import string

# Configuration
DOMAIN = "example.com"  # Change this to your domain
PORT = 5000  # Change this to your desired port
USE_HTTPS = False  # Set to False if not using HTTPS

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app)

def load_schedule():
    """Load schedule from JSON file"""
    schedule_path = os.path.join(app.root_path, 'data', 'schedule.json')
    try:
        with open(schedule_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading schedule: {e}")
        return None

def escape_ics(text):
    """Escape text for ICS format"""
    if not text:
        return ""
    return (text.replace('\\', '\\\\')
                .replace(';', '\\;')
                .replace(',', '\\,')
                .replace('\n', '\\n'))

def parse_date_time(date_str, time_str):
    """Convert date and time strings to ICS format"""
    # Parse date like "DD.MM.YYYY"
    try:
        day, month, year = map(int, date_str.split('.'))
        
        # Parse time like "09:00 - 10:00"
        times = time_str.split(' - ')
        if len(times) == 2:
            start_time = times[0].strip()
            end_time = times[1].strip()
            
            start_hour, start_min = map(int, start_time.split(':'))
            end_hour, end_min = map(int, end_time.split(':'))
            
            # Create datetime strings in YYYYMMDDTHHMMSS format
            start_date = f"{year:04d}{month:02d}{day:02d}T{start_hour:02d}{start_min:02d}00"
            end_date = f"{year:04d}{month:02d}{day:02d}T{end_hour:02d}{end_min:02d}00"
            
            return start_date, end_date
    except:
        pass
    
    # Fallback if parsing fails
    return "20250623T090000", "20250623T100000"

def generate_ics_content(schedule_data):
    """Generate ICS content from schedule data"""
    title = schedule_data.get('title', 'Schedule') if schedule_data else 'Schedule'
    
    ics_lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Calendar//Schedule//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        f'X-WR-CALNAME:{escape_ics(title)}',
        'X-WR-TIMEZONE:Europe/Kiev',
        f'X-WR-CALDESC:{escape_ics(title)}',
        f'REFRESH-INTERVAL;VALUE=DURATION:PT12H'  # Refresh every 12 hours
    ]
    
    if not schedule_data or 'days' not in schedule_data:
        ics_lines.append('END:VCALENDAR')
        return '\r\n'.join(ics_lines)
    
    # Add each session as an event
    for day in schedule_data.get('days', []):
        for session in day.get('sessions', []):
            start_date, end_date = parse_date_time(day['date'], session['time'])
            
            # Generate unique ID using random suffix for uniqueness
            random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=9))
            uid = f"{start_date}-{session.get('track', 'unknown')}-{random_suffix}@aisummerschool"
            
            # Prepare summary
            summary = session.get('title', 'Session')
            if session.get('track') == 'coreA':
                summary = f"[Core A] {summary}"
            elif session.get('track') == 'coreB':
                summary = f"[Core B] {summary}"
            
            # Prepare description
            description_parts = []
            if session.get('lecturer'):
                description_parts.append(f"Lecturer: {session['lecturer']}")
            
            if session.get('track') == 'everyone':
                description_parts.append('Track: For Everyone')
            elif session.get('track') == 'coreA':
                description_parts.append('Track: Core A')
            elif session.get('track') == 'coreB':
                description_parts.append('Track: Core B')
            
            if session.get('zoomLink'):
                description_parts.append(f"Zoom: {session['zoomLink']}")
            
            if session.get('discordLink'):
                description_parts.append(f"Discord: {session['discordLink']}")
            
            if session.get('videoLink'):
                description_parts.append(f"Video: {session['videoLink']}")
            
            # Build event
            ics_lines.extend([
                'BEGIN:VEVENT',
                f'UID:{uid}',
                f'DTSTAMP:{datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")}',
                f'DTSTART:{start_date}',
                f'DTEND:{end_date}',
                f'SUMMARY:{escape_ics(summary)}'
            ])
            
            if description_parts:
                description = escape_ics('\n'.join(description_parts))
                ics_lines.append(f'DESCRIPTION:{description}')
            
            if session.get('mainLink'):
                ics_lines.append(f'URL:{session["mainLink"]}')
            
            ics_lines.extend([
                'LOCATION:Online',
                'STATUS:CONFIRMED',
                'END:VEVENT'
            ])
    
    ics_lines.append('END:VCALENDAR')
    return '\r\n'.join(ics_lines)

@app.route('/')
def index():
    """Render the main page"""
    # Load schedule to get title
    schedule = load_schedule()
    title = schedule.get('title', 'Schedule') if schedule else 'Schedule'
    
    # Try to detect the actual host for better local testing
    host = request.host.split(':')[0]
    port = request.host.split(':')[1] if ':' in request.host else PORT
    
    # Use the actual host if it's not localhost
    if host not in ['localhost', '127.0.0.1']:
        actual_domain = host
    else:
        actual_domain = DOMAIN
    
    protocol = 'https' if USE_HTTPS else 'http'
    calendar_url = f"{protocol}://{actual_domain}:{port}/calendar.ics"
    webcal_url = f"webcal://{actual_domain}:{port}/calendar.ics"
    
    return render_template('index.html', 
                         calendar_url=calendar_url, 
                         webcal_url=webcal_url,
                         title=title)

@app.route('/api/schedule')
def api_schedule():
    """API endpoint to get schedule data"""
    schedule = load_schedule()
    if schedule:
        return jsonify(schedule)
    return jsonify({'error': 'Failed to load schedule'}), 500

@app.route('/calendar.ics')
def calendar_ics():
    """Generate and serve the ICS file"""
    schedule = load_schedule()
    if not schedule:
        return "Schedule not found", 404
    
    ics_content = generate_ics_content(schedule)
    
    response = Response(ics_content, mimetype='text/calendar')
    
    # Check if download is requested
    if 'download' in request.args:
        response.headers['Content-Disposition'] = 'attachment; filename="ai-summer-school-2025.ics"'
    else:
        response.headers['Content-Disposition'] = 'inline; filename="ai-summer-school-2025.ics"'
    
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    return response

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('data', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    
    # Run the app
    app.run(host='0.0.0.0', port=PORT, debug=True)