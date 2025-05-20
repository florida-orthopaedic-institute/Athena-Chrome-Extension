// This script runs in the context of the AthenaNet page
// It is injected by the extension and has access to the DOM of the page
// It is used to extract the patient ID from the page and send it to the background script

// Athena patient ID is a 7 digit number, starting with a #
// Example: #1234567
// The patient ID is stored in a shadow DOM element with the class 'pb_c_patient-id-module__detail'
// The patient ID is extracted from the innerHTML of the element
// The patient ID is sent to the background script using chrome.runtime.sendMessage
// The background script will then store the patient ID in the local storage
// The patient ID is stored in the local storage with the key 'patientId'
// The practice ID is extracted from the URL of the page
// The practice ID is the first part of the URL after the domain name
// Example: https://athenanet.athenahealth.com/1234567/Patient/1234567
// The practice ID is stored in the local storage with the key 'practiceId'

const pidRegex = /^#([0-9][0-9][0-9][0-9][0-9][0-9][0-9])$/

if (window.name == 'frMain') {
    let bannerShadowContainers = window.document.querySelectorAll('#nimbus-banner-shadow-dom-container, .autostart');
    bannerShadowContainers.forEach( function(bannerShadowContainer) {
        if (bannerShadowContainer.shadowRoot) {
            log("found patient ID container");

            var observer = new MutationObserver(function(mutations) {
                log("change to patient ID detected, searching for a patient id");
                let details = bannerShadowContainer.shadowRoot.querySelectorAll('.pb_c_patient-id-module__detail');
                details.forEach(function(detail) {                    
                    var matches = detail.innerHTML.trim().match(pidRegex);
                    if (matches && matches.length == 2) {
                        storePatientId(matches[1], window?.location?.pathname?.split('/')[1]);
                    }
                });
            });
            observer.observe(bannerShadowContainer.shadowRoot, {childList: true});
        }
    });
}

async function storePatientId(patientId, practiceId) {
    log("Messaging Patient ID: " + patientId + " and Practice ID: " + practiceId);
    await chrome.runtime.sendMessage({
        patientId: patientId,
        practiceId: practiceId
    });
}

function log(message, obj) {
    if (typeof message == 'string') {
        console.log("FOI_Athena: " + message);
    } else {
        console.dir(message);
    }

    if (obj) {
        console.dir(obj);
    }
}