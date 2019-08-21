console.log("FOI_Athena: loading athenanet contentScript");

var demo = document.getElementsByClassName('patient-demographic-items');

if (demo.length && demo[0].children.length > 2 && demo[0].children[2].innerText.length > 1) {
    let patientId = demo[0].children[2].innerText.slice(1);
    console.log("FOI_Athena: found patient ID of " + patientId);
    messagePatientId(patientId);
}

function messagePatientId(patientId) {
    log("Messaging Patient ID: " + patientId);
    chrome.runtime.sendMessage({patientId: patientId}, () => {
        log("Patient ID " + patientId + " sent");
    });
}

function log(message) {
    console.log("FOI_Athena: " + message);
}