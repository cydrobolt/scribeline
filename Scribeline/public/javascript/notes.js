function triggerAlert () {
    createAlert("Tip<br />", 'Welcome to Scribeline Editor! To add a layer, press Ctrl+Y.\
    To remove a layer, simply press Ctrl+U. Save as you go,\
    save as or open a new file to get started right away! <br/>\
    <b>Keybinds:</b>\
    <ul>\
    <li>Ctrl+E to reduce area size</li>\
    <li>Ctrl+S to save</li>\
    <li>Ctrl+B to <b>bolden</b></li>\
    </ul> '); // Located at /javascript/alert.js

}

function getPrecedingNodeCursor() {
    // Gets node preceding the cursor in #area
    var selection
    if (window.getSelection){
        selection = window.getSelection();}
    else if (document.selection && document.selection.type != "Control"){
        selection = document.selection;}

    var anchor_node = selection.anchorNode; //current node on which cursor is positioned
    var previous_node = anchor_node.previousSibling;
    var next_node = anchor_node.nextSibling;
    return previous_node;
}

function getCurrLevel (item) {
    $(item).parents('ul').length; // $(item) might need to be replaced with item
}
var currLevel = 0; // WILL BE DEPRECATED IN FAVOR OF ANCHOR NODE AND PARENT COUNTER
var height = 450;
var textHeight_s = 5; // Actual character height
var currID = guid(); // Assume new doc, generate currID
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
function updateInDocTitle() {
    var docTitle = $('#dtitle').val();
    $('#idtitle').html("<h1>"+docTitle+"</h1><br /><br />");
    console.log('Updating doc title.')
    return;
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
function saveArea() {
    // Saves text/outline onto MongoDB
    var docTitle = $("#dtitle").val();
    var docContent = $("#area").html();
    var request = $.ajax({
        url: "/action-ep",
        type: "POST",
        data: {'action': "save", 'title': docTitle, 'content': docContent, 'id': currID},
        dataType: "html"
    });
    $("#save").html('<span><img src="/images/loading.gif" width="20px" height="20px">&nbsp;&nbsp; Saving...</span>');
    request.done(function(msg) {
       if(msg=='OK') {
           $("#save").html('<i class="fa fa-book">    Save</i>');
       }
       else if(msg.toLowerCase().search("error")>0) {
           createAlert('<i class="fa fa-ban"></i> Alert</br >', msg);
           $("#save").html('<i class="fa fa-book">    Save</i>');
       }
       else {
           createAlert('<i class="fa fa-ban"></i> Alert</br >', "Generic unhandled error. Try again later. "+msg);
           $("#save").html('<i class="fa fa-book">    Save</i>');

       }
    });

    request.fail(function(jqXHR, textStatus) {
        createAlert('<i class="fa fa-ban"></i> Alert</br >', "Could not reach server. Try again later.");
        $("#save").html('<i class="fa fa-book">    Save</i>');
    });
}
function createPrint() {
    var css = "@media print {\
                  body * {\
                    visibility: hidden;\
                }\
                  #section-to-print, #section-to-print * {\
                    visibility: visible;\
                }\
                  #section-to-print {\
                    position: absolute;\
                    left: 0;\
                    top: 0;\
                }\
            }";

    var htmlCSS = "<html><head><style>"+css+"</style></head><body>"+$('#area').html()+"</body></html>";
    // TODO: themes for printing and editing in general


}

// Also requires jQuery and Bootstrap JS
