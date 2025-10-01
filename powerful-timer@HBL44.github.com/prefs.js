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


        const switchNotification = new Adw.SwitchRow({
            title: 'Enable Notifications',
            subtitle: 'Whether to show notifications when the timer ends.',
            active: settings.get_boolean('show-notifications'),
        });

        switchNotification.connect('notify::active', w => {
            settings.set_boolean('show-notifications', w.active);
        });


        const switchAwake = new Adw.SwitchRow({
            title: 'Do keep awake',
            subtitle: 'Whether to keep the system awake while the timer is running, if the computer falls asleep the timer won\'t trigger.',
            active: settings.get_boolean('enable-keep-awake'),
        });

        switchAwake.connect('notify::active', w => {
            settings.set_boolean('enable-keep-awake', w.active);
        });

        
        const switchDefaultAll = new Adw.SwitchRow({
            title: 'Is the default selected media player All?',
            subtitle: 'Whether the default selected media player is \'All\' or not.',
            active: settings.get_boolean('default-media-is-all'),
        });

        switchDefaultAll.connect('notify::active', w => {
            settings.set_boolean('default-media-is-all', w.active);
        });

        group.add(switchAwake);
        group.add(switchNotification);
        group.add(switchDefaultAll);
    }
}
