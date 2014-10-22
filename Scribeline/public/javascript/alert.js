function createAlert(title, content) {
    var alert = '<div class="alert alert-warning alert-dismissible" role="alert">
      <button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
      <strong>'+title+'</strong>'+content+'
    </div>';
    return alert;
}
