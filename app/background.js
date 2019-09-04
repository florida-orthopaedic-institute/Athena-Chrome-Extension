const MEDVIEW_URL = "https://pacs.floridaortho.com/";
const ATHENA_URL = "https://athenanet.athenahealth.com/";

const MEDVIEW_MATCH_URL = MEDVIEW_URL + "*";
const ATHENA_MATCH_URL = ATHENA_URL + "*";

const MEDVIEW_STUDY_URL = MEDVIEW_URL + "accessnet/imageweb/ExamLoad.aspx?ExamID=";
const MEDVIEW_PATIENT_URL = MEDVIEW_URL + "accessnet/imageweb/ExamLoad.aspx?PatientID=";

const MEDVIEW_API_URL = 'https://pacs.floridaortho.com/accessnet/api/ExamApi/ExamSearch?PatientId=';

var _studyId = null;  //The Current Study Loaded in Medview
var _patientId = null; //The Current Patient Loaded in Medview and Athena
var _medviewTab = null;
var _athenaTab = null;
var _enabled = true; //Boolean that controls if navigation occurs


///On receipt of a enabled storage request, update the local variable.
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
  log("Received message from " + (sender.tab ? sender.tab.url : "the extension"));

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
    log("Received new Patient Id, updating storage");
    _patientId = request.patientId;

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
        if (patientArray.length && patientArray[0].Exams && patientArray[0].Exams.length && patientArray[0].Exams[0].Study && patientArray[0].Exams[0].Study.StudyID) {
          _studyId = patientArray[0].Exams[0].Study.StudyID;
          log("Found Study ID: " + _studyId + ", Storing and navigating to study.");
          updateOrInsertTab(MEDVIEW_STUDY_URL + _studyId);
        }
      }).catch(function(error) {
        log("Unable to search with API, falling back to manual update by patient");
        updateOrInsertTab(MEDVIEW_PATIENT_URL + _patientId);
      });
  }

  //If message contains a studyId
  if (request.studyId && request.studyId != _studyId) {
    log("Received new Study Id, updating storage");
    _studyId = request.studyId;
    log("Updating Medview Tab with new URL");
    updateOrInsertTab(MEDVIEW_STUDY_URL + _studyId);
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