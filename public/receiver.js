// get user for request file
async function getUser(who) {
    const user = await fetch("/getuser", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify({
            who: who
        })
    }).then((res) => {
        res.json().then((data) => {
            return data;
        });
    }).catch((e) => {
        console.log(e);
    });
}

(function() {
    let senderID;
    let joinID;
    const socket = io();
    let reply = false;

    // generate ID (depreciate)
    function generateID() {
        var s1 = ``;
        var s2 = ``;
        var s3 = ``;
        while(s1.length !== 3) s1 = `${Math.trunc(Math.random()*999)}`;
        while(s2.length !== 3) s2 = `${Math.trunc(Math.random()*999)}`;
        while(s3.length !== 3) s3 = `${Math.trunc(Math.random()*999)}`;
        return `${s1}-${s2}-${s3}`;
    }

    
    // paste sender ID
    document.getElementById("paste").addEventListener("click", async function() {
        document.getElementById("join-id").value = await navigator.clipboard.readText();
    });

    // close inform dialog
    document.getElementById("close").addEventListener("click", (e) => {
        document.getElementById("information-dialog").style.display = "none";
        startConnect(reply);
    });
    
    // send connection request
    document.getElementById("receiver-start-con-btn").addEventListener("click", async function() {
        senderID = document.getElementById("join-id").value;
        // joinID = document.getElementById("user-email").innerHTML;
        if(senderID.length == 0) return;

        // const user = await fetch("/getuser", {
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/json;charset=utf-8"
        //     },
        //     body: JSON.stringify({
        //         who: senderID
        //     })
        // }).then((res) => {
        //     res.json().then((data) => {
        //         if(data.status) {
        //             joinID = document.getElementById("user-email").innerHTML;
        //             var fname = document.getElementById("filename").value;
            
        //             // emit request to server
        //             socket.emit("send-con-req", {
        //                 request_from: joinID,
        //                 request_to: senderID,
        //                 fname: fname
        //             });
            
        //             document.getElementById("reply-mess").innerHTML = "Request sent";
        //             document.getElementById("information-dialog").style.display = "block";
                    
        //             // get server reply for connection request
        //             socket.on("reply-to-" + joinID, (response) => {
        //                 if(response == "accept") {
        //                     console.log("OK")
        //                     document.getElementById("reply-mess").innerHTML = "Access accepted";
        //                     document.getElementById("information-dialog").style.display = "block";
        //                     reply = true;
        //                 }
        //                 else {
        //                     document.getElementById("reply-mess").innerHTML = "Access refused";
        //                     document.getElementById("information-dialog").style.display = "block";
        //                     console.log("NO");
        //                     reply = false;
        //                 }
        //             });
        //         }
        //         else {
        //             setTimeout(() => {
        //                 document.getElementById("reply-mess").innerHTML = "User may not online!";
        //                 document.getElementById("information-dialog").style.display = "block";
        //                 console.log("NO");
        //                 reply = false;
        //             }, 1000);
        //         }
        //     });
        // }).catch((e) => {
        //     console.log(e);
        // });

        joinID = document.getElementById("user-email").innerHTML;
        var fname = document.getElementById("filename").value;

        // emit request to server
        socket.emit("send-con-req", {
            request_from: joinID,
            request_to: senderID,
            fname: fname
        });

        document.getElementById("reply-mess").innerHTML = "Request sent";
        document.getElementById("information-dialog").style.display = "block";
        
        // get server reply for connection request
        socket.on("reply-to-" + joinID, (response) => {
            if(response == "accept") {
                console.log("OK")
                document.getElementById("reply-mess").innerHTML = "Access accepted";
                document.getElementById("information-dialog").style.display = "block";
                reply = true;
            }
            else if(response == "refuse") {
                document.getElementById("reply-mess").innerHTML = "Access refused";
                document.getElementById("information-dialog").style.display = "block";
                console.log("NO");
                reply = false;
            }
            else {
                setTimeout(() => {
                    document.getElementById("reply-mess").innerHTML = "User has disconnected";
                    document.getElementById("information-dialog").style.display = "block";
                    console.log("NO");
                    reply = false;
                }, 3000);
            }
        });
    });

    // start connect
    const startConnect = function(res) {
        if(res) {
            socket.emit("receiver-join", {
                uid: joinID,
                sender_uid: senderID
            });
            document.getElementsByClassName("join-screen")[0].classList.remove("active");
            document.getElementsByClassName("fs-screen")[0].classList.add("active");
        }
    }
    
    let fileShare = {};

    // file transmition progress
    socket.on("fs-meta", function(metadata) {
        fileShare.metadata = metadata;
        fileShare.transmitted = 0;
        fileShare.buffer = [];

        let ele = document.createElement("div");
        ele.classList.add("item");
        ele.innerHTML = `
            <div class="filename">${metadata.filename}</div>
            <div class="progress">0%</div>
        `;
        document.getElementsByClassName("file-list")[0].appendChild(ele);

        fileShare.progress_node = ele.getElementsByClassName("progress")[0];

        socket.emit("fs-start", {
            uid: senderID
        });
    });

    // socket stage share file
    socket.on("fs-share", function(buffer) {
        var confirm = true;
        if(confirm == true) {
            fileShare.buffer.push(buffer);
            fileShare.transmitted += buffer.byteLength;
            fileShare.progress_node.innerText = Math.trunc(fileShare.transmitted / fileShare.metadata.total_buffer_size * 100) + "%";

            // download if file transmited successfully
            if(fileShare.transmitted == fileShare.metadata.total_buffer_size) {
                download(new Blob(fileShare.buffer), fileShare.metadata.filename);
                fileShare = {};
            }
            else {
                socket.emit("fs-start", {
                    uid: senderID
                });
            }
        }
    });
})();