// This script allows the user to set options for the extension
// It allows the user to enable or disable the efferent tab
// It shows the user the history of the changes


import { log } from './helper.js'

//Chrome Storage sync settings
let _efferentEnabled = true; //Controls if Efferent Tab is Updated after patient navigation

let efferentCheckbox = null;
let v1Header = null;
let v1History = null;

const initCache = chrome.storage.sync.get().then((items) => {
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


document.addEventListener('DOMContentLoaded', () => {
    efferentCheckbox = document.getElementById('efferentCheckbox');
    efferentCheckbox.addEventListener("click", switchEfferent);
    log("Efferent Enabled: " + _efferentEnabled);
    v1Header = document.getElementById('v1Header');
    v1Header.addEventListener("click", switchV1Visibilty);
    v1History = document.getElementById('v1History');
}, false);

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        if (changes.efferentEnabled && changes.efferentEnabled.newValue != _efferentEnabled) {
            _efferentEnabled = changes.efferentEnabled.newValue;
        }
        
        loadOptionValues();
    }
});

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

function switchV1Visibilty() {
    if (v1History.style.display === 'none') {
        v1History.style.display = 'block';
    } else {
        v1History.style.display = 'none';
    }
}

function loadOptionValues() {
    efferentCheckbox.checked = _efferentEnabled;
}