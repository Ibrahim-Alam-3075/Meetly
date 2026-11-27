export const COVER_THEMES = {
  indigo: {
    label: 'Electric Indigo',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
    accent: '#818cf8'
  },
  emerald: {
    label: 'Aurora Emerald',
    gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 55%, #3b82f6 100%)',
    accent: '#34d399'
  },
  sunset: {
    label: 'Solar Sunset',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ec4899 55%, #8b5cf6 100%)',
    accent: '#fb923c'
  },
  ocean: {
    label: 'Deep Ocean',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #4f46e5 100%)',
    accent: '#38bdf8'
  },
  rose: {
    label: 'Velvet Rose',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #d946ef 60%, #7c3aed 100%)',
    accent: '#fb7185'
  },
  amber: {
    label: 'Golden Hour',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 55%, #db2777 100%)',
    accent: '#fbbf24'
  }
};

export const EMOJI_OPTIONS = ['✨', '🚀', '🍽️', '📚', '🎮', '☕', '🎉', '💼', '🏏', '🎬', '🏕️', '🎵'];

export const AVATAR_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#10b981',
  '#06b6d4',
  '#3b82f6'
];

export const EVENT_TEMPLATES = [
  {
    id: 'meeting',
    label: 'Team Meeting',
    icon: '💼',
    type: 'Meeting',
    coverTheme: 'indigo',
    description: 'Sync up on milestones, blockers, and next sprint goals.',
    agenda: '1. Quick status updates\n2. Key decisions & blockers\n3. Action items & owners',
    votingMode: 'multiple',
    allowSuggestions: true
  },
  {
    id: 'dinner',
    label: 'Dinner Hangout',
    icon: '🍽️',
    type: 'Hangout',
    coverTheme: 'sunset',
    description: 'Good food, great company — vote on when and where we should eat!',
    agenda: '',
    votingMode: 'multiple',
    allowSuggestions: true
  },
  {
    id: 'study',
    label: 'Study Session',
    icon: '📚',
    type: 'Study session',
    coverTheme: 'emerald',
    description: 'Focused group prep for upcoming quizzes, assignments, or finals.',
    agenda: '',
    votingMode: 'multiple',
    allowSuggestions: true
  },
  {
    id: 'gaming',
    label: 'Gaming Night',
    icon: '🎮',
    type: 'Other',
    coverTheme: 'rose',
    description: 'Hop on voice chat for a late-night gaming session with the squad.',
    agenda: '',
    votingMode: 'single',
    allowSuggestions: true
  }
];

export function getDefaultIcon(type) {
  switch (type) {
    case 'Meeting':
      return '💼';
    case 'Hangout':
      return '🎉';
    case 'Study session':
      return '📚';
    default:
      return '✨';
  }
}

export function getCoverGradient(themeKey, type) {
  if (themeKey && COVER_THEMES[themeKey]) return COVER_THEMES[themeKey].gradient;
  if (type === 'Meeting') return COVER_THEMES.indigo.gradient;
  if (type === 'Hangout') return COVER_THEMES.sunset.gradient;
  if (type === 'Study session') return COVER_THEMES.emerald.gradient;
  return COVER_THEMES.ocean.gradient;
}

export function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getCountdownLabel(dateStr) {
  if (!dateStr) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(target.getTime())) return '';
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays <= 14) return `In ${diffDays} days`;
  if (diffDays > 14) return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (diffDays === -1) return 'Yesterday';
  return `${Math.abs(diffDays)}d ago`;
}

export function formatNiceDate(dateStr) {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function getOptionScore(option) {
  const yes = (option?.votes || []).length;
  const maybe = (option?.maybeVotes || []).length;
  return yes * 2 + maybe;
}

export function getVoterId(v) {
  return v && typeof v === 'object' ? String(v._id) : String(v);
}

export function downloadICS(event) {
  const dateStr = (event.finalDate || event.date || '').replace(/-/g, '');
  if (!dateStr) return;
  const timeStr = (event.finalTime || event.dates?.[0]?.time || '12:00').replace(':', '') + '00';
  const endHour = String((Number(timeStr.slice(0, 2)) + 1) % 24).padStart(2, '0');
  const endTimeStr = endHour + timeStr.slice(2);
  const loc = event.finalVenue?.place || event.venues?.[0]?.place || event.finalVenue?.link || '';
  const desc = (event.description || '').replace(/\n/g, '\\n');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Meetly Ultra//EN',
    'BEGIN:VEVENT',
    `SUMMARY:${event.title}`,
    `DTSTART:${dateStr}T${timeStr}`,
    `DTEND:${dateStr}T${endTimeStr}`,
    `LOCATION:${loc}`,
    `DESCRIPTION:${desc}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(event) {
  const dateStr = (event.finalDate || event.date || '').replace(/-/g, '');
  const timeStr = (event.finalTime || event.dates?.[0]?.time || '12:00').replace(':', '') + '00';
  const endHour = String((Number(timeStr.slice(0, 2)) + 1) % 24).padStart(2, '0');
  const endTimeStr = endHour + timeStr.slice(2);
  const loc = event.finalVenue?.place || event.venues?.[0]?.place || event.finalVenue?.link || '';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || 'Meetly Event',
    dates: `${dateStr}T${timeStr}/${dateStr}T${endTimeStr}`,
    details: event.description || '',
    location: loc
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
