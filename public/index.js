function openConfirm(request_from) {
    document.getElementById("confirm-dialog").style.display = "block";
    document.getElementById("who-sent").value = request_from;
}

(function() {
    const socket = io();
    var email = document.getElementById("user-email");
    if(email) {
        email = email.innerHTML;
        socket.on("notification-to-" + email, (request_from) => {
            console.log(request_from);
            openConfirm(request_from);
        });
    }
})();