# Google's Messages for Web: Coloured Messages Injection
### **Creator:** Joshua Neizer

## Overview
This is a simple Javascript program that allows the Google's Messages for Web
to have coloured outgoing SMS messages.

Within the program you can tune parameters such as:
- The opacity of messages
- How the intensity of the colour brightening
- Turning gradient messages on or off
- The intensity of the gradient
- The colour selection function.

You can use any colour selection process you would like, you will just need to update
the `selectColour` function within the program and update the `colourSelectionProcess`
constant to match the correct case.

Currently, colours are selected based on the most frequent colour in the contact's
avatar photo. The `--xms-outgoing-bg-color` CSS variable is then updated to with the new colour.

Ensure to update the `messagesTheme` constant to the match the current theme of messages

Feel free to use and edit the code, and raise any issues if any bugs are spotted.

<br/>

## Deploy
To deploy the injection, just copy and paste the program in the the browser's console
for the Google's Messages for Web window.

The code was developed and tested on Google Chrome, so results may vary for other
web browsers.