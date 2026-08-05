# Phone setup

## Open directly on Android

1. Download the ZIP to the phone.
2. Extract the complete folder.
3. Open `index.html` in Chrome or another modern browser.

`index.html` contains its own design and app logic, so the interface will still load if Android has difficulty resolving nearby CSS or JavaScript files.

## Import desktop progress

1. On the desktop app, open Settings.
2. Download a progress backup JSON file.
3. Send or copy that JSON file to the phone.
4. In the phone app, open Settings.
5. Select **Import progress backup** and choose the JSON file.

The same process works in reverse when transferring phone progress back to desktop.

## Install to the home screen

For a true standalone Progressive Web App experience, serve the folder over HTTPS and open it in Chrome. Then use Chrome's **Install app** or **Add to Home screen** option.

Opening `index.html` directly works offline but may not show the browser's installation prompt.
