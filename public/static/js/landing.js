$( document ).ready(function() {
    $("#email-send").on("click", function() {
	var email = $("#email-input").val();
	$(this).attr("disabled", true);
	$.ajax({
	    type: "POST",
	    url: "/email",
	    data: {"email": email},
	    success: function(data) {
		if (data.status != 200) {
		    $("#email-send").attr("disabled", false);
		    $("#submit-message").text(data.message);
		    $("#submit-message").fadeIn();
		} else {
		    $("#email-input-wrapper").fadeOut();
		    $("#submit-message").fadeOut();
		}
	    }
	});
    });
});
