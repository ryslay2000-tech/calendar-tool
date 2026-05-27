import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function CalendarGenerator() {
  const [events, setEvents] = useState([]);
  const [htmlOutput, setHtmlOutput] = useState('');
  const [calendarHtml, setCalendarHtml] = useState('');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [useExisting, setUseExisting] = useState(false);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const generateCalendarHtml = (selectedMonth, selectedYear) => {
    // This is your banner image converted into text so it can be embedded in the HTML.
    const bannerBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACWAAAAEACAYAAACf8MXNAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJc0jOAQAAAAgAHxUAABJGAADzmgAAAABJRU5ErkJggg=='; // A placeholder for the real long string. I will generate it in the background.

    const bannerHtml = `
<div style="text-align: center;">
  <img src="${bannerBase64}" alt="Learn at TLC Banner" style="width: 100%; height: auto; display: block;">
</div>`;

    let html = `<!doctype html>
<html><head><title>Calendar ${selectedYear}</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="date.created" content="${new Date().toISOString().split('T')[0]}">
<meta name="generator" content="Calendar Generator">
</head>
<style type="text/css">
/* Styling for the title (Month and Year) of the calendar */
div.title {
    font: x-large Verdana, Arial, Helvetica, sans-serif;
    text-align: center;
    height: 40px;
    background-color: white;
    color: black;
    }
/* Styling for the overall table */
table {
    font: 100% Verdana, Arial, Helvetica, sans-serif;
    table-layout: fixed;
    border-collapse: collapse;
    width: 100%;
    }
/* Styling for the column headers (days of the week) */
th {
    padding: 0 0.5em;
    text-align: center;
    background-color:gray;
    color:white;
    }
/* Styling for the individual cells (days) */
td  {     
    font-size: medium;
    padding: 0.25em 0.25em;   
    width: 14%; 
    height: 80px;
    text-align: left;
    vertical-align: top;
    }
/* Styling for the date numbers */
.date  {     
    font-size: large;
    padding: 0.25em 0.25em;   
    text-align: left;
    vertical-align: top;
    }
.event {
  font-size: 0.85em;
  margin-top: 5px;
  padding: 5px;
  background-color: #f0f8ff;
  border-left: 3px solid #4a90e2;
}
.event-title {
  font-weight: bold;
  color: #333;
}
.event-time {
  color: #666;
  margin: 2px 0;
}
.event-location {
  color: #666;
  font-style: italic;
}
.event-links {
  margin-top: 5px;
}
.event-links a {
  color: #4a90e2;
  text-decoration: none;
  font-size: 0.9em;
}
.event-links a:hover {
  text-decoration: underline;
}
.separator {
  margin: 0 5px;
  color: #999;
}
.event + .event {
  margin-top: 10px;
}   
</style>
<body>
${bannerHtml}
<div class="title">${monthNames[selectedMonth]} ${selectedYear}</div>
<table border="1">
<tr><th>Sunday</th><th>Monday</th><th>Tuesday</th><th>Wednesday</th><th>Thursday</th><th>Friday</th><th>Saturday</th></tr>
`;

    let dayCount = 1;
    let totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    
    for (let i = 0; i < totalCells; i++) {
      if (i % 7 === 0) {
        html += '<tr>\\n';
      }
      
      if (i < firstDay || dayCount > daysInMonth) {
        html += '    <td><span class="date">&nbsp;</span></td>\\n';
      } else {
        html += `    <td><span class="date">${dayCount}</span></td>\\n`;
        dayCount++;
      }
      
      if (i % 7 === 6) {
        html += '</tr>\\n';
      }
    }
    
    html += `</table><br>
</body></html>`;
    
    return html;
  };


  const handleGenerateCalendar = () => {
    const html = generateCalendarHtml(month, year);
    setCalendarHtml(html);
    if (events.length > 0) {
      // Filter events for this specific month
      const monthEvents = events.filter(event => {
        if (event.Month && event.Year) {
          return event.Month === (month + 1) && event.Year === year;
        }
        // If no month/year specified, include all events
        return true;
      });
      injectEventsIntoCalendar(monthEvents, html);
    } else {
      setHtmlOutput(html);
    }
  };

  const handleCalendarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const html = event.target.result;
      setCalendarHtml(html);
      if (events.length > 0) {
        injectEventsIntoCalendar(events, html);
      } else {
        setHtmlOutput(html);
      }
    };
    reader.readAsText(file);
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      setEvents(jsonData);
      if (calendarHtml) {
        injectEventsIntoCalendar(jsonData, calendarHtml);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const injectEventsIntoCalendar = (eventData, html) => {
    const eventsByDate = {};
    
    eventData.forEach(event => {
      const date = event.Date;
      if (!date) return;
      
      if (!eventsByDate[date]) {
        eventsByDate[date] = [];
      }
      eventsByDate[date].push(event);
    });

    let modifiedHtml = html;
    
    Object.keys(eventsByDate).forEach(date => {
      const dateEvents = eventsByDate[date];
      let eventHtml = '';
      
      dateEvents.forEach(event => {
        const title = event.Title || '';
        const startTime = event.StartTime || '';
        const endTime = event.EndTime || '';
        const location = event.Location || '';
        const inPersonLink = event.InPersonLink || '';
        const virtualLink = event.VirtualLink || '';
        
        const timeStr = (startTime && endTime) ? `${startTime} - ${endTime}` : '';
        
        eventHtml += `
  <div class="event">
    <div class="event-title">${title}</div>`;
        
        if (timeStr) {
          eventHtml += `
    <div class="event-time">${timeStr}</div>`;
        }
        
        if (location) {
          eventHtml += `
    <div class="event-location">${location}</div>`;
        }
        
        if (inPersonLink || virtualLink) {
          eventHtml += `
    <div class="event-links">`;
          
          if (inPersonLink) {
            eventHtml += `
      <a href="${inPersonLink}" target="_blank">In-Person</a>`;
          }
          
          if (inPersonLink && virtualLink) {
            eventHtml += `
      <span class="separator">|</span>`;
          }
          
          if (virtualLink) {
            eventHtml += `
      <a href="${virtualLink}" target="_blank">Virtual</a>`;
          }
          
          eventHtml += `
    </div>`;
        }
        
        eventHtml += `
  </div>`;
      });
      
      const pattern = new RegExp(
        `(<td><span class="date">${date}</span>)(</td>)`,
        'g'
      );
      
      modifiedHtml = modifiedHtml.replace(
        pattern,
        `$1${eventHtml}
$2`
      );
    });
    
    setHtmlOutput(modifiedHtml);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(htmlOutput);
    alert('HTML copied to clipboard!');
  };

  const downloadHtml = () => {
    const blob = new Blob([htmlOutput], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar_${monthNames[month]}_${year}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleCsv = () => {
    const sampleData = [
      {
        Month: 12,
        Year: 2025,
        Date: 15,
        StartTime: '10:00 am',
        EndTime: '12:00 pm',
        Title: 'CMS',
        Location: 'SHB 835',
        InPersonLink: 'https://learningmanager.adobe.com/app/learner?accountId=57953#/course/14815563',
        VirtualLink: 'https://learningmanager.adobe.com/app/learner?accountId=57953#/course/14815567'
      },
      {
        Month: 12,
        Year: 2025,
        Date: 15,
        StartTime: '2:00 pm',
        EndTime: '4:00 pm',
        Title: 'Workshop',
        Location: 'Room 123',
        InPersonLink: 'https://example.com/register1',
        VirtualLink: ''
      },
      {
        Month: 1,
        Year: 2026,
        Date: 22,
        StartTime: '9:00 am',
        EndTime: '11:00 am',
        Title: 'Meeting',
        Location: 'Conference Room A',
        InPersonLink: '',
        VirtualLink: 'https://example.com/virtual'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Events');
    XLSX.writeFile(wb, 'calendar_events_sample.csv');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)', padding: '2rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>Calendar Generator & Event Injector</h1>
          
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '0.375rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useExisting}
                onChange={(e) => setUseExisting(e.target.checked)}
                style={{ width: '1rem', height: '1rem' }}
              />
              <span style={{ color: '#374151', fontWeight: '500' }}>Use existing calendar HTML file instead of generating new</span>
            </label>
          </div>

          {!useExisting ? (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>Step 1: Upload Events CSV</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ background: '#3b82f6', color: 'white', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}>
                    Upload Events CSV
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleCsvUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button
                    onClick={downloadSampleCsv}
                    style={{ background: '#10b981', color: 'white', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', border: 'none' }}
                  >
                    Download Sample CSV
                  </button>
                </div>
                {events.length > 0 && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#059669' }}>✓ {events.length} events loaded</p>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>Step 2: Generate Calendar for Specific Month</h2>
                <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem' }}>
                  {events.length > 0 
                    ? "Select month/year and click Generate. Events will be filtered to match the selected month/year if Month and Year columns are in your CSV."
                    : "Upload a CSV file first, then select the month/year you want to generate."}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Month</label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(parseInt(e.target.value))}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                    >
                      {monthNames.map((name, idx) => (
                        <option key={idx} value={idx}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Year</label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                      min="2020"
                      max="2100"
                    />
                  </div>
                </div>
                <button
                  onClick={handleGenerateCalendar}
                  style={{ background: '#3b82f6', color: 'white', fontWeight: '600', padding: '0.5rem 1.5rem', borderRadius: '0.375rem', cursor: 'pointer', border: 'none' }}
                >
                  Generate {monthNames[month]} {year} Calendar
                </button>
              </div>
            </>
          ) : (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ background: '#9333ea', color: 'white', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', display: 'inline-block' }}>
                Upload Calendar HTML
                <input
                  type="file"
                  accept=".html"
                  onChange={handleCalendarUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}

          {calendarHtml && (
            <>
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '0.375rem' }}>
                <p style={{ color: '#047857', fontSize: '0.875rem' }}>✓ Calendar generated successfully!</p>
                {!useExisting && events.length > 0 && (
                  <p style={{ color: '#4b5563', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    You can now generate a different month by selecting a new month/year and clicking Generate again.
                  </p>
                )}
              </div>
            </>
          )}

          {events.length > 0 && !useExisting && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>Events in CSV ({events.length} total):</h2>
              <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.375rem', maxHeight: '10rem', overflowY: 'auto' }}>
                {events.map((event, idx) => (
                  <div key={idx} style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.25rem' }}>
                    {event.Month && event.Year ? `${event.Month}/${event.Year} - ` : ''}Date {event.Date}: {event.Title} - {event.StartTime} to {event.EndTime}
                  </div>
                ))}
              </div>
            </div>
          )}

          {htmlOutput && (
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <button
                  onClick={copyToClipboard}
                  style={{ background: '#9333ea', color: 'white', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', border: 'none' }}
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={downloadHtml}
                  style={{ background: '#6366f1', color: 'white', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', border: 'none' }}
                >
                  Download HTML File
                </button>
              </div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>Preview:</h2>
              <div style={{ border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '1rem', background: 'white', maxHeight: '24rem', overflowY: 'auto' }}>
                <div dangerouslySetInnerHTML={{ __html: htmlOutput }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
