/**
* jQuery Simple Right Menu
* https://github.com/dudiq/simple-right-menu
*
* @version: 0.2 - 2013.03.22
* @author: dudiq
* @licence: MIT http://www.opensource.org/licenses/mit-license.php
*
* if you don't what to use define method(was added for requirejs), just override it by closure, and defined variable in window. that's all.
*
**/
define(function (require) {

    var safeTextBuff = $("<div/>");

    function getEscapedText(text){
        text = text || "";
        return safeTextBuff.text(text).html();
    }

    function setLeaveState(){
        this._dropCloseTimeout();
        var timeInt = this._opt['leaveInterval'];
        if (timeInt){
            var self = this;
            var timeId = setTimeout(function(){
                if (self._div){
                    //check for immedially destroy, before items are not hidden
                    self._onMenuClose();
                }
            }, timeInt);
            this._objectEnv["timeIdLeave"] = timeId;
        }
    }


    function jqSimpleRightMenu(div, data, opt) {
        var rMenu = {
            _data: null,
            _div: null, //render container
            _nodesMap: null, // map of nodes by ID of node
            _plugins: null,
            _contextDiv: null,
            _objectEnv: null, //enviropment for tree, (selected node id for example, etc...)
            _id: null,
            _init: function(div, data, opt) {
                var self = this;
                this._id = this._generateUniqueId();
                this._div = $("<table class='simple-right-menu' id='"+ this._id +"' tabIndex='-1'>").attr("unselectable", "on");
                this._contextDiv = div;
                this._objectEnv = {};
                this._opt = opt || {};
                (!this._opt['leaveInterval']) && (this._opt['leaveInterval'] = 0);
                this._dropData();
                this.setData(data);
                this._bindEvents();
            },
            id: function(){return this._id;},
            setData: function(data) {
                data = (jQuery.extend(true, {}, {val: data})).val;
                this._setData(data);
            },
            _setData: function(data){
                if (data != undefined) {
                    this.clear();
                    var sendData = {id: this._generateUniqueId(), nodes: data};
                    if (this._addNewNode(undefined, data, this._div)){
                        this._data = data;
                    }
                }
            },
            getData: function(){
                return (jQuery.extend(true, {}, {val: this._data})).val;
            },
            clear: function(){
                this._div.empty();
                this._dropData();
            },
            width: function(){
                return this._div.width();
            },
            height: function(){
                return this._div.height();
            },
            _log: function(msg){
                if (console)
                    console.log(msg);
            },
            _error: function(msg){
                if (console)
                    console.error(msg);
            },
            _dropData: function(){
                this._dropCloseTimeout();
                this._objectEnv = {}; this._nodesMap = {}; this._data = {};
            },
            setItemIcon: function(id, iconUrl){
                var map = this._getNodesMap(id);
                if (map){
                    var icon = map.divs.children(":not(:last)").find(".simple-right-menu-item-icon");
                    if (icon.length > 0 && (icon[0].tagName).toLowerCase() == "span"){
                        var classAttr = icon.attr("class"), styleAttr = icon.attr("style");
                        var newIcon = $("<img class='" + classAttr + "' style='"+ styleAttr +"'>");
                        icon.replaceWith(newIcon);
                        icon = newIcon;
                    }
                    icon.attr("src", iconUrl);
                }
            },
            setItemIconSize: function(size){
                size = parseInt(size, 10);
                if (!isNaN(size)){
                    var div = this._div;

                    div.addClass("simple-right-menu-icon-" + size);
                    div.removeClass("simple-right-menu-icon-" + this._div.data("iconSize"));
                    div.data("iconSize", size);
                }
            },
            _onMenuClose: function(){
                var self = this;
                this._div.fadeOut(100, function(){
                    //close all open nodes
                    var map = self._nodesMap;
                    for (var i in map){
                        if (map[i].nodesContainer){
                            map[i].nodesContainer.hide();
                        }
                    }
                    $(self).trigger(jqSimpleRightMenu.onClose);
                });
            },
            _dropCloseTimeout: function(){
                clearTimeout(this._objectEnv["timeIdLeave"]);
            },
            _addNewNode: function(parentId, data, buff, pos){
                var tmpDiv = $("<div>"); tmpDiv.data("id", parentId);
                var nodesMap = this._nodesMap,
                    canAdd = true,
                    self = this;
                this._traverseNodes(data, function(node, pdiv) {
                    //create node and return $("<ul>") element if node has children
                    var ul;
                    node.id = (node.id == undefined) ? self._generateUniqueId(nodesMap) : node.id;
                    if (nodesMap[node.id] != undefined){
                        self._error("Error :: Detects duplicate ID in data");
                        canAdd = false;
                        return false;
                    } else {
                        var isEnable = (node.enable === false) ? "simple-right-menu-item-disable " : "",
                            isFolder = (node.nodes != undefined),
                            hasChild = (isFolder && node.nodes.length > 0),
                            title = (node.safeTitle !== false) ? getEscapedText(node.title || "")  : (node.title || ""),
                            iconStyle = (node.icon) ? "simple-right-menu-icon-" + node.icon : "",
                            itemDiv = (node.separator) ? $("<tr class='simple-right-menu-item-separator'><td colspan='3'></td></tr>") :
                                    $("<tr class='"+ isEnable +"simple-right-menu-item "+((isFolder) ? "simple-right-menu-folder" : "simple-right-menu-child") +"'>" +
                                    "<td>" + "<span class='simple-right-menu-item-icon "+ iconStyle +"'>&nbsp;</span>" + "</td>"+
                                    "<td><span class='simple-right-menu-title'>" + title + "</span></td>"+
                                    "<td><span class='simple-right-menu-expand "+((hasChild) ? "simple-right-menu-has-child" : "" )+ "'>&nbsp;</span></td></tr>");
                        ul = (isFolder) ? self._getNewContainerEl(node.id) : undefined;
                        (ul) ? ul.hide() : null;
                        (node.visible === false) && (itemDiv.hide());
                        itemDiv.data({
                            "id": node.id
                        });
                        itemDiv.append($("<td>").append(ul));
                        node.userData = (node.userData == undefined) ? {} : node.userData;
                        nodesMap[node.id] = {node: node, divs: itemDiv, nodesContainer: ul, parentId: pdiv.data("id")};

                        pdiv.append(itemDiv);
                    }
                    return ul;
                }, tmpDiv);
                if (canAdd){
                    //self._openChildren(tmpDiv);
                    if (pos != undefined && pos != -1){
                        var sysStruct = (parentId == undefined) ? this._getFakeRootNode() : this._getNodesMap(parentId);
                        if (sysStruct.node.nodes.length > pos) {
                            var posNode = this._getNodesMap(sysStruct.node.nodes[pos].id);
                            posNode.divs.before(tmpDiv.children());
                        } else {
                            buff.append(tmpDiv.children());
                        }
                    } else{
                        buff.append(tmpDiv.children());
                    }
                }
                return canAdd;
            },
            _getNewContainerEl: function(id){
                //return html container for children
                return $("<table class='simple-right-menu-container' style='display:none;'>").data("id", id);
            },
            _generateUniqueId: function(map){
                function getGuid(){
                    var quidStr = "abcdefghijklmnopqrstuvwxyz0123456789-", quid = "w";
                    for (var i = 0, l = quidStr.length; i < l; i++) {
                        var pos = parseInt(l * Math.random());
                        quid += quidStr.charAt(pos);
                    }
                    return quid;
                }
                var uid;
                while ((map && map[uid]) || !uid) {
                    uid = getGuid();
                }
                return uid;
            },
            traverseNodes: function(node, callback){
                if (typeof node == "function"){
                    callback = node;
                    node = this._data
                }
                this._traverseNodes(node, callback);
            },
            _traverseNodes: function(node, callback, div) {
                var list = node['nodes'], pDiv;
                if ($.isArray(node)) {
                    list = node;
                    pDiv = div;
                } else {
                    pDiv = callback(node, div);
                }
                if (list != undefined && pDiv !== false) {
                    for (var i = 0, l = list.length; i < l; i++) {
                        this._traverseNodes(list[i], callback, pDiv);
                    }
                }
            },
            _traverseParents: function(nodeId, callback){
                var parent = this.getParentNode(nodeId);
                if (parent != undefined && callback(parent) != false){
                    this._traverseParents(parent['id'], callback);
                }
            },
            _getNodesMap: function(id){
                return this._nodesMap[id];
            },
            _getFakeRootNode: function(){
                var ret;
                if (!$.isArray(this._data)){
                    ret = this._getNodesMap(this._data.id);
                } else {
                    ret = {node: {nodes: this._data}, divs: $("<tr>"), nodesContainer: this._div, parentId: undefined};
                }
                return ret;
            },
            addNode: function(parentId, newData, pos){//data = {title: "node", id: "", nodes: [etc...]}
                //for newData == array, ignored pos argument :todo see pos when add new array of items
                if (typeof parentId != "string") {
                    pos = newData;
                    newData = parentId;
                    parentId = undefined;
                }
                var sysStruct = (typeof parentId != "string") ? this._getFakeRootNode() : this._getNodesMap(parentId),
                    data = sysStruct.node,
                    parentEls = sysStruct.divs;
                if (data.nodes == undefined || data.nodes.length == 0){
                    //append container for nodes
                    data.nodes = [];
                    (parentEls) ? parentEls.addClass("simple-right-menu-folder").removeClass("simple-right-menu-child") : null;
                    sysStruct.nodesContainer = (sysStruct.nodesContainer) ? sysStruct.nodesContainer : this._getNewContainerEl(parentId);
                    (parentEls) ? parentEls.children(":last").append(sysStruct.nodesContainer) : null;
                    //$(parentEls[parentEls.length - 1]).after(sysStruct.nodesContainer);
                }
                if (this._addNewNode(parentId, newData, sysStruct.nodesContainer, pos)){
                    if ($.isArray(newData)){
                        if (newData.length > 0){
                            data.nodes = data.nodes.concat(newData);
                        }
                    } else {
                        (pos != undefined && pos != -1) ? data.nodes.splice(pos, 0, newData)
                                           : data.nodes.push(newData);
                    }
                    if (data.nodes.length > 0 && parentEls)
                        parentEls.children(":not(:last)").find(".simple-right-menu-expand").addClass("simple-right-menu-has-child");

                    return newData['id'];
                }
                return;
            },
            moveNodeByPos: function(node, parentId, pos, source){
                source.removeNode(node.id);
                return this.addNode(parentId, node, pos);
            },
            removeNode: function(id){
                var sysStruct = this._getNodesMap(id),
                    self = this;
                if (!sysStruct){
                    this._error('Error :: There are no node by ID = ' + id);
                    return;
                }
                $(sysStruct.nodesContainer).empty().remove();
                sysStruct.divs.empty().remove();
                //clear data from parent
                var parentStruct = (sysStruct.parentId == undefined) ? this._getFakeRootNode() : this._getNodesMap(sysStruct.parentId);
                var children = parentStruct.node.nodes;
                if (children){
                    for (var i = 0, l = children.length; i < l; i++){
                        if (children[i].id == id){
                            this._traverseNodes(children[i], function(cNode){
                                delete self._nodesMap[cNode.id];
                            });
                            children.splice(i, 1);
                            break;
                        }
                    }
                }
                if (sysStruct.parentId != undefined){
                    if (children && children.length == 0){
                        parentStruct.divs.children(":not(:last)").find(".simple-right-menu-expand").removeClass("simple-right-menu-has-child");
                        parentStruct.nodesContainer.empty().remove();
                        parentStruct.nodesContainer = undefined;
                    }
                } else {
                    //for root node
                    if (!$.isArray(this._data)){
                        this._dropData();
                    }
                }
            },
            removeChildren: function(id){
                var map = this._getNodesMap(id);
                if (map && map.node.nodes != undefined){
                    for (var i = 0, l = map.node.nodes.length; i < l; i++){
                        this.removeNode(map.node.nodes[i].id);
                    }
                }
            },
            getChildren: function(id){
                var map = this._getNodesMap(id);
                if (map && map.node.nodes != undefined){
                    return map.node.nodes;
                }
            },
            _getEventElem: function(ev){
                return $((ev.originalEvent.target || ev.originalEvent.srcElement));
            },
            _getParentItemElement: function(el){
                return el.closest(".simple-right-menu-item");
            },
            _bindEvents: function(){
                var self = this,
                    div = this._div;

                $(this._contextDiv).unbind("." + this._id).bind("contextmenu." + this._id, function(ev){
                    self.onContextMenu(ev);
                    return false;
                }).bind("click." + this.id, function(){
                    self._onMenuClose();
                });
                //bind events to root div. we don't need to bind events to every child
                div.unbind("click dblclick contextmenu mouseover mouseenter mouseleave").bind("click", function(ev){
                    var el = self._getEventElem(ev),
                        parentEl = self._getParentItemElement(el);
                    if (parentEl.length != 0){
                        self._onSelect(parentEl);
                        $(rMenu).trigger(jqSimpleRightMenu.onClick, [parentEl.data("id")]);
                    }
                    ev.stopPropagation();
                }).bind("dblclick", function(ev){
                    var el = self._getEventElem(ev),
                        parentEl = self._getParentItemElement(el);
                        if (parentEl.length != 0){
                            $(rMenu).trigger(jqSimpleRightMenu.onDblClick, [parentEl.data("id")]);
                        }
                    ev.stopPropagation();
                }).bind("contextmenu", function(ev){
                    //drop context menu from menu items
                    ev.stopPropagation();
                    ev.preventDefault();
                }).bind("mouseover", function(ev){

                    var el = self._getEventElem(ev),
                        parentEl = self._getParentItemElement(el),
                        id = parentEl.data("id");
                    if (id == undefined){
                        return;
                    }
                    self._dropCloseTimeout();
                    var nodesMap = self._getNodesMap(id),
                        parent = self._getNodesMap(nodesMap.parentId);
                    parent = (parent == undefined) ? self._getFakeRootNode() : parent;
                    if (parent.node && parent.node.nodes){
                        var items = parent.node.nodes;
                        for (var i = 0, l = items.length; i < l; i++){
                            if (id != items[i].id && items[i].separator != true){
                                var hideItem = self._getNodesMap(items[i].id);
                                if (hideItem.nodesContainer && hideItem.nodesContainer.is(":visible")){
                                    hideItem.nodesContainer.fadeOut(100);
                                }
                            }
                        }
                    }
                    if (nodesMap.nodesContainer){
                        //showing items
                        var pNode = nodesMap.nodesContainer,
                            wHeight = $(window).height();
                        pNode.css({left: "", top: parentEl.position().top}).fadeIn(100);
                        self._fixPosition(wHeight, pNode);
                    }
                    ev.stopPropagation();
                    ev.preventDefault();
                }).bind("mouseleave", function(){
                    //check for hide menu
                    setLeaveState.call(self);
                })
                .bind("mouseenter", function(ev){
                    self._dropCloseTimeout();
                    ev.stopPropagation();
                    ev.preventDefault();
                })
                .bind("blur", function(){
                    self._onMenuClose();
                });
            },
            _onSelect: function(el, callEvent){
                var id = el.data("id"),
                    map = this._getNodesMap(id);
                if (!map || map.node.enable === false){
                    return;
                }
                if (typeof map.node.func == "function"){
                    map.node.func();
                }
                var oldSelId = this._objectEnv["selectedNodeId"];
                //this._div.find(".simple-right-menu-item-selected").removeClass("simple-right-menu-item-selected");
                //el.addClass("simple-right-menu-item-selected");
                if (this._div.is(":visible")){
                    this._onMenuClose();
                }
                var selId = this._objectEnv["selectedNodeId"] = id;
                if (callEvent !== false){
                    $(rMenu).trigger(jqSimpleRightMenu.onSelect, [selId, oldSelId]);
                }
            },
            selectNode: function(id, callEvent){
                var map = this._getNodesMap(id);
                if (map) {
                    this._onSelect(map['divs'], callEvent);
                }
            },
            isFolder: function(id){
                var map = this._getNodesMap(id);
                return (map && map['node']['nodes']) ? true : false;
            },
            getNode: function(id){
                var map = this._getNodesMap(id);
                return (map) ? map['node'] : undefined;
            },
            getParentNode: function(id){
                var map = this._getNodesMap(id);
                return (map) ? this.getNode(map['parentId']) : undefined;
            },
            getParentNodeId: function(id){
                var pNode = this.getParentNode(id);
                return (pNode == undefined) ? undefined : pNode.id;
            },
            setUserData: function(id, key, value){
                var map = this._getNodesMap(id);
                (map) ? map["node"]["userData"][key] = value : null;
            },
            getUserData: function(id, key){
                var map = this._getNodesMap(id);
                return (map) ? map["node"]["userData"][key] : undefined;
            },
            showNode: function(id){
                var map = this._getNodesMap(id);
                if (map) {
                    map["divs"].show();
                    map.node.visible = true;
                }
            },
            hideNode: function(id){
                var map = this._getNodesMap(id);
                if (map) {
                    map["divs"].hide();
                    map.node.visible = false;
                }
            },
            enableNode: function(id){
                var map = this._getNodesMap(id);
                if (map) {
                    map["divs"].removeClass("simple-right-menu-item-disable");
                    map["node"].enable = true;
                }
            },
            disableNode: function(id){
                var map = this._getNodesMap(id);
                if (map) {
                    map["divs"].addClass("simple-right-menu-item-disable");
                    map["node"].enable = false;
                }
            },
            onContextMenu: function(ev){
                var triggerEvent = new jQuery.Event(jqSimpleRightMenu.onBeforeShow),
                    self = this;
                $(this).trigger(triggerEvent, [ev]);
                if (ev && typeof ev == "object" && ev['clientX'] && ev['clientY']){
                    this._objectEnv['pos'] = {left: ev.clientX - 2, top:ev.clientY - 2};
                }
                if (!triggerEvent.isPropagationStopped()){
                    this.show();
                }
            },
            show: function(pos){
                var self = this,
                    div = this._div,
                    data = this._data,
                    visNodes = 0,
                    wHeight = $(window).height();

                for (var i = 0, l = data.length; i < l; i++){
                    var map = this._getNodesMap(data[i].id);
                    if (map.node.visible !== false){
                        visNodes++;
                    }
                }

                div.detach();
                if (visNodes > 0){
                    //if no visible root nodes, drop showing right menu
                    $(document.body).append(div);

                    pos = pos || this._objectEnv['pos'];
                    pos = (pos == undefined) ? {left: 0, top: 0} : pos;
                    div.css({left: pos.left - 2, top: pos.top - 2}).fadeIn(100);

                    setLeaveState.call(this);
                    div.show();
                    self._fixPosition(wHeight, div, true);
                    div.focus();
                }
            },
            hide: function(){
                this._onMenuClose();
            },
            reDraw: function(){
                this._setData(this._data);
                this._bindEvents();
            },
            base: function(){
                return this._div;
            },
            _fixPosition: function(wHeight, el, root){
                var h = el.height(),
                    pos = el.offset().top,
                    cssTop = parseInt(el.css("top")),
                newH = (wHeight < (h + pos)) ? wHeight - (h + pos) : 0;
                newH = (root) ? pos + newH : cssTop + newH;
                el.css("top", newH - 5);
            },
            destroy: function(){
                this._dropCloseTimeout();
                if (this._data){
                    var id = this._data['id'];
                    if (id != undefined){
                        this.removeNode(id);
                    }
                }
                if (this._div){
                    this._div.unbind("click dblclick contextmenu mouseenter mouseleave click dblclick").empty().remove();
                }
                if (this._contextDiv){
                    this._contextDiv.unbind("contextmenu." + this._id);
                    this._contextDiv = undefined;
                }
                this._nodesMap = undefined; this._data = undefined; this._objectEnv = undefined; this._div = undefined;
                this._opt = null;
                $(this).unbind();
            }
        };
        rMenu._init(div, data, opt);
        return rMenu;
    }
    jqSimpleRightMenu.onSelect = "E#jqSimpleRightMenu#onSelect";
    jqSimpleRightMenu.onBeforeShow = "E#jqSimpleRightMenu#onBeforeShow";
    jqSimpleRightMenu.onClose = "E#jqSimpleRightMenu#onClose";
    jqSimpleRightMenu.onClick = "E#jqSimpleRightMenu#onClick";
    jqSimpleRightMenu.onDblClick = "E#jqSimpleRightMenu#onDblClick";

    return jqSimpleRightMenu;
});