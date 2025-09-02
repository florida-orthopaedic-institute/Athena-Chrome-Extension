// This script allows the user to set options for the extension
// It allows the user to enable or disable the efferent tab
// It shows the user the history of the changes


import { log } from './helper.js'

//Chrome Storage sync settings
let _efferentEnabled = true; //Controls if Efferent Tab is Updated after patient navigation

let efferentCheckbox = null;
let versionHeaders = null;

// Initialize the Chrome Cache
chrome.storage.sync.get().then((items) => {
    log(items);
    if (items && items.efferentEnabled != null) {
        if (items.efferentEnabled != _efferentEnabled) {
            _efferentEnabled = items.efferentEnabled;
        }
    } else {
        chrome.storage.sync.set({efferentEnabled: _efferentEnabled});
    }

    loadOptionValues();
});

// Listen for changes in Chrome storage and update the UI accordingly
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        if (changes.efferentEnabled && changes.efferentEnabled.newValue != _efferentEnabled) {
            _efferentEnabled = changes.efferentEnabled.newValue;
        }
        
        loadOptionValues();
    }
});

// Once DOM is loaded update Efferent Checkbox and Version History
document.addEventListener('DOMContentLoaded', () => {
    efferentCheckbox = document.getElementById('efferentCheckbox');
    efferentCheckbox.addEventListener("click", switchEfferent);
    log("Efferent Enabled: " + _efferentEnabled);

    versionHeaders = document.querySelectorAll('h3.version');
    versionHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener("click", () => switchVisibility(header.nextElementSibling));
    });
}, false);



 /**
  * Switches the state of the Efferent tab based on user interaction.
  */
function switchEfferent() {
    if (efferentCheckbox.checked) {
        log("Switching Efferent Enabled from " + _efferentEnabled + " to true");
        _efferentEnabled = true;
    } else {
        log("Switching Efferent Enabled from " + _efferentEnabled + " to false");
        _efferentEnabled = false;
    }
    chrome.storage.sync.set({ efferentEnabled: _efferentEnabled });
}

/**
 * Switches the visibility of a given container element.
 * @param {*} container - The container element to toggle visibility for.
 */
function switchVisibility(container) {
    if (container.style.display === 'none') {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

/**
 * Loads the option values from the Chrome storage and updates the UI accordingly.
 */
function loadOptionValues() {
    efferentCheckbox.checked = _efferentEnabled;
}