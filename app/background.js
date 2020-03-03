const MEDVIEW_URL = "https://pacs.floridaortho.com/";
const ATHENA_URL = "https://athenanet.athenahealth.com/";

const MEDVIEW_MATCH_URL = MEDVIEW_URL + "*";
const ATHENA_MATCH_URL = ATHENA_URL + "*";

const MEDVIEW_STUDY_URL = MEDVIEW_URL + "accessnet/imageweb/ExamLoad.aspx?ExamID=";
//const MEDVIEW_STUDY_URL = MEDVIEW_URL + "accessnet/imageweb/ExamLoad.aspx?ExamID={ExamID}&StartPage=Series&PatientID={PatientID}";
const MEDVIEW_PATIENT_URL = MEDVIEW_URL + "accessnet/imageweb/ExamLoad.aspx?PatientID=";

const MEDVIEW_API_URL = 'https://pacs.floridaortho.com/accessnet/api/ExamApi/ExamSearch?PatientId=';
const FOI_EXAM_REGEX = /18802$/

var _studyId = null;  //The Current Study Loaded in Medview
var _patientId = null; //The Current Patient Loaded in Medview and Athena
var _medviewTab = null;
var _athenaTab = null;
var _enabled = true; //Boolean that controls if navigation occurs


///On receipt of an enabled storage request, update the local variable.
chrome.storage.sync.get(['enabled'], function(result) {
  log("The plugin is currently " + result ? "enabled" : "disabled");
  _enabled = result;
});

//When a chrome tab is removed
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  //check if it is a medview tab or athena tab
  if (_medviewTab && tabId === _medviewTab.id) {
    log("Medview Tab Closed, updating storage");
    _medviewTab = null;
    _patientId = null;
    _studyId = null;
  } else if (_athenaTab && tabId === _athenaTab.id) {
    log("Athena Tab Closed, updating storage");
    _athenaTab = null;

    //if medview tab is open, close it
    if (_medviewTab) {
      log("Closing Medview Tab");
      chrome.tabs.remove(_medviewTab.id);
    }
  }
});

//When a message is received by the background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log("Received message from " + ((sender.tab ? sender.tab.url : "the extension") + ", tab id: " + sender.tab.id));

  //register tab owner
  switch (request.source) {
    case "Medview": _medviewTab = sender.tab; break;
    case "Athena": _athenaTab = sender.tab; break;
    case "Extension": break;
    default: break;
  }


  //If it is an enabled update
  if (typeof request.enabled === 'boolean') {
    log("Changing Enabled State to " + request.enabled);
    chrome.storage.local.set({enabled: request.enabled}, function() {
      log("Set Enabled to " + request.enabled);
      _enabled = request.enabled;
    });
  }

  //if plugin is not enabled quit processing
  if (!_enabled) {
    sendResponse({received: true});
    return;
  }

  //if the message is a patient ID
  if (request.patientId && request.patientId != _patientId) {
    log("Received new Patient ID: " + request.patientId + " from source: " + request.source + ", updating storage");
    _patientId = request.patientId;

    if (request.source == "Athena") {
      //Make API call to pacs to retrieve last study for patient.
      fetch(MEDVIEW_API_URL + _patientId)
        //response should be JSON formated object with fetch wrapper.
        .then(function(response) {
          console.dir(response);
          if (!response.ok) {
            throw Error(response.statusText);
          }
          return response.json();
        }).then(function(patientArray) {
          console.dir(patientArray);
          //Get the first patient, first exam study ID
          var studyId = patientArray[0].Exams[0].Study.StudyID;
          //updateOrInsertTab(
          //    MEDVIEW_STUDY_URL.replace("{ExamID}", _studyId).replace("{PatientID}", _patientId));


          if (FOI_EXAM_REGEX.test(studyId)) {
            _studyId = studyId;
            log("Found Study ID: " + _studyId + ", Storing and navigating to study.");
            updateOrInsertTab(MEDVIEW_STUDY_URL + _studyId);
          } else {
            _studyId = null;
            log("Study ID not from FOI, may result in duplicates, presenting all patient exams");
            updateOrInsertTab(MEDVIEW_PATIENT_URL + _patientId);
          }
        }).catch(function(error) {
          log("Unable to search with API, presenting all patient exams, " + error.message);
          updateOrInsertTab(MEDVIEW_PATIENT_URL + _patientId);
        });
    }
  }

  //If message contains a studyId
  //and sent from Athena
  if (request.studyId && request.studyId != _studyId) {
    
    log("Received new Study ID: " + request.studyId + " from source: " + request.source + ", updating storage");
    _studyId = request.studyId;
    if (request.source == "Athena") {
      log("Updating Medview Tab with new URL");
      updateOrInsertTab(MEDVIEW_STUDY_URL + _studyId);
    }
  }

  sendResponse({received: true});

});

function updateOrInsertTab(url) {
  if (!_athenaTab) {
    chrome.tabs.query({url: ATHENA_MATCH_URL}, (athenaTabs) => {
      log("Found " + athenaTabs.length + " tabs matching " + ATHENA_MATCH_URL);
      if (athenaTabs.length) {
        _athenaTab = athenaTabs[0];
        lookForMedviewAndCreateIfNotExists(url);
      }
    });
  } else {
    lookForMedviewAndCreateIfNotExists(url);
  }
}

function lookForMedviewAndCreateIfNotExists(url) {
  if (_medviewTab) {
    log("Updating Existing Medview Tab ID: " + _medviewTab.id + " with URL: " + url);
    chrome.tabs.update(_medviewTab.id, { url: url }, (medviewTab) => {
      log("Successfully Set URL of Tab ID: " + medviewTab.id + " with URL: " + url);
    });
  } else {
    chrome.tabs.query({url: MEDVIEW_MATCH_URL}, (medviewTabs) => {
      log("Found " + medviewTabs.length + " tabs matching " + MEDVIEW_MATCH_URL);
      if (medviewTabs.length) {
        _medviewTab = medviewTabs[0];
        chrome.tabs.update(_medviewTab.id, { url: url }, (medviewTab) => {
          log("Successfully Set URL of Tab ID: " + medviewTab.id + " with URL: " + url);
        });
      } else {
        chrome.tabs.create({
          url: url,
          active: false,
          windowId: _athenaTab.windowId,
          index: _athenaTab.index + 1
        }, (medviewTab) => {
          log("Created new Medview Tab ID: " + medviewTab.id + " with URL: " + url);
          _medviewTab = medviewTab;
        });
      }
    });
  }
}

function log(message) {
  console.log("FOI_Athena: " + message);
}