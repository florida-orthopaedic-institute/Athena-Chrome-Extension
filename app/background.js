const MEDVIEW_URL = "https://pacs.floridaortho.com/";
const ATHENA_URL = "https://athenanet.athenahealth.com/";

const MEDVIEW_MATCH_URL = MEDVIEW_URL + "*";
const ATHENA_MATCH_URL = ATHENA_URL + "*";

const MEDVIEW_STUDY_URL = MEDVIEW_URL + "accessnet/imageweb/ExamLoad.aspx?ExamID=";
const MEDVIEW_PATIENT_URL = MEDVIEW_URL + "accessnet/imageweb/ExamLoad.aspx?PatientID=";

var _studyId = null;  //The Current Study Loaded in Medview
var _patientId = null; //The Current Patient Loaded in Medview and Athena
var _medviewTab = null;
var _athenaTab = null;
var _enabled = true; //Boolean that controls if navigation occurs


chrome.storage.sync.get(['enabled'], function(result) {
  log("The plugin is currently " + result ? "enabled" : "disabled");
  _enabled = result;
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (_medviewTab && tabId === _medviewTab.id) {
    log("Medview Tab Closed, updating storage");
    _medviewTab = null;
    _patientId = null;
    _studyId = null;
  }

  if (_athenaTab && tabId === _athenaTab.id) {
    log("Athena Tab Closed, updating storage");
    _athenaTab = null;

    //if medview tab is open, close it
    if (_medviewTab) {
      log("Closing Medview Tab");
      chrome.tabs.remove(_medviewTab.id);
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log("Received message from " + (sender.tab ? sender.tab.url : "the extension"));

  if (typeof request.enabled === 'boolean') {
    log("Changing Enabled State to " + request.enabled);
    chrome.storage.local.set({enabled: request.enabled}, function() {
      log("Set Enabled to " + request.enabled);
      _enabled = request.enabled;
    });
  }

  let navigateToURL = null;

  if (request.patientId && request.patientId != _patientId && _enabled) {
    log("Received new Patient Id, updating storage");
    _patientId = request.patientId;
    navigateToURL = MEDVIEW_PATIENT_URL + _patientId;
  }

  if (request.studyId && request.studyId != _studyId && _enabled) {
    log("Received new Study Id, updating storage");
    _studyId = request.studyId;
    navigateToURL = MEDVIEW_STUDY_URL + _studyId;
  }

  if (navigateToURL) {
    log("Updating Medview Tab with new URL");
    updateOrInsertTab(navigateToURL);
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