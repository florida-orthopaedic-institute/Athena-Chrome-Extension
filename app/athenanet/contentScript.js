// This script runs in the context of the AthenaNet page
// It is injected by the extension and has access to the DOM of the page
// It is used to extract the patient ID from the page and send it to the background script

// The practice ID is extracted from the URL of the page
// The practice ID is the first part of the URL after the domain name
// Example: https://athenanet.athenahealth.com/1234567

// The patient ID is extracted from the data-props attribute of the autostart element on clinical pages
let autostartContainers = window.document.querySelectorAll('.autostart[data-props]');
Array.from(autostartContainers).some(container => {
    let dataProps = JSON.parse(container.getAttribute('data-props'));
    if (dataProps && dataProps.patientEntity && dataProps.patientEntity.EnterpriseID) {
        storePatientId(dataProps.patientEntity.EnterpriseID, window?.location?.pathname?.split('/')[1]);
        return true; // Exit the loop once we find the patient ID
    }
    return false; // Continue search through autostarts
});

// The patient ID is extracted from the value of the ENTERPRISEID input field on non-clinical pages
let enterpriseIdInputs = window.document.querySelectorAll(`input[name="ENTERPRISEID"]`);
Array.from(enterpriseIdInputs).some(input => {
    if (input.value) {
        storePatientId(input.value, window?.location?.pathname?.split('/')[1]);
        return true; // Exit the loop once we find the patient ID
    }
    return false; // Continue search through inputs
});

/**
 * Stores the patient ID and practice ID by sending a message to the background script.
 *
 * @param {string} patientId - The patient ID to store.
 * @param {string} practiceId - The practice ID to store.
 */
async function storePatientId(patientId, practiceId) {
    log("Messaging Patient ID: " + patientId + " and Practice ID: " + practiceId);
    await chrome.runtime.sendMessage({
        patientId: patientId,
        practiceId: practiceId
    });
}

/**
 * Logs messages with a custom prefix for easier troubleshooting.
 *
 * @param {string|object} message - The message to log.
 * @param {object} [obj] - Optional additional object to log.
 */
function log(message, obj) {
    if (typeof message == 'string') {
        console.log("Athena-Chrome-Extension: " + message);
    } else {
        console.dir(message);
    }

    if (obj) {
        console.dir(obj);
    }
}