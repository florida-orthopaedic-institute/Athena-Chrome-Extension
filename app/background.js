// This script runs in the background and proesses messages from the content scripts
// It also listens for changes to the chrome storage and updates the efferent and medview tabs accordingly
// It also listens for changes to the athena patient ID and updates the efferent and medview tabs accordingly
// It also listens for changes to the athena practice ID and updates the efferent and medview tabs accordingly
// It also listens for changes to the efferent and medview enabled settings and updates the efferent and medview tabs accordingly
// It also listens for changes to the efferent and medview bearer tokens and updates the efferent and medview tabs accordingly


import { log } from './helper.js'

const efferent = {
  _url : "https://osm.efferenthealth.net/",
  get url() {
    return this._url;
  },
  get authURL() {
    return this._url + "fhir/StructureDefinition/ImagingStudy";
  },
  get apiURL() {
    return this._url + "fhir/ImagingStudy?subject:Patient.identifier={{patientID}}&_include=ImagingStudy:subject&_include=ImagingStudy:referrer&_include=ImagingStudy:endpoint&status=available&_summary=true";
  },
  get patientURL() {
    return this._url + "main.html?view=studyWorklist&URN=%2Ffhir%2FImagingStudy%3Fsubject%3APatient.identifier%3D{{patientID}}%26_include%3DImagingStudy%3Asubject%26_include%3DImagingStudy%3Areferrer%26_include%3DImagingStudy%3Aendpoint%26status%3Davailable%26_summary%3Dtrue";
  },
  get studyURL() {
    return this._url + "main.html?view=viewStudy&Study=";
  },

  _tab: null,
  get tab() {
    return this._tab;
  },
  set tab(value) {
    if (value != this._tab) {
      this._tab = value;
      if (!value) {
        this.close();
      }
    }
  },

  close: function() {
    if (efferent.tab) {
      log("Closing Efferent");
      chrome.tabs.remove(efferent.tab.id);
    }
  },
  
  _bearer: null,
  get bearer() {
    if (!this._bearer && athena.patientId) {
      //load efferent worklist to get new auth token
      this.navigate(this._url);
    }
    return this._bearer;
  },
  get bearerLog() {
    if (!this._bearer) {
      return "No Bearer Token";
    } else {
      return this._bearer.substring(0,10);
    }
  },
  set bearer(request) {
    if (request.requestHeaders && request.requestHeaders.length > 0) {
      request.requestHeaders.forEach(header => {
        if (header.name === "Authorization") {
          if (this._bearer !== header.value) {
            //log("updating Effernet Bearer Token from: " + this._bearer ? this._bearer.substring(0, 10) : "null" + 
            //  "to: " + header.value ? header.value.substring(0, 10) : "null");
            this._bearer = header.value;
            this.update();
          }
        }
      });
    }
  },
  
  _enabled: true,
  get enabled() {
    return this._enabled;
  },
  set enabled(value) {
    if (this._enabled != value ) {
      if (!value && this.tab) {
        this.close();
      }
      this._enabled = value;
    }
  },

  update: function() {  
    if (!efferent._enabled) {
      log("Efferent Disabled, ignoring request");
      return;
    }
    if (!athena.patientId || !efferent.bearer) {
      log("Athena Patient ID: " + athena.patientId + ", Efferent Bearer: " + efferent.bearerLog + "... cancelling Update.");
      efferent.close();
      return;
    }

    log("Updating Efferent to patientID: " + athena.patientId);
  
    let patientURL = efferent.apiURL.replace("{{patientID}}", athena.patientId);
    fetch(patientURL, {
      headers: {Authorization: efferent.bearer}
    })
    .then(function(response) {
      console.dir(response);
      if (response.ok) {
        return response.json();
        

      } else {
        efferent.bearer = null;
        
        throw Error("New authorization token needed");
      }
      
    })
    .then(function(jsonResponse) {
      log("Recieved JSON Response of: ", jsonResponse);
        //Get the first patient, first exam study ID
        if (jsonResponse && jsonResponse.entry && jsonResponse.entry[0]) {
          jsonResponse.entry.sort((a,b) => 
            new Date(b.resource.started) - new Date(a.resource.started)
          );
          let efferentStudyId = jsonResponse.entry[0].resource.id;
          log("Found Study ID: " + efferentStudyId + ", Storing and navigating to study.");
          efferent.navigate(efferent.studyURL + efferentStudyId)
        }
        else {
          efferent.navigate(efferent.patientURL.replace("{{patientID}}", athena.patientId));
        }
    })
    .catch(function(error) {
      log("Unable to access the Efferent API, " + error.message);
    });
  },
  navigate: function(url) {
    //if we don't have a bearer token and one isn't being requested, request one.
    if (url != efferent.url && !efferent.bearer) {
      efferent.navigate(efferent.url);
      log("Efferent Bearer Token not found, refreshing Token.");
      return;
    }

    if (efferent.tab) {
      log("Updating Existing Efferent Tab ID: " + efferent.tab.id + " with URL: " + url);
      chrome.tabs.update(efferent.tab.id, { url: url })
      .then((efferentTab) => {
        log("Successfully Set URL of Tab ID: " + efferentTab.id + " with URL: " + url);
      });
    } else {
      chrome.tabs.query({url: efferent.url + "*"})
      .then((efferentTabs) => {
        log("Found " + efferentTabs.length + " tabs matching " + efferent.url);
        if (efferentTabs.length) {
          efferent.tab = efferentTabs[0];
          efferent.navigate(url);
        } else {
          log(athena);
          chrome.tabs.create({
            url: url,
            active: false,
            windowId: athena.tab.windowId,
            index: athena.tab.index + 1
          })
          .then((efferentTab) => {
            log("Created new Efferent Tab ID: " + efferentTab.id + " with URL: " + url);
            efferent.tab = efferentTab;
          });
        }
      });
    }
  }
};

const athena = {
  _url: "https://athenanet.athenahealth.com/",
  _practiceId: 0,
  get practiceId() {
    return this._practiceId;
  },
  set practiceId(value) {
    this._practiceId = value;
  },
  get url() {
    return this._url;
  },
  _tab: null,
  get tab() {
    if (!this._tab) {
      chrome.tabs.query({url: athena.url + "*"}, (athenaTabs) => {
        log("Found " + athenaTabs.length + " tabs matching " + athena.url);
        if (athenaTabs.length) {
         athena.tab = athenaTabs[0];
        }
      });
    }
    return this._tab;
  },
  set tab(value) {
    if (value != this._tab) {
      this._tab = value;
      if (!value) {
        this.close();
      }
    }
  },
  close: function () {
    if (athena.tab) {
      log("Closing Athena Tab");
      chrome.tabs.remove(athena.tab.id);
    }
    efferent.close();
    //medview.close();
  },

  _patientId: null,
  get patientId() {
    if (!this._patientId) {
      efferent.close();
      //medview.close();
    }
    return this._patientId;
  },
  set patientId(value) {
    if (this._patientId !== value) {
      log("updating Athena Patient ID from: " + this._patientId + "to: " + value);
      this._patientId = value;
      if (value) {
        //medview.update();
        efferent.update();
      } else {
        //if pacs tabs are open, close them
        efferent.close();
        //medview.close();
      }
    }
  }
};

//Update local cache with chrome storage sync settings on load
const initCache = chrome.storage.sync.get().then((items) => {
  log(items);
  // Copy the data retrieved from storage into storageCache
  //if (items && items.medviewEnabled != null) {
  //    medview.enabled = items.medviewEnabled;
  //} else {
  //    chrome.storage.sync.set({medviewEnabled: medview.enabled});
  //}
  if (items) { 
    if (items.v2_2 != null || items.v2_2 == false) {
      //reset the status of selected PACS system in V2.2 to efferent
      efferent.enabled = true;
      chrome.storage.sync.set({efferentEnabled: true, v2_2: true});
    } else if (items.efferentEnabled != null) {
      efferent.enabled = items.efferentEnabled;
    } else {
      chrome.storage.sync.set({efferentEnabled: efferent.enabled});
    }
  }
});

//When a chrome storage item changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  log("storage changed in namespace: " + namespace, changes);
  //if it is a sync setting
  if (namespace === 'sync') {
    if (changes.efferentEnabled) {
      efferent.enabled = changes.efferentEnabled.newValue;
    }

    //if (changes.medviewEnabled) {
    //  medview.enabled = changes.medviewEnabled.newValue;
    //}
  }
  
  //if it is a session setting
  if (namespace === 'session') {
    if (changes.athenaPatientId) {
      athena.patientId = changes.athenaPatientId.newValue;
    }
  }
});

//Listen for Events from Tabs
chrome.runtime.onMessage.addListener((request, sender, sendReponse) => {
  if (sender.tab) {
    log("Received Message from Tab ID: " + sender.tab.id);
    if (request.patientId) {
      athena.tab = sender.tab;
      athena.patientId = request.patientId;
    }
    if (request.practiceId) {
      athena.practiceId = request.practiceId;
    }
  }  
});

//When a chrome tab is removed
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  //check if it is a medview tab or athena tab
  //if (medview.tab && tabId === medview.tab.id) {
  //  log("Medview Tab Closed, updating storage");
  //  medview.tab = null;
  //} else 
  if (efferent.tab && tabId === efferent.tab.id) {
    log("Efferent Tab Closed, updating storage");
    efferent.tab = null;
  } else if (athena.tab && tabId === athena.tab.id) {
    log("Athena Tab Closed, updating storage");
    athena.tab = null;
  }
});


//Listen for Efferent requests and pull Authorization information
chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
  //console.log(details);
  if (details && details.url.includes(efferent.url)) {
    efferent.bearer = details;
  }
}, 
  { urls: [efferent.authURL] },
  ["requestHeaders"]
);