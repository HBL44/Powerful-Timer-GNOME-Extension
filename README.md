# Powerful Timer - GNOME Shell Extension

A GNOME Shell extension that provides a configurable timer with advanced features and seamless integration.

## Features

- **Configurable Timer**: Set timer duration from 1 minute to 48 hours.
- **Flexible Step Control**: Choose from 1, 5, 10, or 30-minute increments.
- **Pause/Resume**: Pause and resume timer countdown.
- **Configurable Actions**: 
   - Pause media player(s).
   - Lock the screen.
   - Disable Bluetooth.
- **Visual Feedback**: Real-time countdown display and configurable notifications.
- **Media Source Selection**: Choose specific media players, "All players," or "None."
- **System Suspend Inhibition**: Prevent system suspend while the timer is active.

## Installation

### Manual Installation

1. Clone or download this repository.
2. Deploy using npm:
   ```bash
   npm run deploy
   ```
3. Restart GNOME Shell (Alt+F2, type 'r', press Enter) on X11, or log out and back in on Wayland.
4. Enable the extension in the GNOME Extensions app.

## Usage

1. **Access the Timer**: Click the alarm icon in the GNOME panel.
2. **Configure Actions**: Use the settings menu to enable or disable actions like pausing media, locking the screen, or disabling Bluetooth.
3. **Optionnal: Select Media Source**: If you turned the option on, select a source to pause from: "All players", "None", or any currently running media player.
4. **Adjust Step Size**: Click the step button to cycle through 1, 5, 10, or 30-minute increments.
5. **Set Timer Duration**: Use +/- buttons to adjust the timer (1 minute - 48 hours).
6. **Start Timer**: Click the play button to start the countdown.
7. **Control Timer**: Use pause/resume and stop buttons as needed.

## Requirements

- GNOME Shell 46+
- `playerctl` command-line tool (for media player control)

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test thoroughly.
5. Submit a pull request.

## License

This project is licensed under the terms specified in the LICENSE file.
