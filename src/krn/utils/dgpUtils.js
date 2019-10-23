/**
 * @file
 * @author  lingyx
 * @version 1.0.0
 * @ignore  created on 2019/8/29
 */
define([
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/_base/sniff',
    'dojo/_base/config',
    'dojo/number',
    'dojo/io-query',
    'dojo/query',
    'dojo/NodeList-traverse',
    'dojo/Deferred',
    'dojo/on'
],function(
    lang,
    array,
    html,
    has,
    config,
    dojoNumber,
    ioQuery,
    query,
    nlt,
    Deferred,
    on
) {
    var mo = {};
    // lang.mixin(mo, sharedUtils);
    // lang.mixin(mo,baseUtils);

    var errorCheckLists = [];
    require.on("error", function(err) {
        array.forEach(errorCheckLists, function(o) {
            if (err.info[0] && err.info[0].indexOf(o.resKey) > -1) {
                o.def.reject(err);
            }
            for (var p in err.info) {
                if (p.indexOf(o.resKey) > -1) {
                    o.def.reject(err);
                }
            }
        });
    });
    function loadStyleLink(id, href, beforeId) {
        var def = new Deferred(), styleNode, styleLinkNode;
        var hrefPath = require({packages: []}).toUrl(href);

        if(require.cache['url:' + hrefPath]){

            var cssStr = require.cache['url:' + hrefPath];
            var fileName = hrefPath.split('/').pop();
            var rpath = hrefPath.substr(0, hrefPath.length - fileName.length);
            cssStr = addRelativePathInCss(cssStr, rpath);
            if (beforeId) {
                styleNode = html.create('style', {
                    id: id,
                    type: "text/css"
                }, html.byId(beforeId), 'before');
            } else {
                styleNode = html.create('style', {
                    id: id,
                    type: "text/css"
                }, document.getElementsByTagName('head')[0]);
            }

            if(styleNode.styleSheet && !styleNode.sheet){
                //for IE
                styleNode.styleSheet.cssText = cssStr;
            }else{
                styleNode.appendChild(html.toDom(cssStr));
            }
            def.resolve('load');
            return def;
        }

        if (beforeId) {
            styleLinkNode = html.create('link', {
                id: id,
                rel: "stylesheet",
                type: "text/css",
                href: hrefPath + '?wab_dv=' + window.deployVersion
            }, html.byId(beforeId), 'before');
        } else {
            styleLinkNode = html.create('link', {
                id: id,
                rel: "stylesheet",
                type: "text/css",
                href: hrefPath + '?wab_dv=' + window.deployVersion
            }, document.getElementsByTagName('head')[0]);
        }

        on(styleLinkNode, 'load', function() {
            def.resolve('load');
        });


        var ti = setInterval(function() {
            var loadedSheet;
            if (array.some(document.styleSheets, function(styleSheet) {
                    if (styleSheet.href && styleSheet.href.substr(styleSheet.href.indexOf(href),
                            styleSheet.href.length) === href) {
                        loadedSheet = styleSheet;
                        return true;
                    }
                })) {
                try{
                    if (!def.isFulfilled() && (loadedSheet.cssRules && loadedSheet.cssRules.length ||
                        loadedSheet.rules && loadedSheet.rules.length)) {
                        def.resolve('load');
                    }
                    clearInterval(ti);
                }catch(err){

                }
            }
        }, 50);
        return def;
    };
    function addRelativePathInCss(css, rpath){
        var m = css.match(/url\([^)]+\)/gi), i, m2;

        if (m === null || rpath === '') {
            return css;
        }
        for (i = 0; i < m.length; i++) {
            m2 = m[i].match(/(url\(["|']?)(.*)((?:['|"]?)\))/i);
            if(m2.length >= 4){
                var path = m2[2];
                if(!rpath.endWith('/')){
                    rpath = rpath + '/';
                }
                css = css.replace(m2[1] + path + m2[3], m2[1] + rpath + path + m2[3]);
            }
        }
        return css;
    };
    function setVerticalCenter(contextNode) {
        function doSet() {
            var nodes = query('.dgp-vcenter-text', contextNode),
                h, ph;
            array.forEach(nodes, function(node) {
                h = html.getContentBox(node).h;
                html.setStyle(node, {
                    lineHeight: h + 'px'
                });
            }, this);

            nodes = query('.dgp-vcenter', contextNode);
            array.forEach(nodes, function(node) {
                h = html.getContentBox(node).h;
                ph = html.getContentBox(query(node).parent()[0]).h;
                html.setStyle(node, {
                    marginTop: (ph - h) / 2 + 'px'
                });
            }, this);
        }

        //delay sometime to let browser update dom
        setTimeout(doSet, 10);
    }
    mo.checkError = function(resKey, def) {
        errorCheckLists.push({
            resKey: resKey,
            def: def
        });
    };
    mo.getPositionStyle = function(_position) {
        var style = {};
        if(!_position){
            return style;
        }
        var position = lang.clone(_position);
        if(window.isRTL){
            var temp;
            if(typeof position.left !== 'undefined' && typeof position.right !== 'undefined'){
                temp = position.left;
                position.left = position.right;
                position.right = temp;
            }else if(typeof position.left !== 'undefined'){
                position.right = position.left;
                delete position.left;
            }else if(typeof position.right !== 'undefined'){
                position.left = position.right;
                delete position.right;
            }

            if(typeof position.paddingLeft !== 'undefined' &&
                typeof position.paddingRight !== 'undefined'){
                temp = position.paddingLeft;
                position.paddingLeft = position.paddingRight;
                position.paddingRight = temp;
            }else if(typeof position.paddingLeft !== 'undefined'){
                position.paddingRight = position.paddingLeft;
                delete position.paddingLeft;
            }else if(typeof position.paddingRight !== 'undefined'){
                position.paddingLeft = position.paddingRight;
                delete position.paddingRight;
            }
        }

        var ps = ['left', 'top', 'right', 'bottom', 'width', 'height',
            'padding', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'];
        for (var i = 0; i < ps.length; i++) {
            var p = ps[i];
            if (typeof position[p] === 'number') {
                if(position[p] != 0){
                    style[p] = position[p];
                }
            } else if (typeof position[p] !== 'undefined') {
                style[p] = position[p];
            }else{
                if(p.substr(0, 7) === 'padding'){
                    style[p] = 0;
                }else{
                    style[p] = 'auto';
                }
            }
        }

        if(typeof position.zIndex === 'undefined'){
            style.zIndex = 'auto';
        }else{
            style.zIndex = position.zIndex;
        }
        return style;
    };
    mo.setVerticalCenter = setVerticalCenter;
    mo.loadStyleLink = loadStyleLink;
    mo.getUriInfo = function getUriInfo(uri) {
        var pos, firstSeg, info = {},
            amdFolder;
        pos = uri.indexOf('/');
        firstSeg = uri.substring(0, pos);

        amdFolder = uri.substring(0, uri.lastIndexOf('/') + 1);
        info.folderUrl = require({packages: []}).toUrl(amdFolder);
        info.amdFolder = amdFolder;

        info.url = info.folderUrl;

        if(/^http(s)?:\/\//.test(uri) || /^\/\//.test(uri)){
            info.isRemote = true;
        }
        return info;
    };
    mo.processUrlInAppConfig = function(url){
        if(!url){
            return;
        }
        if(url.startWith('data:') || url.startWith('http') || url.startWith('/')){
            return url;
        }else{
            return window.appInfo.appPath + url;
        }
    };

    mo.getDefaultPortalFieldInfo = function(serviceFieldInfo){
        //serviceFieldInfo: {name,alias,type,...}
        var fieldName = serviceFieldInfo.name;
        var item = {
            fieldName: fieldName,
            label: serviceFieldInfo.alias || fieldName,
            tooltip: '',
            visible: false,
            format: null,
            stringFieldOption: 'textbox'
        };

        //https://developers.arcgis.com/javascript/jsapi/field-amd.html#type
        var type = serviceFieldInfo.type;
        switch (type) {
            case 'esriFieldTypeSmallInteger':
            case 'esriFieldTypeInteger':
                item.format = {
                    places: 0,
                    digitSeparator: true
                };
                break;
            case 'esriFieldTypeSingle':
            case 'esriFieldTypeDouble':
                item.format = {
                    places: 2,
                    digitSeparator: true
                };
                break;
            case 'esriFieldTypeDate':
                item.format = {
                    dateFormat: "longMonthDayYear"
                };
                break;
        }
        return item;
    };
    mo.localizeNumberByFieldInfo = function(n, fieldInfo) {
        var fn = null;
        var p = lang.exists('format.places', fieldInfo) && fieldInfo.format.places;
        fn = mo.localizeNumber(n, {
            places: p
        });

        if (lang.exists('format.digitSeparator', fieldInfo) && !fieldInfo.format.digitSeparator) {
            return fn.toString().replace(new RegExp('\\' + nlsBundle.group, "g"), "");
        } else {
            return fn;
        }
    };
    mo.localizeNumber = function(num, options){
        var decimalStr = num.toString().split('.')[1] || "",
            decimalLen = decimalStr.length;
        var _pattern = "";
        var places = options && isFinite(options.places) && options.places;
        if (places > 0 || decimalLen > 0) {
            var patchStr = Array.prototype.join.call({
                length: places > 0 ? (places + 1) : decimalLen
            }, '0');
            _pattern = "#,###,###,##0.0" + patchStr;
        }else {
            _pattern = "#,###,###,##0";
        }

        var _options = {
            locale: config.locale,
            pattern: _pattern
        };
        lang.mixin(_options, options || {});

        try {
            var fn = dojoNumber.format(num, _options);
            return fn;
        } catch (err) {
            console.error(err);
            return num.toLocaleString();
        }
    };
    mo.manifest = (function(){
        var ret = {};
        function addWidgetManifestProperties(manifest) {
            if (typeof manifest.properties === 'undefined') {
                manifest.properties = {};
            }
            // sharedUtils.processWidgetProperties(manifest);
        }

        ret.addManifestProperies = function(manifest) {
            addWidgetManifestProperties(manifest);
        };
        return ret;
    })();
    mo.widgetJson = (function(){
        var ret = {};

        ret.addManifest2WidgetJson = function(widgetJson, manifest){
            lang.mixin(widgetJson, manifest.properties);
            // 因为专题和台账是共用widget/css文件，每次remove时，会根据widget的name去删除对应的css文件
            // 若两个widget的name不一致，会删除该css文件，所以公共widget保证name一致，会做判断，一致则不删除
            /*if(!widgetJson.name){
                widgetJson.name = manifest.name;
            }*/
            widgetJson.name = manifest.name;

            if(!widgetJson.label){
                widgetJson.label = manifest.label;
            }
            widgetJson.manifest = manifest;
            widgetJson.isRemote = manifest.isRemote;
            if(widgetJson.isRemote){
                widgetJson.itemId = manifest.itemId;
            }
            if(manifest.featureActions){
                widgetJson.featureActions = manifest.featureActions;
            }
            widgetJson.folderUrl = manifest.folderUrl;
            widgetJson.amdFolder = manifest.amdFolder;
        };

        ret.removeManifestFromWidgetJson = function(widgetJson){
            if(!widgetJson.manifest){
                return;
            }
            for(var p in widgetJson.manifest.properties){
                widgetJson[p] = undefined;
            }
            widgetJson.name = undefined;
            widgetJson.label = undefined;
            widgetJson.featureActions = undefined;
            widgetJson.manifest = undefined;
        };
        return ret;
    })();
    return mo;
});