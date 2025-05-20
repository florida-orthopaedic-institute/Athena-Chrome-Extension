// this script logs application messages to the console
// it prepends the message with the string "FOI_Athena"
// and logs the object if provided

export function log(message, obj) {
    if (typeof message == 'string') {
        console.log("FOI_Athena: " + message);
    } else {
        console.dir(message);
    }

    if (obj) {
        console.dir(obj);
    }
}