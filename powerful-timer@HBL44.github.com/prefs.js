'use strict';

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { endOptionnalCommands } from './shared-commands.js';

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
            title: 'Settings',
        });
        page.add(group);


        const switchNotification = new Adw.SwitchRow({
            title: 'Enable Notifications',
            subtitle: 'Whether to show notifications.',
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
            subtitle: 'Whether the default selected media player is \'All\' or \'None\'.',
            active: settings.get_boolean('default-media-is-all'),
        });

        switchDefaultAll.connect('notify::active', w => {
            settings.set_boolean('default-media-is-all', w.active);
        });


        // Add a title to the available commands section
        const commandsTitle = new Gtk.Label({
            label: '<b>On Timer Ends Options</b>',
            use_markup: true,
            halign: Gtk.Align.START,
        });

        //Scrollable list of commands
        const commandListBox = new Gtk.ListBox();
        commandListBox.set_selection_mode(Gtk.SelectionMode.MULTIPLE);

        endOptionnalCommands.forEach(({ label }) => {
            const row = new Gtk.ListBoxRow();
            const checkButton = new Gtk.CheckButton({ label });
            checkButton.active = settings.get_strv('selected-timer-end-commands').includes(label);

            checkButton.connect('toggled', button => {
                const selectedCommands = settings.get_strv('selected-timer-end-commands');
                if (button.active) {
                    selectedCommands.push(label);
                } else {
                    const index = selectedCommands.indexOf(label);
                    if (index > -1) {
                        selectedCommands.splice(index, 1);
                    }
                }
                settings.set_strv('selected-timer-end-commands', selectedCommands);
            });

            row.set_child(checkButton);
            commandListBox.append(row);
        });
        
        const scrollableList = new Gtk.ScrolledWindow({
            vexpand: true,
            hexpand: true,
        });
        scrollableList.set_child(commandListBox);
        

        group.add(commandsTitle);
        group.add(scrollableList);
        group.add(switchAwake);
        group.add(switchNotification);
        group.add(switchDefaultAll);
    }
}
