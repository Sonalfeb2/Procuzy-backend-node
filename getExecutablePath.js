const { execSync } = require('child_process');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const getChromeExecutablePath = () => {
    if (process.env.NODE_ENV === 'production') {
        // List of possible paths to check
        const paths = [
            '/usr/bin/google-chrome-stable',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
        ];

        // Check if any of the paths exist
        for (let path of paths) {
            if (fs.existsSync(path)) {
                return path;
            }
        }

        // Try using 'which' or 'where' command to find the path dynamically
        try {
            if (process.platform === 'win32') {
                const chromePath = execSync('where chrome').toString().split('\r\n')[0];
                if (fs.existsSync(chromePath)) {
                    return chromePath;
                }
            } else {
                const chromePath = execSync('which google-chrome-stable').toString().trim();
                if (fs.existsSync(chromePath)) {
                    return chromePath;
                }
            }
        } catch (error) {
            console.error('Chrome not found using system commands.');
        }

        // Fallback to Puppeteer's bundled Chromium if no path is found
        throw new Error('No Chrome executable found in the standard paths');
    } else {
        // For development, use Puppeteer's bundled Chromium
        return puppeteer.executablePath();
    }
};

module.exports = getChromeExecutablePath;
