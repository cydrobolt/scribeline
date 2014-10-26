// Make alerts create another div and slide that down, make it look nicer

function createAlert(title, content) {
    var alert = '<div class="alert alert-info alert-dismissible" style="text-align:left" role="alert">\
      <button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>\
      <strong>'+title+'</strong>'+content+'\
    </div>';
    $('#stA').hide();
    $('#stA').append(alert);  // Append to statusArea
    $('#stA').slideDown();
}
function createModal(title, content) {
    var modal = '\
      <!-- Button trigger modal -->\
      <!-- Call modal with $("#SLModal").modal(options) -->\
      <!-- Make each file have the data-dismiss="modal" attribute -->\
    <!-- Modal -->\
    <div class="modal fade" id="SLModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">\
      <div class="modal-dialog">\
        <div class="modal-content">\
          <div class="modal-header">\
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>\
            <h4 class="modal-title" id="myModalLabel">#{title}</h4>\
          </div>\
          <div class="modal-body">\
            #{body}\
          </div>\
          <div class="modal-footer">\
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\
          </div>\
        </div>\
      </div>\
    </div>\
    ';
    modal = modal.replace("#{title}", title);
    modal = modal.replace("#{body}", content);
    $('#stA').append(modal);
    $('#SLModal').modal();
    $( "body" ).delegate( "#SLModal", "hidden.bs.modal", function () {
		$('#SLModal').remove(); // Get rid of the modal so that users can see refreshed content
	});

    return modal;
}
