# Powerful Timer - GNOME Shell Extension

A GNOME Shell extension that provides a configurable timer.

## Features

- **Configurable Timer**: Set timer duration from 1 minute to 48 hours
- **Flexible Step Control**: Choose from 1, 5, 10, or 30-minute increments
- **Pause/Resume**: Pause and resume timer countdown
- **Configurable actions**: Choose media players to pause at timer expiration
- **Visual Feedback**: Real-time countdown display and configurable notifications

## Installation

### Manual Installation

1. Clone or download this repository
2. Deploy using npm:
   ```bash
   npm run deploy
   ```
3. Restart GNOME Shell (Alt+F2, type 'r', press Enter) on X11, log out and back in on Wayland
4. Enable the extension in GNOME Extensions app

## Usage

1. **Access the Timer**: Click the alarm icon in the GNOME panel
2. **Optionnal: Select Media Source**: Choose from available media players or "All players"
3. **Adjust Step Size**: Click the step button to cycle through 1, 5, 10, or 30-minute increments
4. **Set Timer Duration**: Use +/- buttons to adjust the timer (1-2880 minutes)
5. **Start Timer**: Click the play button to start the countdown
6. **Control Timer**: Use pause/resume and stop buttons as needed

## Requirements

- GNOME Shell 46+
- `playerctl` command-line tool (for media player control)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the terms specified in the LICENSE file.
