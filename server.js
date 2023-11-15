const express = require("express");
const { request } = require("http");
const path = require("path");


const app = express();
const server = require("http").createServer(app);
app.set('view engine', 'ejs');

const io = require("socket.io")(server);

// app use
const bodyParser = require('body-parser');
app.use(express.static(path.join(__dirname + "/public")));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.urlencoded({ extended: true}));

io.on("connection", function (socket) {
    socket.on("sender-join", function(data) {
        socket.join(data.uid);
    });
    socket.on("receiver-join", function(data) {
        socket.join(data.uid);
        socket.in(data.sender_uid).emit("init", data.uid);
    });
    socket.on("file-meta", function(data) {
        socket.in(data.uid).emit("fs-meta", data.metadata);
    });
    socket.on("fs-start", function(data) {
        socket.in (data.uid).emit("fs-share", {});
    });
    socket.on("file-raw", function(data) {
        socket.in(data.uid).emit("fs-share", data.buffer);
    });
});

// connect database
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;
var dbName = "file-sharing";
var database = null;

// verify log in
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

server.listen(5000, function() {
    console.log("Server start at 127.0.0.1:5000");

    MongoClient.connect("mongodb://127.0.0.1:27017")
    .then((client) => {
        database = client.db(dbName);
        console.log("Database connected.");

        app.get("/", (request, response) => {
            response.render("index", {
                "request": request
            });
        });

        app.get("/login", (request, response) => {
            response.render("login", {
                "request": request
            });
        });
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
                response.redirect("login");
            }
        });

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
        app.post("/search", async (request, response) => {
            if(request.isLogin) {
                const search_list = await database.collection("user").find({
                    "status": true
                    // request.body.search
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
                    "result": result
                });
            }
            else {
                response.render("login");
            }
        });
    })
    .catch((err) => {
        console.log(err);
    });
});