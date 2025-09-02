// This script runs in the context of the Efferent page
// It is injected by the extension and has access to the DOM of the page
// It is used to navigate the login screen and select the organization, application, and role
// The script waits for the login screen to load and then selects the organization, application, and role
// The script then submits the login form



let confirmButton = null;   //button to submit the login form after organization selection
let orgSelect = null;       //select control to specify the organization
let appSelect = null;       //select control to specify the application
let roleSelect = null;      //select control to specify the role

//Wait for the options to be loaded in the Organization selection drop down before submitting the form
//This is also used to ensure that this script is only run if login screen is active
waitForElement("#loginContainer #idSelectOrganization option:nth-of-type(4)", 20000)
.then(function(){
    log("Login Screen Identified.");
    orgSelect = document.getElementById("idSelectOrganization");
    appSelect = document.getElementById("idSelectApplication");
    roleSelect = document.getElementById("idSelectRole");
    confirmButton = document.getElementById("confirmButtonP1");
    
    //set the value to FOI if not set
    if (orgSelect.value == "invalid") {
        log("Setting the Organization to FOI");
        orgSelect.value = 70; //FOI
    }

    //set the value to eVue if not set
    if (appSelect.value != "/applications/eVue") {
        log("Setting the Application to eVue");
        appOption = document.createElement("option");
        appOption.value = "/applications/eVue"
        appOption.text = "eVue"
        appSelect.add(appOption);
        appSelect.value = "/applications/eVue";
    }

    //set the value to USER if not set
    if (roleSelect.value != "USER" || roleSelect.value != "ADMIN") {
        log("Setting the Role to User");
        roleOption = document.createElement("option");
        roleOption.value = "USER"
        roleOption.text = "USER"
        roleSelect.add(roleOption);
        roleSelect.value = "USER"
    }

    log("Logging in...");
    confirmButton.dispatchEvent(new PointerEvent('pointerdown'));

}).catch((error)=>{
    if (error) {
        log(error);
    } else {
        log("Search for login screen timed out. Login Screen Not Identified.");
    }
});


/**
 * Wait for an element before resolving a promise
 * @param {String} querySelector - Selector of element to wait for
 * @param {Integer} timeout - Milliseconds to wait before timing out, or 0 for no timeout              
 */
function waitForElement(querySelector, timeout){
    return new Promise((resolve, reject)=>{
        var timer = false;
        if(document.querySelector(querySelector)) return resolve();
        const observer = new MutationObserver(()=>{
        if(document.querySelector(querySelector)){
            observer.disconnect();
            if(timer !== false) clearTimeout(timer);
            return resolve();
        }
        });
        observer.observe(document.body, {
        childList: true, 
        subtree: true
        });
        if(timeout) timer = setTimeout(()=>{
        observer.disconnect();
        reject();
        }, timeout);
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