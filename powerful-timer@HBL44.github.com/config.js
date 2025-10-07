import Gio from 'gi://Gio';

export const TIMER_STEPS = [1, 5, 10, 30];
export const MAX_TIMER_MINUTES = 60 * 48; // 48 hours
export const DEFAULT_TIMER_MINUTES = 30;
export const DEFAULT_TIMER_STEP_ID = 2; // Default index of TIMER_STEPS

export const PLAYER_MAP = new Map([
    ['none', 'None'],
    ['all', 'All players'],
    ['spotify', 'Spotify'],
    ['ytmdesktop', 'YouTube Music Desktop'],
    ['vlc', 'VLC'],
    ['rhythmbox', 'Rhythmbox'],
    ['audacious', 'Audacious'],
    ['clementine', 'Clementine'],
    ['deezer', 'Deezer'],
    ['tidal', 'Tidal'],
    ['amazonmusic', 'Amazon Music'],
    ['netflix', 'Netflix'],
    ['apple-music', 'Apple Music'],
    ['plex', 'Plex'],
    ['chromium', 'Google Chrome'],
]);

// Session Manager D-Bus interface
export const SessionManagerIface = '<node>\
  <interface name="org.gnome.SessionManager">\
    <method name="Inhibit">\
      <arg type="s" direction="in" />\
      <arg type="u" direction="in" />\
      <arg type="s" direction="in" />\
      <arg type="u" direction="in" />\
      <arg type="u" direction="out" />\
    </method>\
    <method name="Uninhibit">\
      <arg type="u" direction="in" />\
    </method>\
  </interface>\
</node>';

export const SessionManagerProxy = Gio.DBusProxy.makeProxyWrapper(SessionManagerIface);
