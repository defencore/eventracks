# AI Summer School 2025 - Calendar Subscription Service

This Flask application provides a dynamic calendar subscription service for the AI Summer School 2025 schedule. Users can subscribe to the calendar and receive automatic updates when the schedule changes.

## Features

- 📅 **Dynamic Calendar Generation**: ICS file generated from JSON data
- 🔄 **Auto-updating**: Calendar apps will automatically fetch updates
- 📱 **Multi-platform Support**: Works with Apple Calendar, Google Calendar, Outlook, etc.
- 🎨 **Beautiful Web Interface**: Clean, responsive design for viewing the schedule
- 🔗 **Easy Subscription**: One-click subscription via webcal:// protocol
- 💬 **Discord Integration**: Direct links to Discord channels for each session
- 🎥 **Zoom Links**: One-click access to Zoom meetings
- 📹 **Video Recordings**: Links to recorded sessions when available

## Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure the application**:
   Edit `app.py` and set your domain and port:
   ```python
   DOMAIN = "your-domain.com"  # Your domain
   PORT = 5000                 # Your desired port
   USE_HTTPS = True           # Set to False if not using HTTPS
   ```

4. **Create the directory structure**:
   ```
   project/
   ├── app.py
   ├── requirements.txt
   ├── README.md
   ├── data/
   │   └── schedule.json
   ├── templates/
   │   └── index.html
   └── static/
       ├── css/
       │   └── style.css
       └── js/
           └── script.js
   ```

## Usage

1. **Run the application**:
   ```bash
   python3 app.py
   ```

2. **Access the web interface**:
   Open your browser and go to `http://localhost:5000` (or your configured domain/port)

3. **Subscribe to the calendar**:
   - Click "Subscribe to Calendar" for automatic setup
   - Or copy the calendar URL and add it manually to your calendar app

## Updating the Schedule

To update the schedule, simply edit the `data/schedule.json` file. The changes will be automatically reflected in all subscribed calendars.

### Schedule JSON Format

```json
{
  "title": "Event Title",
  "days": [
    {
      "date": "Monday, 23 June",
      "sessions": [
        {
          "time": "09:00 - 10:00",
          "track": "everyone",  // "everyone", "coreA", or "coreB"
          "title": "Session Title",
          "lecturer": "Speaker Name",
          "zoomLink": "https://zoom.us/j/123456789",
          "discordLink": "https://discord.com/channels/...",  // optional
          "videoLink": "https://youtube.com/watch?v=...",    // optional
          "mainLink": "https://example.com/course-page"      // optional - makes title clickable
        }
      ]
    }
  ]
}
```

## Calendar Subscription Instructions

### Apple Calendar (macOS/iOS)
1. Click "Subscribe to Calendar" button on the website
2. Confirm in the dialog that appears

### Google Calendar
1. Copy the calendar URL from the website
2. Open Google Calendar
3. Click the + next to "Other calendars"
4. Select "From URL"
5. Paste the URL and click "Add calendar"

### Outlook
1. Copy the calendar URL
2. In Outlook, go to Calendar
3. Right-click "My Calendars" → "Add Calendar" → "From Internet"
4. Paste the URL and click OK

## Production Deployment

For production use:

1. **Use a proper WSGI server** (e.g., Gunicorn):
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

2. **Set up a reverse proxy** (e.g., Nginx) with HTTPS

3. **Use a process manager** (e.g., systemd or supervisor)

4. **Disable debug mode** in `app.py`:
   ```python
   app.run(host='0.0.0.0', port=PORT, debug=False)
   ```

## Troubleshooting

### Calendar subscription on localhost

The `webcal://` protocol often doesn't work with `localhost`. Here are solutions:

1. **Use the "Download .ics file" button** and open it with your calendar app

2. **Quick test on macOS** - Open Calendar app directly with the ICS URL:
   ```bash
   open -a Calendar http://localhost:5000/calendar.ics
   ```
   Or if using a custom domain/port:
   ```bash
   open -a Calendar http://example.com:5000/calendar.ics
   ```

3. **For Google Calendar**: Copy the http://localhost:5000/calendar.ics URL directly

4. **Manual subscription**: Most calendar apps accept http:// URLs for manual subscription

### Calendar Update Frequency

For best results, configure your calendar app to refresh frequently:
- **Apple Calendar**: Settings → Accounts → Refresh Calendars → Every 5 minutes
- **Google Calendar**: Updates every few hours (not configurable)
- **Outlook**: File → Account Settings → Internet Calendars → Update Limit

### Other Issues

- **Calendar not updating**: Most calendar apps check for updates every 1-24 hours
- **Webcal link not working**: Ensure your calendar app is set as the default handler for webcal:// links
- **HTTPS issues**: Make sure `USE_HTTPS` matches your server configuration
- **Discord links**: Discord links in the calendar open in the Discord app if installed

## License

This project is provided as-is for educational purposes.

---

*This project was generated with AI assistance.*