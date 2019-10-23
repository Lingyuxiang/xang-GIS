var appInfo = {
    "apiUrl": null,
    "serverUrl": null,
    "spitialServerUrl": null,
    "userConfig": null
}
!function (global) {
    window.path = _getPath();
    _loadJSON('configs/appConfig.json', function (response) {
        var appInfo = JSON.parse(response);

        window.apiUrl = appInfo.apiUrl;
        window.serverUrl = appInfo.serverUrl;
        window.spitialServerUrl = appInfo.spitialServerUrl;
        if(baseUrl){
            window.serverUrl = baseUrl;
        }
        // window.serverUrl = 'http://192.168.1.118:8080/';
        window.appInfo = appInfo;
        initEnv();
    });
    var resources = [];
    function initEnv() {

        if (!window.apiUrl) {
            console.error('no apiUrl.');
        } else if (!window.path) {
            console.error('no path.');
        } else {
            window.dojoConfig = {
                parseOnLoad: false,
                async: true,
                tlmSiblingOfDojo: false,
                has: {
                    'extend-esri': 1
                }
            };

            resources = resources.concat([
                window.apiUrl + 'init.js',
                window.apiUrl + 'dojo/resources/dojo.css',
                window.apiUrl + 'dijit/themes/claro/claro.css',
                window.apiUrl + 'esri/css/esri.css',
                // window.path + 'css/iconfont/iconfont.css',
                '../../fontSize/iconfont.css',
                // '../../js/common.js',
                // window.path + 'libs/layUI2.5.5/css/layui.css',
                window.path + 'css/index.css',
                window.path + 'css/common.css',
                // window.path + 'libs/layUI2.5.5/layui.js'
                // window.apiUrl + 'dojox/layout/resources/ResizeHandle.css',
            ]);

            dojoConfig.baseUrl = window.apiUrl + 'dojo';
            dojoConfig.packages = [{
                name: "widgets",
                location: window.path + "widgets"
            }, {
                name: "krn",
                location: window.path + "krn"
            }, {
                name: "libs",
                location: window.path + "libs"
            }, {
                name: "configs",
                location: window.path + "configs"
            }];

            loadResources(resources, null, function (url, loaded) {
            }, function () {
                //	设置字体大小
                var setFont = function () {
                    var docEl = document.documentElement
                    var clientWidth = docEl.clientWidth;
                    docEl.style.fontSize = 20 * (clientWidth / 1920) + 'px!important';
                    console.log(docEl.style.fontSize)
                }
                setFont();
                var  continueLoad = function() {
                    if (typeof require === 'undefined' || typeof layui == 'undefined') {
                        if (window.console) {
                            console.log('Waiting for API loaded.');
                        }
                        setTimeout(continueLoad, 4000);
                        return;
                    }
                    layui.use('jquery',  ()=> {
                        window.$ = layui.$;
                    })
                    document.getElementById("loadingIcon").style.display = "none";
                    var userConfig;
                    try {
                        userConfig = window.parent.initMapConfig();
                        initSystem();
                    } catch(e){
                       
                        console.log("读取默认配置");
                        console.log(e)
                        _loadJSON('static/userConfig.json', function (response) {
                            userConfig = JSON.parse(response);
                            initSystem();
                        })
                    }

                    function initSystem() {
                        window.appInfo.userConfig = userConfig;
                        Object.freeze(window.appInfo)
                        require(['krn/core/LayoutManager.js'], function (LayoutManager) {
                            var layoutDivId = 'mapDiv';
                            var layoutManager = LayoutManager.getInstance({
                                mapId: window.appInfo.userConfig.map.mapDiv
                            }, layoutDivId);
                            layoutManager._loadMap();
                        })
                    }
                }
                continueLoad();
            })
        }
    };

    function loadResources(ress, onOneBeginLoad, onOneLoad, onLoad) {
        var loaded = [];

        function _onOneLoad(url) {

            // if (checkHaveLoaded(url)) {
            //     return;
            // }
            loaded.push(url);
            if (onOneLoad) {
                onOneLoad(url, loaded.length);
            }
            if (loaded.length === ress.length) {
                if (onLoad) {
                    onLoad();
                }
            }
        }

        for (var i = 0; i < ress.length; i++) {
            loadResource(ress[i], onOneBeginLoad, _onOneLoad);
        }

        // function checkHaveLoaded(url) {
        //     for (var i = 0; i < loaded.length; i++) {
        //         if (loaded[i] === url) {
        //             return true;
        //         }
        //     }
        //     return false;
        // }
    }

    function _getPath() {
        var fullPath, path;

        fullPath = window.location.pathname;
        if (fullPath === '/' || fullPath.substr(fullPath.length - 1) === '/') {
            path = fullPath;
        } else {
            var sections = fullPath.split('/');
            var lastSection = sections.pop();
            if (/\.html$/.test(lastSection) || /\.aspx$/.test(lastSection) ||
                /\.jsp$/.test(lastSection) || /\.php$/.test(lastSection)) {
                //index.html may be renamed to index.jsp, etc.
                path = sections.join('/') + '/';
            } else {
                return false;
            }
        }
        return path;
    }

    function _loadJSON(position, callback) {
        var xhr = new XMLHttpRequest();
        xhr.overrideMimeType && xhr.overrideMimeType('application/json');
        xhr.open('GET', position, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == '200') {
                callback(xhr.responseText);
            }
        }
        xhr.send(null);
    }

    function getExtension(url) {
        url = url || "";
        var items = url.split("?")[0].split(".");
        return items[items.length - 1].toLowerCase();
    }


    function loadResource(url, onBeginLoad, onLoad) {
        if (onBeginLoad) {
            onBeginLoad(url);
        }
        var type = getExtension(url);
        if (type.toLowerCase() === 'css') {
            loadCss(url);
        } else {
            loadJs(url);
        }

        function createElement(config) {
            var e = document.createElement(config.element);
            for (var i in config) {
                if (i !== 'element' && i !== 'appendTo') {
                    e[i] = config[i];
                }
            }
            var root = document.getElementsByTagName(config.appendTo)[0];
            return (typeof root.appendChild(e) === 'object');
        }

        function loadCss(url) {
            var result = createElement({
                element: 'link',
                rel: 'stylesheet',
                type: 'text/css',
                href: url,
                onload: function () {
                    elementLoaded(url);
                },
                appendTo: 'head'
            });


            var ti = setInterval(function () {
                var styles = document.styleSheets;
                for (var i = 0; i < styles.length; i++) {
                    // console.log(styles[i].href);
                    if (styles[i].href &&
                        styles[i].href.substr(styles[i].href.indexOf(url), styles[i].href.length) === url) {
                        clearInterval(ti);
                        elementLoaded(url);
                    }
                }
            }, 500);

            return (result);
        }

        function loadJs(url) {
            var result = createElement({
                element: 'script',
                type: 'text/javascript',
                onload: function () {
                    elementLoaded(url);
                },
                onreadystatechange: function () {
                    elementReadyStateChanged(url, this);
                },
                src: url,
                appendTo: 'body'
            });
            return (result);
        }

        function elementLoaded(url) {
            if (onLoad) {
                onLoad(url);
            }
        }

        function elementReadyStateChanged(url, thisObj) {
            if (thisObj.readyState === 'loaded' || thisObj.readyState === 'complete') {
                elementLoaded(url);
            }
        }
    }
}(window)