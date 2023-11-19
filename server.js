const express = require("express");
const { request } = require("http");
const path = require("path");

// create express server
const app = express();
const server = require("http").createServer(app);
app.set('view engine', 'ejs');

// create socket
const io = require("socket.io")(server);

// app use
const bodyParser = require('body-parser');
app.use(express.static(path.join(__dirname + "/public")));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.urlencoded({ extended: true}));

// socket function
io.on("connection", function (socket) {

    // create and join room
    socket.on("sender-join", function(data) {
        socket.join(data.uid);
    });
    socket.on("receiver-join", function(data) {
        socket.join(data.uid);
        socket.in(data.sender_uid).emit("init", data.uid);
    });

    // file management
    socket.on("file-meta", function(data) {
        socket.in(data.uid).emit("fs-meta", data.metadata);
    });
    socket.on("fs-start", function(data) {
        socket.in(data.uid).emit("fs-share", {});
    });
    socket.on("file-raw", function(data) {
        socket.in(data.uid).emit("fs-share", data.buffer);
    });

    // inform to client
    socket.on("send-con-req", function(data) {
        io.emit("notification-to-" + data.request_to, {
            from: data.request_from,
            fname: data.fname
        });
    });
    socket.on("send-con-reply", function(data) {
        io.emit("reply-to-" + data.request_from, data.request_to);
    });
});

// database
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;
var dbName = "file-sharing";
var database = null;

// session for log in
var session = require("express-session");
const { setEngine } = require("crypto");
app.use(session({
    secret: "secret key",
    resave: false,
    saveUninitialized: false,
}));

app.use(function(request, response, next) {
    // request.mainURL = mainURL;
    request.isLogin = (typeof request.session.user !== "undefined");
    request.user = request.session.user;

    next();
});

// start server port 5000
server.listen(5000, function() {
    console.log("Server start at 127.0.0.1:5000");

    MongoClient.connect("mongodb://127.0.0.1:27017")
    .then((client) => {

        // connect database
        database = client.db(dbName);
        console.log("Database connected.\n");

        // render home page
        app.get("/", (request, response) => {
            response.render("index", {
                "request": request
            });
        });

        // render log in page
        app.get("/login", (request, response) => {
            response.render("login", {
                "request": request
            });
        });
        // process log in infor
        app.post("/login", async function(request, response) {
            var isSignup = await database.collection("user").findOne({
                "email": request.body.email
            });
            if(isSignup === null) {
                response.render("log-in", {
                    "request": request
                });
            }
            else {
                const result = await database.collection("user").updateOne({
                    email: isSignup.email
                }, {
                    $set: {
                        status: true
                    }
                });
                request.session.user = isSignup;
                response.redirect("/");
            }
        });

        // log out
        app.get("/logout", async (request, response) => {
            if(request.isLogin) {
                const result = await database.collection("user").updateOne({
                    email: request.user.email
                }, {
                    $set: {
                        status: false
                    }
                });
                request.session.destroy();
                response.redirect("login");
            }
            else {
                response.redirect("/login");
            }
        });

        // render sender page
        app.get("/sender", (request, response) => {
            if(request.isLogin) {
                response.render("sender", {
                    "request": request
                });
            }
            else {
                response.redirect("/login");
            }
        });
        // app.get("/sender_data", (request, response) => {
        //     response.send("chau.leminhchau59@hcmut.edu.vn");
        // });

        // render receiver page
        app.get("/receiver", (request, response) => {
            if(request.isLogin) {
                    response.render("receiver", {
                    "request": request
                });
            }
            else {
                response.redirect("/login");
            }
        });
        // process search file
        app.post("/search", async (request, response) => {
            if(request.isLogin) {
                const search_list = await database.collection("user").find({
                    "status": true
                });
                var result = {res: []};
                for await (const online_user of search_list) {
                    if(online_user.files.indexOf(request.body.search) > -1) {
                        if(online_user.email != request.user.email) {
                            result.res.push(online_user);
                        }
                    }
                }
                response.render("search", {
                    "result": result,
                    "request": request
                });
            }
            else {
                response.redirect("/login");
            }
        });

        // render upload page
        app.get("/upload", async (request, response) => {
            if(request.isLogin) {
                var getdata = await database.collection("user").findOne({
                    "email": request.user.email
                });
                request.session.user = getdata;
                response.render("upload", {
                    "request": request
                });
            }
            else {
                response.redirect("/login");
            }
        });
        // process upload page
        app.post("/upload", async (request, response) => {
            if(request.isLogin) {
                var result = await database.collection("user").updateOne({
                    email: request.user.email
                }, {
                    $push: {
                        files: request.body.name
                    }
                });
                var check = await database.collection("user").findOne({
                    "email": request.user.email
                });
                request.session.user = check;
                response.redirect("/upload");
            }
            else {
                response.redirect("/login");
            }
        });
        // delete file
        app.post("/delete", async (request, response) => {
            if(request.isLogin) {
                var result = await database.collection("user").updateOne({
                    email: request.user.email
                }, {
                    $pull: {
                        files: request.body.filename
                    }
                });
                var user = await database.collection("user").findOne({
                    "email": request.user.email
                });
                request.session.user = user
                response.redirect("/upload");
            }
            else {
                response.redirect("/login");
            }
        });

        // process reply connection request
        app.post("/process_request", (request, response) => {
            if(request.body.reply_con_req == "refuse") {
                response.redirect(request.body.url);
            }
            else {
                response.render("sender", {
                    "request": request
                });
            }
            // send reply to user sent request
            io.emit("reply-to-" + request.body.request_from, request.body.reply_con_req);
        });
    })
    .catch((err) => {
        console.log(err);
    });
});