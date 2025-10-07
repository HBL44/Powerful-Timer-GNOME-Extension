import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as
    PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

// Import shared commands
import { OPTION_NAMES, endOptionnalCommands } from './shared-commands.js';
import { TIMER_STEPS, MAX_TIMER_MINUTES, DEFAULT_TIMER_MINUTES, DEFAULT_TIMER_STEP_ID, PLAYER_MAP, SessionManagerIface, SessionManagerProxy} from './config.js';


/**
 * Timer indicator for GNOME Shell panel
 * Provides media player pause timer functionality with configurable duration
 */
const TimerIndicator = GObject.registerClass(
    class TimerIndicator extends PanelMenu.Button {
        _init(Me) {
            super._init(0.5, _('Media Pause Timer')); // 0.5 makes the popup window centered
            this._settings = Me._settings; // Use the extension's settings
            this._initializeState();
            this._createPanelIcon();
            this._createMenu(Me);
            this._bindEvents();

            // Initialize session manager
            this._sessionManager = new SessionManagerProxy(
                Gio.DBus.session,
                'org.gnome.SessionManager',
                '/org/gnome/SessionManager'
            );
        }

        /**
         * Initialize timer state variables
         */
        _initializeState() {
            this._selectedMinutes = DEFAULT_TIMER_MINUTES;
            this._remainingSeconds = 0;
            this._timerId = null;
            this._paused = false;
            this._stepIndex = DEFAULT_TIMER_STEP_ID;
            if (this._settings.get_boolean('default-media-is-all')) {
                this._selectedPlayer = 'all';
            } else {
                this._selectedPlayer = 'none';
            }
            this._cookie = null;

            // Update actions in COMMANDS to include extension.js-specific logic
            endOptionnalCommands[0].action = () => this._pauseMedia();
            endOptionnalCommands[1].action = () => Main.screenShield.lock(true);
            endOptionnalCommands[2].action = () => {
                try {
                    GLib.spawn_command_line_async('rfkill block bluetooth');
                } catch (error) {
                    if (this._settings.get_boolean('show-notifications')) {
                        Main.notify(_('Error'), _('Failed to disable Bluetooth.'));
                    }
                }
            };

            // Goes through the available commands and updates their state to the saved settings
            const selectedCommands = this._settings.get_strv('selected-timer-end-commands');
            endOptionnalCommands.forEach(command => {
                command.state = selectedCommands.includes(command.label);
            });
        }

        /**
         * Create the panel icon
         */
        _createPanelIcon() {
            this.add_child(new St.Icon({
                icon_name: 'alarm-symbolic',
                style_class: 'system-status-icon',
            }));
        }

        /**
         * Create the complete menu structure
         */
        _createMenu(Me) {
            this._createMediaSourceMenu();
            this._createTimerControls();
            this._createControlButtons();
            this._createTimeDisplay();
            this._createSettingsButton(Me);
        }

        /**
         * Create media source selection submenu
         */
        _createMediaSourceMenu() {
            this._sourceMenu = new PopupMenu.PopupMenuSection();
            this._sourceSubMenu = new PopupMenu.PopupSubMenuMenuItem(_('Media Sources'));

            this._sourceSubMenu.menu.addMenuItem(this._sourceMenu);
            this.menu.addMenuItem(this._sourceSubMenu);

            this._refreshMediaSources(); // Initial population of media sources

            if (!endOptionnalCommands[0].state) {
                this._sourceSubMenu.actor.visible = false;
            }
        }

        /**
         * Create timer duration controls
         */
        _createTimerControls() {
            const row = new St.BoxLayout({
                vertical: false,
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER,
                x_expand: true
            });

            // Create control buttons
            this._minusBtn = this._createCircleButton('list-remove-symbolic');
            this._plusBtn = this._createCircleButton('list-add-symbolic');

            // Create step controls
            this._stepLabel = new St.Label({
                text: 'Step: ',
                y_align: Clutter.ActorAlign.CENTER,
                x_align: Clutter.ActorAlign.CENTER
            });

            this._stepButton = new St.Button({
                child: new St.Label({
                    text: `${this._getCurrentStep()}m`,
                    y_align: Clutter.ActorAlign.CENTER,
                    x_align: Clutter.ActorAlign.CENTER,
                    style_class: 'square-button'
                })
            });

            // Create time display
            this._timeLabel = new St.Label({
                text: `${this._selectedMinutes} min`,
                y_align: Clutter.ActorAlign.CENTER,
                x_align: Clutter.ActorAlign.CENTER
            });

            // Add controls to row
            row.add_child(this._minusBtn);
            row.add_child(this._timeLabel);
            row.add_child(this._plusBtn);
            row.add_child(this._stepLabel);
            row.add_child(this._stepButton);

            const rowItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
            rowItem.add_child(row);
            this.menu.addMenuItem(rowItem);
        }

        /**
         * Create timer control buttons
         */
        _createControlButtons() {
            const controlRow = new St.BoxLayout({
                vertical: false,
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER,
                x_expand: true
            });

            this._playPauseBtn = this._createCircleButton('media-playback-start-symbolic');
            this._stopBtn = this._createCircleButton('media-playback-stop-symbolic');

            controlRow.add_child(this._playPauseBtn);
            controlRow.add_child(this._stopBtn);

            const controlRowItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
            controlRowItem.add_child(controlRow);
            this.menu.addMenuItem(controlRowItem);
        }

        /**
         * Create time remaining display
         */
        _createTimeDisplay() {
            this._timeLeftItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
            this._timeLeftLabel = new St.Label({ style_class: 'time-left-label' });
            this._timeLeftItem.add_child(this._timeLeftLabel);
            this._timeLeftItem.visible = false;
            this.menu.addMenuItem(this._timeLeftItem);
        }

        _createSettingsButton(Me) {
            const separator = new PopupMenu.PopupSeparatorMenuItem();
            this.menu.addMenuItem(separator);
            this.menu.addAction(_('Settings'), () => Me._openPreferences());
        }

        /**
         * Bind all event handlers
         */
        _bindEvents() {
            // Prevent menu from closing when selecting sources by overriding default behavior
            this._sourceMenu.itemActivated = () => {
            };

            // Media source menu open/close events
            this._sourceMenu.connect('open-state-changed', (menu, isOpen) => {
                if (isOpen) {
                    this._refreshMediaSources();
                }
            });

            // Timer step button click event
            this._stepButton.connect('clicked', () => {
                this._stepIndex = (this._stepIndex + 1) % TIMER_STEPS.length;
                this._updateStepDisplay();
            });

            // Click event on the plus and minus timer buttons
            this._minusBtn.connect('clicked', () => this._adjustTimer(-1));
            this._plusBtn.connect('clicked', () => this._adjustTimer(1));

            // Click events for play/pause and stop buttons
            this._playPauseBtn.connect('clicked', () => this._togglePlayPause());
            this._stopBtn.connect('clicked', () => this._stopTimer());


            // Visual elements can be updated on change of the corresponding settings
            this._settings.connect('changed::selected-timer-end-commands', () => {
                const selectedCommands = this._settings.get_strv('selected-timer-end-commands');

                // Goes through the available commands and updates their state
                endOptionnalCommands.forEach(command => {
                    command.state = selectedCommands.includes(command.label);
                });

                // Only show the media selection dropdown if the pause media command is selected
                if (this._sourceSubMenu) {
                    this._sourceSubMenu.actor.visible = endOptionnalCommands[0].state;
                }
            });
        }

        /**
         * Create a circular button with consistent styling
         */
        _createCircleButton(iconName) {
            return new St.Button({
                style_class: 'circle-button',
                child: new St.Icon({ icon_name: iconName, icon_size: 12 })
            });
        }

        /**
         * Get current step value
         */
        _getCurrentStep() {
            return TIMER_STEPS[this._stepIndex];
        }

        /**
         * Update step display
         */
        _updateStepDisplay() {
            if (this._stepButton?.child) {
                this._stepButton.child.set_text(`${this._getCurrentStep()}m`);
            }
        }

        /**
         * Adjust timer value by direction (-1 for decrease, 1 for increase)
         */
        _adjustTimer(direction) {
            const step = this._getCurrentStep();
            // Bound the new value to 1-2880 minutes
            const newValue = Math.max(1, Math.min(this._selectedMinutes + (direction * step), MAX_TIMER_MINUTES));

            this._selectedMinutes = newValue;
            this._updateTimeDisplay();
        }

        /**
         * Update time display
         */
        _updateTimeDisplay() {
            this._timeLabel.set_text(`${this._selectedMinutes} min`);
        }

        /**
         * Refresh available media sources
         */
        _refreshMediaSources() {
            this._sourceMenu.removeAll();

            try {
                const [, out] = GLib.spawn_command_line_sync('playerctl -l');
                const decoder = new TextDecoder('utf-8');
                const sources = decoder.decode(out).trim().split('\n')
                    .filter(player => player.trim())
                    .map(player => ({ name: player, player: player }));

                // Add "All players" option
                sources.unshift({ name: 'All players', player: 'all' });
                sources.unshift({ name: 'None', player: 'none' });


                sources.forEach(source => {
                    const friendlyName = this._getFriendlyPlayerName(source.name);
                    const isSelected = this._selectedPlayer === source.player;

                    const item = new PopupMenu.PopupMenuItem(friendlyName);
                    item.setOrnament(isSelected ? PopupMenu.Ornament.CHECK : PopupMenu.Ornament.NONE);

                    item.connect('activate', () => {
                        this._selectedPlayer = source.player;
                        this._updateSourceMenuOrnaments();
                    });

                    this._sourceMenu.addMenuItem(item);
                });
            } catch (error) {
                // Add fallback option if playerctl fails
                const fallbackItem = new PopupMenu.PopupMenuItem('No players available');
                fallbackItem.setOrnament(PopupMenu.Ornament.NONE);
                this._sourceMenu.addMenuItem(fallbackItem);
            }
        }

        /**
         * Get friendly name for player
         */
        _getFriendlyPlayerName(playerName) {
            for (const [key, friendlyName] of PLAYER_MAP) {
                if (playerName.toLowerCase().includes(key)) {
                    return friendlyName;
                }
            }
            return playerName;
        }

        /**
         * Update ornaments in source menu
         */
        _updateSourceMenuOrnaments() {
            this._sourceMenu._getMenuItems().forEach((menuItem, index) => {
                const isSelected = (this._sourceMenu._getMenuItems()[index]?.label?.get_text() ===
                    this._getFriendlyPlayerName(this._selectedPlayer));
                menuItem.setOrnament(isSelected ? PopupMenu.Ornament.CHECK : PopupMenu.Ornament.NONE);
            });
        }

        /**
         * Start timer countdown
         */
        _startTimer() {
            this._clearTimer();

            this._remainingSeconds = this._selectedMinutes * 60;
            this._paused = false;
            this._updateTimeLeftDisplay();
            this._timeLeftItem.visible = true;
            this._playPauseBtn.child.set_icon_name('media-playback-pause-symbolic');

            this._timerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
                if (!this._paused) {
                    this._remainingSeconds--;
                    this._updateTimeLeftDisplay();

                    if (this._remainingSeconds <= 0) {
                        this._endTimer();
                        return GLib.SOURCE_REMOVE;
                    }
                }
                return GLib.SOURCE_CONTINUE;
            });

            if (this._settings.get_boolean('show-notifications')) {
                Main.notify(
                    _('Timer Started'),
                    _('Media will pause in ') + this._selectedMinutes + _(' minutes')
                );
            }

            // Inhibit system suspend if enabled
            this.inhibit();
        }

        /**
         * Toggle timer pause/resume
         */
        _togglePlayPause() {
            if (!this._timerId && this._remainingSeconds === 0) {
                this._startTimer();
                return;
            }

            this._paused = !this._paused;
            this._playPauseBtn.child.set_icon_name(
                this._paused ? 'media-playback-start-symbolic' : 'media-playback-pause-symbolic'
            );
        }

        /**
         * Stop timer, reset state and execute custom user defiend command if set
         */
        _stopTimer() {
            this._clearTimer();
            this._resetTimerState();
        }

        /**
         * Clear timer and remove from GLib
         */
        _clearTimer() {
            if (this._timerId) {
                GLib.source_remove(this._timerId);
                this._timerId = null;
            }
            // Uninhibit system suspend when timer is cleared
            this.uninhibit();
        }

        /**
         * Reset timer to initial state
         */
        _resetTimerState() {
            this._remainingSeconds = 0;
            this._paused = false;
            this._playPauseBtn.child.set_icon_name('media-playback-start-symbolic');
            this._timeLeftItem.visible = false;
        }

        /**
         * Update time remaining display
         */
        _updateTimeLeftDisplay() {
            const minutes = Math.floor(this._remainingSeconds / 60);
            const seconds = this._remainingSeconds % 60;
            this._timeLeftLabel.set_text(
                `${minutes}:${seconds.toString().padStart(2, '0')} left`
            );
        }

        /**
         * Handle timer completion
         */
        _endTimer() {
            endOptionnalCommands.forEach(({ label, action, state }) => {
                if (state) {
                    try {
                        action();
                    } catch (error) {
                    }
                }
            });

            this._stopTimer();
        }

        inhibit() {
            if (this._settings.get_boolean('enable-keep-awake')) {
                this._sessionManager.InhibitRemote(
                    "powerful-timer@HBL44.github.com",
                    0,
                    "The Powerful Timer extension is preventing suspend",
                    12,
                    (cookie) => {
                        this._cookie = cookie;
                    }
                );
            }
        }

        uninhibit() {
            if (this._cookie) {
                this._sessionManager.UninhibitRemote(this._cookie);
                this._cookie = null;
            }
        }

        // Implement the _pauseMedia function
        _pauseMedia() {
            const argv = this._selectedPlayer !== 'all'
                ? ['playerctl', `--player=${this._selectedPlayer}`, 'pause']
                : ['playerctl', '-a', 'pause'];

            try {
                if (this._selectedPlayer !== 'none') {
                    GLib.spawn_async(null, argv, null, GLib.SpawnFlags.SEARCH_PATH, null);
                }
                if (this._settings.get_boolean('show-notifications')) {
                    Main.notify(_('Timer Ended'), _('Media paused'));
                }
            } catch (error) {
                if (this._settings.get_boolean('show-notifications')) {
                    Main.notify(_('Error'), error.message);
                }
            }
        }
    });

/**
 * Main extension class
 */
export default class PowerfulTimerExtension extends Extension {

    // Initialize the extension and set up the media selection dropdown visibility
    enable() {
        this._settings = this.getSettings();
        this._indicator = new TimerIndicator(this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator._clearTimer();
            this._indicator.destroy();
            this._indicator = null;
        }
    }

    _openPreferences() {
        this.openPreferences();
    }
}