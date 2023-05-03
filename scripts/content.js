// Program parameters
const brighteningPercentage = 100;
const gradientRatio = 1.2;
const gradientOn = false;
const opacityPercent = 0.5;
const colourSelectionProcess = "from-avatar";
const messagesTheme = "light";

// Constant strings
const payloadName = '--xms-outgoing-bg-color';
const listElementName = 'mws-conversation-list-item';
const messageElementName = 'mws-message-part-content';
const defaultColour = messagesTheme === "light" ? '#ecf3fe' : "#7cacf8";
const opacityHex = unitToHexadecimal(opacityPercent);

// Constant anonymous functions
const createColourCSS = (name, value) => {return `${name}:${value};`};
const createHTML = (string) => trustedTypes.createPolicy("forceInner", {
        createHTML : (to_escape) => to_escape
    }).createHTML(string);

// Variable instantiation
var currentColour, payloadString, payloadElement, payloadIndex;

/**
 * Waits for an element to be loaded before running code;
 * @param {string} selector The name of the selector to wait for 
 * @returns {Promise} The resolved promise waiting for the element
 */
function waitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

/**
 * Calls an error to the console
 * @param {string} errorMessage The error message to call
 */
function callError(errorMessage){
    console.error("ERROR: Injection Not Loaded!");
    console.error(`ERROR: ${errorMessage}`);
}

/**
 * Converts a decimal from [0,1] to hexadecimal from [00,FF]
 * @param {number} unit The decimal to convert
 * @returns 
 */
function unitToHexadecimal(unit){
    if (unit < 0 || unit > 1){
        callError("Invalid opacity value")
    }

    return (Math.round(unit * 255)).toString(16);
}

/**
 * Finds the most common colour in the canvas
 * @param {Object} canvas DOM canvas element
 * @returns {Object} The most common colour and its frequency
 */
function getCanvasColours(canvas) {
    var col, colours = {};
    var result = {
        count:0,
        colour:null
    }
    var pixels, r, g, b, a;
    r = g = b = a = 0;
    pixels = canvas.getImageData(0, 0, canvas.canvas.width, canvas.canvas.height);

    for (var i = 0, data = pixels.data; i < data.length; i += 4) {
        r = data[i];
        g = data[i + 1];
        b = data[i + 2];
        a = data[i + 3]; // alpha

        // skip pixels >50% transparent
        if (a < (255 / 2))
            continue; 

        col = rgbToHex(r, g, b);
        if (!colours[col])
            colours[col] = 0;
        colours[col]++;
    }
    
    for (key in colours){
        if (colours[key] > result.count){
            result.count = colours[key];
            result.colour = key;
        }
    }

    return result;
}

/**
 * Translates a hex string to rgb object
 * @param {string} hex The hex string to translate
 * @returns {Object} RGB object
 */
function hexToRgb(hexColour) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hexColour = hexColour.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColour);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Translates RGB values into a hex string
 * @param {number} r The red component of the colour
 * @param {number} g The green component of the colour
 * @param {number} b The blue component of the colour
 * @returns {string} The hex value of the colour
 */
function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid colour component";
    return "#" + ((r << 16) | (g << 8) | b).toString(16);
}

/**
 * Creates a CSS string of a light to darker gradient given a hex colour
 * @param {string} hexColour The hex colour of the topColour
 * @returns {string} CSS of a linear gradient 
 */
function gradient(hexColour) {
    topColour = hexColour.substring(0, hexColour.length - 2);

    var top = hexToRgb(topColour);

    // Gradient ratio can be updated with a constant
    var r = Math.floor(top.r / gradientRatio);
    var g = Math.floor(top.g / gradientRatio);
    var b = Math.floor(top.b / gradientRatio);
    var bottomColour = rgbToHex(r, g, b);
    
    return `linear-gradient(to bottom, ${topColour} 0%, ${bottomColour} 100%)`;
}

/**
 * Brightens the hex colour
 * @param {string} hexColour The hex colour to brighten
 * @param {string} magnitude The magnitude to which to brighten
 * @returns {string} The brightened hex colour
 */
function brightenColour(hexColour, magnitude) {
    hexColour = hexColour.substring(1, 9);
    const decimalColour = parseInt(hexColour, 16);
    let r = (decimalColour >> 16) + magnitude;
    r > 255 && (r = 255);
    r < 0 && (r = 0);
    let g = (decimalColour & 0x0000ff) + magnitude;
    g > 255 && (g = 255);
    g < 0 && (g = 0);
    let b = ((decimalColour >> 8) & 0x00ff) + magnitude;
    b > 255 && (b = 255);
    b < 0 && (b = 0);

    hexColour = `#${(g | (b << 8) | (r << 16)).toString(16)}${opacityHex}`;
 
    return gradientOn ? gradient(hexColour) : hexColour;
}

/**
 * Finds the style tag that has the payload
 * @returns {[Object, number]} The payload DOM element and the index of where 
 * the payload is in the element
 */
function getStyleTag(){
    var payloadIndex;
    
    for (var element of document.getElementsByTagName('style')){
        payloadIndex = element.innerHTML.indexOf(payloadString);
        if (payloadIndex != -1){
            console.log("Payload Stored!");
            return [element, payloadIndex];
        }
    }
    
    callError("Can't find payload")
}

/**
 * Updates the SMS outgoing colour to a new one.
 * 
 * This is done by finding the style tag that defines the variable for the 
 * message background colour. It then replaces that variable value with a new
 * new CSS colour.
 * @param {string} colour The CSS value for the new colour 
 */
function updateBackgroundColour(colour){
    var leftSubstring, rightSubString;
    if (!payloadElement || !payloadIndex){
        [payloadElement, payloadIndex] = getStyleTag();
    }

    leftSubstring = payloadElement.innerHTML.substring(0, payloadIndex);
    rightSubString = payloadElement.innerHTML.substring(payloadIndex + payloadString.length);

    payloadElement.innerHTML = createHTML(leftSubstring + createColourCSS(payloadName, colour) + rightSubString);
    setData(colour);
}

/**
 * The selects a colour based on the provided process. This can be set to select
 * to generate a colour in any way. 
 * @param {string} selectionProcess The method in which a colour is selected
 * @param {Object} element The conversation DOM element that was selected
 * @returns {string} The hex colour
 */
function selectColour(selectionProcess, element){
    switch (selectionProcess) {
        // Selects a colour by finding the most common colour on the user's
        // avatar.
        case "from-avatar":
            canvas = element.querySelector('canvas').getContext('2d', { willReadFrequently : true });
            return brightenColour(`${getCanvasColours(canvas).colour}`, brighteningPercentage);
    
        default:
            console.warn("No selection process provided, using default colour")
            return defaultColour;
    }
}

/**
 * Sets the colour for the current conversation
 * @param {Object} element The DOM element of the conversation that was selected
 */
function setColours(element){
    try {
        updateBackgroundColour(selectColour(colourSelectionProcess, element));
    } catch (error) {
        
        callError("Could not create HTML");
        throw error
    }
    
    console.log("Injection Loaded!")
}

/**
 * Updates the current colour global variables
 * @param {string} colour The colour to update the global variables with
 */
function setData(colour){
    currentColour = colour;
    payloadString = createColourCSS(payloadName, colour);
}

/**
 * The initial call to to set the colour and attach event listeners on conversation
 * DOM elements to update the colour when selected
 */
function main(){
    setData(defaultColour);
    var colourSet = false;
    for (var element of document.querySelectorAll(listElementName)){
        element.addEventListener('click', function() {
            setColours(this)
        }, false);
        
        // Sets the initial colour to the active conversation
        if (!colourSet && element.firstChild.className === "list-item selected"){
            setColours(element);
            colourSet = true;
        }
        
    }

    // If no conversation is active, it is set to the first conversation
    if (!colourSet)
        setColours(document.querySelector(listElementName));
}

// Waits for the messages element to load before running main
waitForElement(messageElementName).then(() => main());