let enabledCheckBox = document.getElementById('enabledCheckBox');
let testButton = document.getElementById('testButton');

chrome.storage.sync.get(['enabled'], function(result) {
    log("Plugin is currently " + (result ? "enabled" : "disabled"));
    enabledCheckBox.checked = result;
});

enabledCheckBox.onclick = (element) => {
    chrome.runtime.sendMessage({ enabled: enabledCheckBox.checked }, () => {
        log("Plugin is enabled: " + enabledCheckBox.checked);
    });
};

chrome.storage.onChanged.addListener((changes, namespace) => {
    console.dir(changes);
    if (changes.enabled) {
        log("Enabled option Changed, updating checkbox to " + changes.enabled.newValue);
        enabledCheckBox.checked = changes.enabled.newValue;
    }
});

function log(message) {
    console.log("FOI_Athena: " + message);
}