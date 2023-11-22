// display dialog with request infor
function openConfirm(request) {
    document.getElementById("confirm-dialog").style.display = "block";
    document.getElementById("who-sent").value = request.from;
    document.getElementById("req_for").innerHTML = "request for [" + request.fname + "]";
}

// create socket to receive request for connection
(function() {
    const socket = io();
    var email = document.getElementById("user-email");
    if(email) {
        email = email.innerHTML;
        socket.on("notification-to-" + email, (request) => {
            // console.log(request);
            openConfirm(request);
        });

        socket.emit("user", {
            "email": email
        });
    }
})();