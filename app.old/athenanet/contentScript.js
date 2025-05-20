console.log("FOI_Athena: loading athenanet contentScript on " + (window.name ?? "unnamed window"));
const pidRegex = /^#([0-9][0-9][0-9][0-9][0-9][0-9][0-9])$/
let patientIdFound = false;

if (window.name == 'frMain') {
    let bannerContainer = window.document.querySelector('#nimbus-banner-container');
    if (bannerContainer) {
        log("banner container found");
        let autoStarts = bannerContainer.querySelectorAll('.autostart');
        if (autoStarts && autoStarts.length) {
            Array.prototype.forEach.call(autoStarts, function(autoStart) {
                log("searching autostart data for a patient id")
                let dataProps = autoStart.getAttribute('data-props');
                if (dataProps && !patientIdFound) {
                    log("processing dataProps")
                    let data = JSON.parse(dataProps);
                    if (data && data.patientId) {
                        patientIdFound = true;
                        messagePatientId(data.patientId);
                    }
                }
            });
        }
    }

    let bannerShadowContainer = window.document.querySelector('#nimbus-banner-shadow-dom-container');
    if (!patientIdFound && bannerShadowContainer && bannerShadowContainer.shadowRoot) {
        log("banner shadow container found with shadowRoot");
        
        var observer = new MutationObserver(function(mutations) {
            log("change to bannerShadowContainer detected");
            
            let details = bannerShadowContainer.shadowRoot.querySelectorAll('.pb_c_patient-banner-component__detail');
            if (details && details.length) {
                log("searching banner details for a patient id");
                Array.prototype.forEach.call(details, function(detail) {
                    var matches = detail.innerHTML.trim().match(pidRegex);
                    log(matches);
                    if (matches && matches.length == 2) {
                        messagePatientId(matches[1]);
                    }
                })
            } else {
                log("neither autostart or banner details were found");
            }
        });

        observer.observe(bannerShadowContainer.shadowRoot, {childList: true});
    }    
}

function messagePatientId(patientId) {
    log("Messaging Patient ID: " + patientId);
    chrome.runtime.sendMessage({patientId: patientId, source: "Athena"}, () => {
        log("Patient ID " + patientId + " sent");
    });
}

function log(message) {
    console.log("FOI_Athena: " + message);
}

