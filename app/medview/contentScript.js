console.log("FOI_Athena: loading medview contentScript");
let checkInterval = 1000;
let checkLimit = (new Date()).getTime() + 30 * checkInterval;


checkLoaded();

function checkLoaded() {
    let recheck = true;
    //check if an exam is loaded and message if found
    let examBanner = document.getElementsByTagName("exam-banner");
    if (examBanner.length &&
        examBanner[0].children.length &&
        examBanner[0].children[0].children.length > 3 &&
        examBanner[0].children[0].children[3].children.length > 1) {
        messageStudyId(examBanner[0].children[0].children[3].children[1].innerText);
        recheck = false;
    }

    //check if patient id is available and message if found
    let patients = document.getElementsByClassName("mat-column-Patient-PatientID");
    if (patients.length > 1) {
        log("Found Patient Id:" + patients[1].innerText);
        messagePatientId(patients[1].innerText);
        recheck = false;
    }

    //check if multiple studies were found and message top result if found
    let studies = document.getElementsByClassName("mat-column-Study-StudyID");
    if (studies.length > 2) {
        log("Found " + (studies.length - 1) + " studies");
        messageStudyId(studies[1].innerText);
        recheck = false;
    }

    if (recheck && new Date() < checkLimit) {
        log("Found no studies, rechecking in " + checkInterval + "ms");
        setTimeout(checkLoaded, checkInterval);
    } else {
        log("Finished checking for studies");
    }
}

function messagePatientId(patientId) {
    log("Messaging Patient ID: " + patientId);
    chrome.runtime.sendMessage({ patientId: patientId }, () => {
        log("Patient ID " + patientId + " sent");
    });
}

function messageStudyId(studyId) {
    log("Messaging Study ID " + studyId);
    chrome.runtime.sendMessage({ studyId: studyId }, () => {
        log("Study ID " + studyId + " sent");
    });
}

function log(message) {
    console.log("FOI_Athena: " + message);
}