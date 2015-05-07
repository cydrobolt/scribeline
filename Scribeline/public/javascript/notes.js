/*

Scribeline Outline Editor
http://github.com/cydrobolt/scribeline

Copyright 2015 Chaoyi Zha

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

if (!Date.now) {
    // < IE8 Shim
    Date.now = function() { return new Date().getTime(); };
}


CKEDITOR.config.enterMode = CKEDITOR.ENTER_BR;
CKEDITOR.config.forcePasteAsPlainText = false; // default so content won't be manipulated on load
CKEDITOR.config.basicEntities = true;
CKEDITOR.config.entities = true;
CKEDITOR.config.entities_latin = false;
CKEDITOR.config.entities_greek = false;
CKEDITOR.config.entities_processNumerical = false;
CKEDITOR.config.fillEmptyBlocks = function (element) {
        return true; // leave like so
};

CKEDITOR.config.allowedContent = true; // don't filter my data

CKEDITOR.inline('area');


function setDocDate() {
    var language = window.navigator.userLanguage || window.navigator.language;
    var date = new Date();
    var options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };
    var formatted_date = date.toLocaleDateString(language, options);
    $('#iddate').html('<em><b>'+formatted_date+'</b></em><br /><br />');
    $('#iddate').removeAttr('id');
}
window.onload = function() { // Doing it the old fashioned non-jQuery way
    var autosave = window.setInterval(autoSaveArea, 60000); // Start autosaver, every min
    $('#area').on('focus', function () {
        setDocDate(); // Set date on focus
    });
};

function triggerAlert () {
    createAlert("<b>Tip</b><br /><br />", 'Welcome to the Scribeline Editor!<br />\
    Save as you type, or open a new file to get started right away! <br/>\
    Automatic saving will occur every minute. <br />\
    <b>You may use Ctrl+S to save</b>\
    </ul> ');

}
function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp*1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var day = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    // var time = date + ',' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    var time = month + ' ' + day + " " + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
}

function openDocModal() {
    // Open a modal allowing user to select a document
    var request = $.ajax({
        url: "/action-ep",
        type: "POST",
        data: {'action': "getUserDocs"},
        dataType: "html"
    });
    $("#open").html('<span><i class="fa fa-spinner fa-spin"></i>&nbsp;&nbsp; Opening Modal...</span>');
    request.done(function(msg) {

       $("#open").html('<i class="fa fa-folder">    Open</i>');
       var docObj = JSON.parse(msg); // Parse into object
       // msg is a Map of Mongoose's output
       delete docCompilation;
        var docCompilation = ""; // Init String
        var id, title, items, doc_date;
        items = 0;
        docCompilation += '<table class="table table-hover">\
        <thead><tr><th>Document Title</th><th>Last Modified</th><th>Delete</th></thead><tbody>';
        for (var variable in docObj) {
            id = docObj[variable]._id;
            title = docObj[variable].title;
            var unix_date = docObj[variable].timestamp;
            doc_date = timeConverter(unix_date);

            if(title === undefined) {
                continue;
            }
            items++;
            unesc_title = title;
            title = title.replace(/'/g, "\\'"); // escape quotes
            title = title.replace(/"/g, '\\x22');
            docCompilation += "<tr><td><a href='#' data-dismiss=\"modal\" id='"+id+"' onclick=\"openDoc('"+id+"', '"+title+"');\">"+unesc_title+"</a></td>"+"<td>"+doc_date+"</td>"+"<td><a href='#' class='btn btn-sm btn-warning' onclick=\"deleteDoc('"+id+"');\">Delete</a></tr>";
        }
        docCompilation += "</tbody></table>";
        if (items === 0) {
            docCompilation = "<p>You don't seem to have any documents. Why don't you create one?</p>";
        }
       createModal("Your Docs", docCompilation);

    });

    request.fail(function(jqXHR, textStatus) {
        createAlert('<i class="fa fa-ban"></i> Alert<br />', "Could not reach server. Try again later.");
        $("#open").html('<i class="fa fa-folder">    Open</i>');
    });
}
function openDoc(theID, theTitle) {

    var docToOpenID = theID;
    var docToOpenTitle = theTitle;

    var request = $.ajax({
        url: "/action-ep",
        type: "POST",
        data: {'action': "getDoc", "id": docToOpenID},
        dataType: "html"
    });
    $("#open").html('<span><i class="fa fa-spinner fa-spin"></i>&nbsp;&nbsp; Opening Document...</span>');
    request.done(function(msg) {
        if (msg != "ERROR") {
            // Update Area
            $('#dtitle').val(docToOpenTitle);
            currID = docToOpenID;
            $('#area').html(msg);
            $("#open").html('<i class="fa fa-folder">    Open</i>');

        }
        else {
            createAlert('Could not open document. Maybe it is not shared with you, or an error occured. Try again later.');
            $("#open").html('<i class="fa fa-folder">    Open</i>');

        }
    });

    request.fail(function(jqXHR, textStatus) {
        createAlert('<i class="fa fa-ban"></i> Alert</br >', "Could not reach server. Try again later.");
        $("#open").html('<i class="fa fa-folder">    Open</i>');
    });
}
function getPrecedingNodeCursor() {
    // Gets node preceding the cursor in #area
    var selection;
    if (window.getSelection){
        selection = window.getSelection();}
    else if (document.selection && document.selection.type != "Control"){
        selection = document.selection;}

    var anchor_node = selection.anchorNode; //current node on which cursor is positioned
    var previous_node = anchor_node.previousSibling;
    var next_node = anchor_node.nextSibling;
    return previous_node;
}

function chkMain() {
    try {
        if (currLevel>0) {
            cursorPasteHTML("</li><li id='chkmaincr'>");
        }
        else {
            cursorPasteHTML("<br />");
        }
    }
    catch (err) {
        console.log(err);
    }
    cursorManager.setEndOfContenteditable($('#area'));
}
function updateInDocTitle() {
    var docTitle = $('#dtitle').val();
    $('#idtitle').html("<h1>"+docTitle+"</h1><br />");
    console.log('Updating doc title.');
    return;
}

function saveArea() {
    // Saves text/outline
    var docTitle = $("#dtitle").val();
    var docContent = $("#area").html();
    var request = $.ajax({
        url: "/action-ep",
        type: "POST",
        data: {'action': "save", 'title': docTitle, 'content': docContent, 'id': currID},
        dataType: "html"
    });
    $("#save").html('<span><i class="fa fa-spinner fa-spin"></i>&nbsp;&nbsp; Saving...</span>');
    request.done(function(msg) {
       if(msg=='OK') {
           $("#save").html('<i class="fa fa-book">    Save</i>');
           stopAutoSave = false;
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
function deleteDoc(tdocID) {

    // Saves text/outline onto MongoDB
    // $.blockUI({ message: '<img src="/images/loading.gif" />' });
    $('#SLModal').modal('hide'); // Close modal
    $('#SLModal').on('hidden.bs.modal', function (e) {
        $('#SLModal').remove();
        var request = $.ajax({
            url: "/action-ep",
            type: "POST",
            data: {'action': "deleteUserDoc", 'id': tdocID},
            dataType: "html"
        });
        request.done(function(msg) {
           if(msg=='OK') {
                 openDocModal(); // recreate docModal
                 //$.unblockUI();
                 console.log('OK');
           }
           else {
               createAlert('<i class="fa fa-ban"></i> Alert</br >', "Could not delete. Perhaps you are not logged in or the document was not found.");
               //$.unblockUI();
               console.log('ERROR');
           }


        });

        request.fail(function(jqXHR, textStatus) {
            createAlert('<i class="fa fa-ban"></i> Alert</br >', "Could not reach server. Try again later.");
        });
    });
}
var autoSaveAlerted = false;
var stopAutoSave; // Stop autosaving if something is broken
function autoSaveArea() {
    if (stopAutoSave === true) {
        return; // Wait until a successful save before autosaving
        //          if an error occured
    }
    // Saves text/outline
    var docTitle = $("#dtitle").val();
    var docContent = $("#area").html();
    var request = $.ajax({
        url: "/action-ep",
        type: "POST",
        data: {'action': "save", 'title': docTitle, 'content': docContent, 'id': currID},
        dataType: "html"
    });
    $("#save").html('<span><i class="fa fa-spinner fa-spin"></i>&nbsp;&nbsp; Autosaving...</span>');
    request.done(function(msg) {
       if(msg=='OK') {
           $("#save").html('<i class="fa fa-book">    Save</i>');
           stopAutoSave = false; // Turn back on autosaving

       }
       else if(msg.toLowerCase().search("error")>0) {
           createAlert('<i class="fa fa-ban"></i> Alert</br >', msg);
           $("#save").html('<i class="fa fa-book">    Save</i>');
           autoSaveAlerted = true;
           stopAutoSave = true;
       }
       else {
           createAlert('<i class="fa fa-ban"></i> Alert</br >', "Generic unhandled error. Try again later. "+msg+" <br />Autosave <span style='color:red'>paused</span> until successful manual save.");
           $("#save").html('<i class="fa fa-book">    Save</i>');
           autoSaveAlerted = true;
           stopAutoSave = true;

       }
    });

    request.fail(function(jqXHR, textStatus) {
        createAlert('<i class="fa fa-ban"></i> Alert</br >', "Could not reach server. Try again later. Autosave <span style='color:red'>paused</span> until successful manual save.");
        $("#save").html('<i class="fa fa-book">    Save</i>');
        autoSaveAlerted = true;
        stopAutoSave = true;

    });
}

function newArea() {
    $('#dtitle').val("");
    $('#area').html('<div id="idtitle"></div>\
    <div id="iddate"></div>\
    <div id="HoC">Start typing here...</div>');
    setDocDate(); // set doc date
    currID = guid(); // new doc ID
    createAlert('', "New document created!");
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
