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

    $("#tab1").show();
    $("#tab2").hide();
    $("#tab3").hide();
    $("#tab4").hide();

    function populate(element) {
        var $element = $(element);

        // create a click handler for this element
        $element.on("click", function () {
            var $content,
                i;

            $(".tabs a span").removeClass("active");
            $element.addClass("active");
            //$("main .content").empty();

            // tab 1
            if ($element.parent().is(":nth-child(1)")) {
                $("#tab1").show();
                $("#tab2").hide();
                $("#tab3").hide();
                $("#tab4").hide();
                /*$content = $("<ul>");
                for (i = toDos.length-1; i >= 0; i--) {
                    $content.append($("<li>").text(toDos[i]));
                }
                $("main .content").append($content);*/
            }

            // tab 2
            else if ($element.parent().is(":nth-child(2)")) {
                $content = $("<ul>");
                toDos.forEach(function (todo) {
                    $content.append($("<li>").text(todo));
                });

                $("#tab2").show();
                $("#tab1").hide();
                $("#tab3").hide();
                $("#tab4").hide();
            }

            // tab 3
            else if ($element.parent().is(":nth-child(3)")) {
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

                $("#tab3").show();
                $("#tab1").hide();
                $("#tab2").hide();
                $("#tab4").hide();
            }

            // tab 4
            else if ($element.parent().is(":nth-child(4)")) {
                $("#tab4").show();
                $("#tab1").hide();
                $("#tab2").hide();
                $("#tab3").hide();
            }

            return false;
        });
    }

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

        $(".tabs a span").toArray().forEach(function (element) {
            populate(element);
        });

        $(".tabs .active").trigger("click");

        onload = false;
    });

    $(".tabs a span").toArray().forEach(function (element) {
        populate(element);
    });

    $(".tabs a:first-child span").trigger("click");

    function TaskList(data) {
       var self = this;
       self.listitem = ko.observable(data.description);
       self.tagitem = ko.observable(data.tags);
    }

    function TaskListViewModel() {
        var self = this;
        self.toDoObjects = ko.observableArray([]);
        self.description = ko.observable();
        self.tags = ko.observable();

        self.addTask = function() {

            // save to DB
            socket.emit("post", newToDo);
            console.log("POST!");
            self.toDoObjects.push(new TaskList(self.description(), self.tags()));
            self.description("");
            self.tags("");
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
