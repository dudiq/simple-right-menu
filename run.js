define(function (require) {

    $().ready(function () {
        var jqSimpleRightMenu = require("simple-right-menu");

        var rMenu = new jqSimpleRightMenu($("#menu"), [
            {title: "<script>alert(1);", visible: false, icon: "copy.png",
                nodes: [
                    {title: "test", id: "game"},
                    {title: "test323"},
                    {title: "childs", nodes: [
                        {title: "1"},
                        {title: "2"}
                    ]}
                ]},
            {separator: true, visible: false, }
            ,
            {visible: false, title: "test df asdf asf ad2"},
            {visible: false, title: "node3"}
        ]);
        var rMenu2 = new jqSimpleRightMenu($("#menu2"), [
            {title: "test", icon: "copy.png", nodes: [
                {title: "game", id: "game", func: function(){
                    console.log("game");
                }},
                {title: "test323"},
                {title: "childs", nodes: [
                    {title: "1"},
                    {title: "2"}
                ]}
            ]},
            {separator: true},
            {title: "test df asdf asf ad2"},
            {title: "node3"}
        ], {
            onBeforeShow: function(){
                console.log("onBeforeShow");
            }
        });

        $("#menu").mousedown(function (ev) {
            //console.dir({which: ev.which, button: ev.button});
        });
        $("#add").click(function () {
            var newId = rMenu.addNode("game", {title: "new node", enable: false});
            console.log("newId:" + newId);
            rMenu2.setItemIconSize(50);
        });
        $("#add").dblclick(function () {
            rMenu.addNode("game", {title: "new node0"}, 0);
        });

        var str = ".simple-right-menu-icon-{{w}} .simple-right-menu-item-icon {width: {{w}}px; height: {{w}}px;}\n";
        var tmp = "";
        for (var i = 0; i <= 100; i++) {
            tmp += str.split("{{w}}").join(i);
        }
        console.log(tmp);

    });

});