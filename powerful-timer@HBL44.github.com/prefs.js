'use strict';

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class MyExtensionPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings(); // Uses schema from metadata.json

        // Preferences page
        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'emblem-system-symbolic',
        });
        window.add(page);

        // Group
        const group = new Adw.PreferencesGroup({
            title: 'Options',
        });
        page.add(group);

        // Example: switch row
        const switchRow = new Adw.SwitchRow({
            title: 'Enable Notifications',
            active: settings.get_boolean('show-notifications'),
        });

        switchRow.connect('notify::active', w => {
            settings.set_boolean('show-notifications', w.active);
        });

        group.add(switchRow);
    }
}
