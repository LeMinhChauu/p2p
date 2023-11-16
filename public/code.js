// window.onload = (event) => {
    (function() {
        let receiverID;
        const socket = io();
        let joinID;

        // const getData = async function() {
        //     const response = await fetch("/sender_data");
        //     const text = response.text();
        //     text.then(data => {
        //         console.log(data);
        //         joinID = data;
        //     }).catch(e => {
        //         console.log(e);
        //     });
        // }
        
        // getData();

        // create ID for connection (depreciate)
        function generateID() {
            var s1 = ``;
            var s2 = ``;
            var s3 = ``;
            while(s1.length !== 3) s1 = `${Math.trunc(Math.random()*999)}`;
            while(s2.length !== 3) s2 = `${Math.trunc(Math.random()*999)}`;
            while(s3.length !== 3) s3 = `${Math.trunc(Math.random()*999)}`;
            return `${s1}-${s2}-${s3}`;
        }

        // copy sender ID
        document.getElementById("cpy").addEventListener("click", function() {
            var txt = document.getElementById("join-id").innerHTML;
            navigator.clipboard.writeText(txt);
        });

        // document.getElementById("sender-start-con-btn").addEventListener("click", function() {
            // joinID = generateID();
            joinID = document.getElementById("user-email-input").value;
            // console.log(joinID);
            document.getElementById("join-id").innerHTML = joinID;
            
            // create socket for send file with user email
            socket.emit("sender-join", {
                uid: joinID
            });

            // create connection between client
            socket.on("init", function(uid) {
                receiverID = uid;
                document.getElementsByClassName("join-screen")[0].classList.remove("active");
                document.getElementsByClassName("fs-screen")[0].classList.add("active");
                document.getElementsByClassName("waiting-screen")[0].style.display = "none";
            });

            // get file for trans
            document.getElementById("file-input").addEventListener("change", function(e) {
                let file = e.target.files[0];
                if(!file) return;
                let reader = new FileReader();
                reader.onload = function(e) {
                    let buffer = new Uint8Array(reader.result);
                    let ele = document.createElement("div");
                    ele.classList.add("item");
                    ele.innerHTML = `
                        <div class="filename">${file.name}</div>
                        <div class="progress">0%</div>
                    `;
                    document.getElementsByClassName("file-list")[0].appendChild(ele);
                    shareFile({
                        filename: file.name,
                        total_buffer_size: buffer.length,
                        buffer_size: 1024
                    }, buffer, ele.getElementsByClassName("progress")[0]);
                }
                reader.readAsArrayBuffer(file);
            });
            // transmit file
            function shareFile(metadata, buffer, progress_node) {
                socket.emit("file-meta", {
                    uid: receiverID,
                    metadata: metadata
                });
                socket.on("fs-share", function() {
                    let chunk = buffer.slice(0, metadata.buffer_size);
                    buffer = buffer.slice(metadata.buffer_size, buffer.length);
                    progress_node.innerText = Math.trunc((metadata.total_buffer_size - buffer.length) / metadata.total_buffer_size * 100) + "%";
                    if(chunk.length != 0) {
                        socket.emit("file-raw", {
                            uid: receiverID,
                            buffer: chunk
                        });
                    }
                });
            }
        // });
    })();
// }