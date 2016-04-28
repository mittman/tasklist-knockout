// Server-side code
/* jshint node: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, undef: true, unused: true, strict: true, trailing: true */

"use strict";

// Config
var httpPort = 3000;
var mongoPort = 27017;

// Depends
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var io = require("socket.io");

// Initialize
var app = express();
app.use(express.static(__dirname + "/client"));
app.use(bodyParser.json());
var server = null;
var database = false;

// Data
var hostname = "localhost";
var db = "amazeriffic";
var url = "mongodb://" + hostname + ":" + mongoPort + "/" + db;

// This is our mongoose model for todos
var ToDoSchema = mongoose.Schema({
    description: String,
    tags: [ String ]
});
var ToDo = mongoose.model("ToDo", ToDoSchema);

// Functions
function startServer() {
    var http = app.listen(httpPort, function(err) {
        if (!err) {
            console.log("==> Starting express server on port", httpPort);
        }
        else if (err.errno === "EADDRINUSE") {
            console.log("==> Port", httpPort, "busy. Unable to start express server");
            console.log("==> To debug: $ lsof -i :" + httpPort);
        }
        else {
            console.log(err);
        }
    });

    return io.listen(http);
}

function connectDB() {
    // connect to the amazeriffic data store in mongo
    mongoose.connect(url, function(err) {
        if(!err) {
            console.log("==> Connected to MongoDB Server on port", mongoPort);
            return true;
        }
    });

    return false;
}

function refreshToDo(socket) {
    socket.on("get", function () {
        console.log("==> GET!");
        ToDo.find({}, function(err, result) {
            if (!err) {
                console.log("todo", result);
                socket.emit("todo", result);
            }
            else {
                console.log("damn it rocket", err);
            }
        });
    });
}

function modifyToDo(socket) {
    socket.on("post", function (data) {
        console.log("==> POST!");
        console.log(data);
        var newToDo = new ToDo({"description":data.description, "tags":data.tags});
        newToDo.save(function (err, result) {
            if (err !== null) {
                // the element did not get saved!
                console.log(err, result);
                console.log("ERROR in POST");
            } else {
                // our client expects *all* of the todo items to be returned, so we'll do
                // an additional request to maintain compatibility
                ToDo.find({}, function (err, result) {
                    if (err !== null) {
                        // the element did not get saved!
                        console.log("ERROR in FIND");
                    }
                    // debugging
                    console.log("Result", result);
                });
            }
        });
    });
}

function userCount(socket) {
    var users = server.engine.clientsCount;
    // debugging
    //console.log("total:", users);

    // echo to client
    socket.emit("usercount", users);
    // echo globally (all clients)
    socket.broadcast.emit("usercount", users);
}

// Run server
server = startServer();
// Connect MongoDB
database = connectDB();

// Clients connect via Socket.IO
server.sockets.on("connection", function(socket) {
    console.log("Connected: %s", socket.id);
    socket.on("adduser", function() {
        userCount(socket);
    });

    socket.on("disconnect", function() {
        console.log("User Disconnected");
        userCount(socket);
    });

    // To-Do actions
    refreshToDo(socket);
    modifyToDo(socket);
});
