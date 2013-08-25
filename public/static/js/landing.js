$( document ).ready(function() {
    $("#email-send").click(function() {
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
		    $("#submit-message").fadeOut();
		    $("#tagline").fadeOut(400, function() {
			$(this).text("brandon@adcrafted.com").fadeIn(400);
		    });
		    $("#email-input-wrapper").fadeOut(400, function() {
			$("#thank-you").fadeIn(10, function() {
			    $("#thank-you").fadeOut(3000);
			});
		    });
		}
	    }
	});
    });
    $("#email-input").focus(function() {
	$("#submit-message").fadeOut();
    });
    $("#email-input").keyup(function(event) {
        if (event.keyCode != 13) {
	    $("#submit-message").fadeOut();
        } else {
	    $("#email-send").click();
	}
    });
});
