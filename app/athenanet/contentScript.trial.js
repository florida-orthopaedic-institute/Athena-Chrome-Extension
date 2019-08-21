const PATIENT_ID = "PATIENT_ID";

log("loading athenanet contentScript");

var getPatientIdScript = document.createElement("script");

getPatientIdScript.innerHTML =
"console.log('in getPatientIdScript'); " +
"var _patientId = null; " +
"window.setInterval(() => { " +
"   console.dir(CurrentPatient.V1.GetCurrentPatient()); " +
"   let patient = JSON.parse(CurrentPatient.V1.GetCurrentPatient()); " +
"   console.log('Current Value of Patient is: ' + _patientId + ' found new value of: ' + patient.patientid); " +
"   if (patient && _patientId != patient.patientid) { " +
"       _patientId = patient.patientid; " +
"       console.log('Patient ID Updated to: ' + _patientId); " +
"       window.postMessage({type: '" + PATIENT_ID + "', text: patient.patientid}, '*'); " +
"   } " +
"}, 1000);";

window.addEventListener("message", function(event) {
    this.console.dir(event);
    if (event.source != window) {
        return;
    }
    if (event.data.type && (event.data.type == PATIENT_ID)) {
        messagePatientId(event.data.text);
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    log("Received message from " + (sender.tab ? sender.tab.url : "the extension"));
    if (request.test) {
        log("Recieved Test Button Click");
        log("CurrentPatient: " + document.);
        sendResponse("Event Received");
    }
});

//document.body.appendChild(getPatientIdScript);

//window.CurrentPatient.V1.GetCurrentPatient();

function messagePatientId(patientId) {
    log("Messaging Patient ID: " + patientId);
    chrome.runtime.sendMessage({ patientId: patientId }, () => {
        log("Patient ID " + patientId + " sent");
    });
}

function log(message) {
    console.log("FOI_Athena: " + message);
}