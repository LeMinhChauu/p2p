(function() {
    let senderID;
    const socket = io();

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

    document.getElementById("receiver-start-con-btn").addEventListener("click", function() {
        senderID = document.getElementById("join-id").value;
        if(senderID.length == 0) return;
        let joinID = generateID();
        
        socket.emit("receiver-join", {
            uid: joinID,
            sender_uid: senderID
        });
        document.getElementsByClassName("join-screen")[0].classList.remove("active");
        document.getElementsByClassName("fs-screen")[0].classList.add("active");
    });
    
    let fileShare = {};

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

        fileShare.progress_node = ele.getElementsByClassName("progress");

        socket.emit("fs-start", {
            uid: senderID
        });
    });

    socket.on("fs-share", function(buffer) {
        var confirm = true;
        if(confirm == true) {
            fileShare.buffer.push(buffer);
            fileShare.transmitted += buffer.byteLength;
            fileShare.progress_node.innerText = Math.trunc(fileShare.transmitted / fileShare.metadata.total_buffer_size * 100) + "%";

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