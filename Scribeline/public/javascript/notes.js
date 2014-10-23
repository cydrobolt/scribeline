

function triggerAlert () {
    createAlert("Tip<br />", 'Welcome to Scribeline Editor! To add a layer, press Ctrl+Y.\
    To remove a layer, simply press Ctrl+U. Save as you go,\
    save as or open a new file to get started right away! <br/>\
    <b>Keybinds:</b>\
    <ul>\
    <li>Ctrl+B to reduce area size</li>\
    </ul> '); // Located at /javascript/alert.js

}

function insertTextAtCursor(text) {
    var sel, range, html;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode( document.createTextNode(text) );
        }
    } else if (document.selection && document.selection.createRange) {
        document.selection.createRange().text = text;
    }
}
var currLevel;
var height = 450;
var textHeight_s = 5; // Actual character height
var textHeight = textHeight_s + 5; // Approx line height
$('#area').css('font-size', textHeight_s+"px");
function chkMain() {
    console.log('chkMain called!');
    if (currLevel>0) {
        $('#area').append('</li><li>');
    }
    else {
        $("#area").append('<br />');
    }
    height += textHeight;
    $('#area').css('height', height+"px")
    cursorManager.setEndOfContenteditable($('#area'));

}
function addLevel() {
    insertHtmlAtCursor("<ul><li>");
    currLevel++;
    cursorManager.setEndOfContenteditable($('#area'));
}
function shortenField() {
    height -= textHeight;
    $('#area').css('height', height+"px");
    cursorManager.setEndOfContenteditable($('#area'));
}
function delLevel() {
    insertHtmlAtCursor("</ul>");
    currLevel--;
    cursorManager.setEndOfContenteditable($('#area'));

}
// Also requires jQuery and Bootstrap JS
