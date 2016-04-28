var main = function (toDoObjects) {
    "use strict";

    var socket = io.connect();
    var toDos = {};
    var read = 0;
    var onload = true;

    console.log("SANITY CHECK");

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
        if (toDos.length != read) {
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

    function populate(element) {
        var $element = $(element);

        // create a click handler for this element
        $element.on("click", function () {
            var $content,
                $input,
                $button,
                i;

            $(".tabs a span").removeClass("active");
            $element.addClass("active");
            $("main .content").empty();

            // tab 1
            if ($element.parent().is(":nth-child(1)")) {
                $content = $("<ul>");
                for (i = toDos.length-1; i >= 0; i--) {
                    $content.append($("<li>").text(toDos[i]));
                }
                $("main .content").append($content);
            }

            // tab 2
            else if ($element.parent().is(":nth-child(2)")) {
                $content = $("<ul>");
                toDos.forEach(function (todo) {
                    $content.append($("<li>").text(todo));
                });

                $("main .content").append($content);
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

                    $("main .content").append($tagName);
                    $("main .content").append($content);
                });
            }

            // tab 4
            else if ($element.parent().is(":nth-child(4)")) {
                var $description = $("<input>").addClass("description"),
                    $inputLabel = $("<p>").text("Description: "),
                    $tagInput = $("<input>").addClass("tags"),
                    $tagLabel = $("<p>").text("Tags: "),
                    $submit = $("<span>").text("+");

                $submit.on("click", function () {
                    var description = $description.val(),
                        tags = $tagInput.val().split(","),
                        newToDo = {"description":description, "tags":tags};

                    // save to DB
                    socket.emit("post", newToDo);
                    console.log("POST!");
                    toDoObjects.push(newToDo);
                    ++read;

                    // update toDos
                    toDos = toDoObjects.map(function (toDo) {
                        return toDo.description;
                    });

                    // clear input
                    $description.val("");
                    $tagInput.val("");
                });

                $content = $("<div>").append($inputLabel)
                                     .append($description)
                                     .append($tagLabel)
                                     .append($tagInput)
                                     .append($submit);

                $("main .content").append($content);
            }

            return false;
        });
    };

    $(".tabs a span").toArray().forEach(function (element) {
        populate(element);
    });

    $(".tabs a:first-child span").trigger("click");
};

$(document).ready(function () {
    var toDoObjects = [ {} ];
    main(toDoObjects);
});
