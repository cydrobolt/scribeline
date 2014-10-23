function createAlert(title, content) {
    var alert = '<div class="alert alert-info alert-dismissible" style="text-align:left" role="alert">\
      <button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>\
      <strong>'+title+'</strong>'+content+'\
    </div>';
    $('#stA').append(alert); // Append to statusArea
}
