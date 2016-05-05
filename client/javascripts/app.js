// Client-side code
/* jshint browser: true, jquery: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, undef: true, unused: true, strict: true, trailing: true */
/* global ko: true, io: true, console: true */

var main = function () {
    "use strict";

    var socket = io.connect();

    var toDoObjects = [ {} ];
    var toDos = {};
    var read = 0;
    var onload = true;

    console.log("SANITY CHECK");

    function switchtab(active, inactive) {
        $("#title" + active).addClass("active");
        $("#tab" + active).show();

        for (var i = 0; i < inactive.length; ++i) {
            $("#title" + inactive[i]).removeClass("active");
            $("#tab" + inactive[i]).hide();
        }
    }

    switchtab(1, [2,3,4]);


            /*
                var tags = [];

                toDoObjects.forEach(function (toDo) {
                    toDo.tags.forEach(function (tag) {
                        if (tags.indexOf(tag) === -1) {
                            tags.push(tag);
                        }
                    });
                });
                console.log(tags);

                var tagObjects = tags.map(function (tag) {
                    var toDosWithTag = [];

                    toDoObjects.forEach(function (toDo) {
                        if (toDo.tags.indexOf(tag) !== -1) {
                            toDosWithTag.push(toDo.description);
                        }
                    });

                    return { "name": tag, "toDos": toDosWithTag };
                });

                tagObjects.forEach(function (tag) {
                    var $tagName = $("<h3>").text(tag.name),
                        $content = $("<ul>");


                    tag.toDos.forEach(function (description) {
                        var $li = $("<li>").text(description);
                        $content.append($li);
                    });

                });
                */



    socket.on("connect", function() {
        socket.emit("adduser");
        socket.emit("get");
    });

    socket.on("usercount", function(data) {
        console.log("clients", data);
        $(".users").html("<span>Users connected: " + data + "</span>");
    });

    socket.on("todo", function(data) {
        toDoObjects = data;

        toDos = toDoObjects.map(function (toDo) {
            // debugging
            //console.log("desc", toDo.description);

            if (onload) {
                //console.log("onload", read);
                ++read;
            }

            return toDo.description;
        });

        console.log("compare", toDos.length + ":" + read);
        if (toDos.length !== read) {
            var newItems = toDos.length - read;
            $(".alerts").html("<span>" + newItems + " new alert(s)!<i class='fa fa-bell-o fa-2x'></i></span>");
        }
        else {
            $(".alerts").empty();
        }

        onload = false;
    });

    function TaskList(data) {
        var self = this;
        console.log("data", data);
        self.listitem = ko.observable(data.description);
    }

    function TaskListViewModel() {
        var self = this;

        self.toDoObjects = ko.observableArray([]);
        self.description = ko.observable();
        self.taglist = ko.observableArray([]);
        self.tag = ko.observable();
        self.tagname = ko.observable();

        self.newest = function() {
            switchtab(1, [2,3,4]);
        };

        self.oldest = function() {
            switchtab(2, [1,3,4]);
        };

        self.tags = function() {
            switchtab(3, [2,1,4]);
        };

        self.add = function() {
            switchtab(4, [3,2,1]);
        };

        self.addTask = function() {

            var newToDo = {"description": self.description(), "tags": self.tag()};

            // save to DB
            socket.emit("post", newToDo);
            console.log("POST!");
            self.toDoObjects.push(new TaskList(newToDo));
            self.description("");
            self.tag("");
            ++read;

            // update toDos
            toDos = toDoObjects.map(function (toDo) {
                return toDo.description;
            });
        };
    }

    ko.applyBindings(new TaskListViewModel());
};

$(document).ready(main);
