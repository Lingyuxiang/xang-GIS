/**
 * @file
 * @author  lingyx
 * @version 1.0.0
 * @ignore  created on 2019/9/2
 */
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dijit/_WidgetBase',
    'dojo/topic',
    'dojo/on',
    'dojo/query',
    'dojo/dom-construct',
    'dojo/dom-geometry',
    'dojo/dom-style',
    'dojo/Deferred',
    'dojo/promise/all',
    'dojo/when',
    'krn/core/MapManager',
    'krn/core/WidgetManager',
    'krn/utils/dgpUtils'
], function(
    declare,
    lang,
    arrayUtil,
    html,
    _WidgetBase,
    topic,
    on,
    query,
    domCon,
    domGeo,
    domStyle,
    Deferred,
    all,
    when,
    MapManager,
    WidgetManager,
    utils
) {
    var instance = null, clazz;

    clazz = declare([_WidgetBase], {
        map: null,
        mapId: 'map',
        animTime: 500,
        appConfig: null,
        // widgetManager: null,
        constructor: function (options,domId) {
            this.mapId = window.appInfo.userConfig.map.mapDiv;
            this.id = domId;
            this.widgetManager = WidgetManager.getInstance();
            // this.panelManager = PanelManager.getInstance();
            // DataManager.getInstance(this.widgetManager);
            this._bindEvents();
            // this.id = domId;
            // domStyle.set(this.id, 'visibility', 'hidden');

            // this.preloadModulesLoadDef = new Deferred();
        },
        postCreate: function(){
            // this.containerNode = this.domNode;
            // this.overlayNode = window.dgpConfig.overlayId;
            // window.dgpalert = dgpalert;

/*            ServiceManager.getEncryptionUserPassword(window.user.loginName).then(lang.hitch(this, function(response) {
                if(response) {
                    this._userName = response;
                }
            },
            function(error){
                    console.log(error);
            }))*/
        },

        _bindEvents: function() {
            this.own(
                topic.subscribe("mapLoaded", lang.hitch(this, this.onMapLoaded))
            )
            // this.own(topic.subscribe("appConfigLoaded", lang.hitch(this, this.onAppConfigLoaded)),
            //     topic.subscribe("mapLoaded", lang.hitch(this, this.onMapLoaded)),
            //     topic.subscribe("preloadModulesLoaded", lang.hitch(this, this._onPreloadModulesLoaded)),
            //     topic.subscribe(baseUtils.const.topic.DGP_OPEN_FILE, lang.hitch(this, this._showDocumentWindow)),
            //     topic.subscribe('dgp-open-file', lang.hitch(this, this._showDocumentWindow)),
            //     topic.subscribe('dgp-close-flie', lang.hitch(this, this._closeDocumentWindow)),
            //     on(window, 'resize', lang.hitch(this, this.resize))
            // )
            // window.officeFullScreen = function() {
            //    topic.publish(baseUtils.const.topic.FULL_SCREEN_OFFICE);
            // }
        },
        // onAppConfigLoaded: function(config){
        //     topic.subscribe('finishLoadTopMenu',lang.hitch(this, this._finishLoadTopMenu));
        //     this.appConfig = lang.clone(config);
        //     if(window.dgpConfig.showPortal) {
        //         var portal = new PortalWidget();
        //         portal.startup();
        //         portal.setPosition();
        //         domStyle.set(window.dgpConfig.loginPageId, 'display', 'none');
        //         domStyle.set(window.dgpConfig.portalPageId, 'display', 'block');

        //         on(portal,baseUtils.const.event.PORTAL_CLICK , lang.hitch(this, this._onPortalCellClick));
        //     }else {
        //         console.time('Map Load');
        //         // todo
        //         var defaultM = window.sysConfig.defaultModule;
        //         var defaultT = window.sysConfig.defaultTool;
        //         var modules = window.sysConfig.moduleForUser;
        //         if(modules && modules.length > 0) {
        //             for(var i=0; i<modules.length; i++)
        //             {
        //                 if(user.loginName == modules[i].user) {
        //                     defaultM = modules[i].module;
        //                     defaultT = modules[i].tool;
        //                     break;
        //                 }
        //             }
        //         }
        //         topic.publish('publishData', 'framework',  'framework', {defaultModule:defaultM});
        //         this._loadMap();
        //         TopicManager.getInstance().getAllTopics();
        //         this.preloadModulesLoadDef.then(lang.hitch(this, function(){
        //             if(this.appConfig.theme){
        //                 this._loadTheme(this.appConfig.theme);

        //             }
        //         }));
        //     }
        //     // 嵌入iframe加载系统界面
        //     if(window.appInfo.systemUrl !== null && window.appInfo.systemUrl !== '' && window.appInfo.systemUrl !== ' ') {
        //         this.pmIframeWidget = this.renderIframes();
        //         if (this.pmIframeWidget) {
        //             domStyle.set(this.pmIframeWidget, {
        //                 height: 'calc(100% - 40px)',
        //                 zIndex: 0
        //             });
        //         }
        //     }
        // },
        // /**
        //  * 用于判断TopMenuBar是否加载完成，以便于显示iframe的时候，隐藏左侧menu
        //  * @private
        //  */
        // _finishLoadTopMenu: function (flag) {
        //     if(flag) {
        //         this.loadTopMenu = flag;
        //     }

        // },
        // _onPortalCellClick: function(moduleLabel) {
        //     if(this.map) {//返回portal页重新进入系统
        //         domStyle.set(window.dgpConfig.portalPageId, 'display', 'none');
        //         topic.publish('reLoadModuleAndTool',moduleLabel);
        //     } else {
        //         topic.publish('publishData', 'framework',  'framework', {defaultModule:moduleLabel});
        //         this._loadMap();
        //         this.preloadModulesLoadDef.then(lang.hitch(this, function(){
        //             if(this.appConfig.theme){
        //                 this._loadTheme(this.appConfig.theme);
        //             }


        //         }));
        //     }
        //     arrayUtil.forEach(this.appConfig.widgetPool.groups ,lang.hitch(this,function(widget){
        //         if(widget.label === "综合服务框架"){
        //             if(widget.widgets[0].label === "管理员角色"){
        //                 query('.dgp-embed-iframe')[0].src=window.appInfo.systemUrl+"?key="+  window.user.encryptionName+ "&userRole=1";
        //                 console.log("综合服务框架的地址是↓");
        //                 console.log(window.appInfo.systemUrl+"?key="+  window.user.encryptionName+ "&userRole=1");
        //             }else{
        //                 query('.dgp-embed-iframe')[0].src=window.appInfo.systemUrl+"?key="+  window.user.encryptionName+ "&userRole=0";
	    //                 console.log("综合服务框架的地址是↓");
	    //                 console.log(window.appInfo.systemUrl+"?key="+  window.user.encryptionName+ "&userRole=1");
        //             }
        //         }
        //     }));

        //     if(window.appInfo.systemUrl !== null && window.appInfo.systemUrl !== '' && window.appInfo.systemUrl !== ' ') {
        //         if (moduleLabel === '综合服务框架')
        //             this._loadIframe();
        //         else {
        //             domStyle.set(query('.widgets-icon-wrapper')[0], 'visibility', 'visible');
        //             domStyle.set(query('.dgp-embed-iframe')[0], {
        //                 //height: '1px',
        //                 zIndex: 0
        //             });
        //         }
        //     }
        // },
        // _loadIframe: function () {
        //     if(this.loadTopMenu) {
        //         //window.frames['pmIframe'].postMessage('true', '*');
        //         domStyle.set(this.pmIframeWidget, {
        //             height: 'calc(100% - 40px)',
        //             zIndex: 890
        //         });
        //         domStyle.set(query('.widgets-icon-wrapper')[0], 'visibility', 'hidden');
        //     } else {
        //         setTimeout(lang.hitch(this,this._loadIframe), 500);
        //     }
        // },
        // _loadTheme: function(theme) {
        //     require(['themes/' + theme.name + '/main'], lang.hitch(this, function(){
        //         this._loadThemeCommonStyle(theme);
        //         this._loadThemeCurrentStyle(theme);
        //     }));
        // },
        // _loadThemeCommonStyle: function(theme) {
        //     dgpUtils.loadStyleLink(this._getThemeCommonStyleId(theme),
        //         'themes/' + theme.name + '/common.css');

        //     html.addClass(this.domNode, theme.name);
        // },
        // _loadThemeCurrentStyle: function(theme) {
        //     dgpUtils.loadStyleLink(this._getThemeCurrentStyleId(theme),
        //         'themes/' + theme.name + '/styles/' + theme.styles[0] + '/style.css');
        //     html.addClass(this.domNode, theme.styles[0]);
        // },
        // _getThemeCommonStyleId: function(theme){
        //     return 'theme_' + theme.name + '_style_common';
        // },
        // _getThemeCurrentStyleId: function(theme){
        //     return 'theme_' + theme.name + '_style_' + theme.styles[0];
        // },
        _loadMap: function() {
            html.create('div', {
                id: this.mapId,
                style: lang.mixin({
                    position: 'relative',
                    backgroundColor: 'white',
                    overflow: 'hidden',
                    height: '100%'
                    // minWidth:'1px',
                    // minHeight:'1px'
                })
            }, this.id);
            this.mapManager = MapManager.getInstance({
                appConfig: window.appInfo
            }, this.mapId);
            // this.mapManager.setMapPosition(this.appInfo.map.position);
            this.mapManager.showMap();
        },
        onMapLoaded: function(map) {
            // console.timeEnd('Map Load');
            this.map = map;
            var userConfig = window.appInfo.userConfig;
            this._loadPreloadWidgets(userConfig);
            // this.panelManager.setMap(map);
            // geometryUtils.setMap(map);
            // this.preloadModulesLoadDef.then(lang.hitch(this, function(){
            //     this._loadPreloadWidgets(this.appConfig);
            // }));
        },

        _loadPreloadWidgets: function(appConfig) {
            var defs = [];
            // console.time('preLoadWidget');
            arrayUtil.forEach(appConfig.widgets, function(widgetConfig) {
                // if(widgetConfig.isPreLoad){
                    defs.push(this._loadPreloadWidget(widgetConfig, appConfig));
                // }
            }, this);

            // arrayUtil.forEach(appConfig.widgetOnScreen.groups, function(groupConfig) {
            //     this._loadPreloadGroup(groupConfig, appConfig);
            // }, this);

            all(defs).then(lang.hitch(this, function(){
                topic.publish('preloadWidgetsLoaded');
                // this._doPostLoad();
            }), lang.hitch(this, function(){
                topic.publish('preloadWidgetsLoaded');
                // this._doPostLoad();
            }));
        },

        _loadPreloadWidget: function(widgetConfig, appConfig) {
            var def = new Deferred();

            // var iconDijit;
            // if(widgetConfig.inPanel || widgetConfig.closeable){
            //     //有panel的widget(需点击后打开)或者没有panel但是配置中closeable为true
            //     iconDijit = this._createPreloadWidgetIcon(widgetConfig);
            //     def.resolve(iconDijit);
            // }else{
                //off panel
            this.widgetManager.loadWidget(widgetConfig).then(lang.hitch(this, function(widget){
                try{
                    var containBox = this._getContainer(widgetConfig);
                    widget.setPosition(null,containBox);
                    this.widgetManager.openWidget(widget);
                }catch(err){
                    console.log(console.error('fail to startup widget ' + widget.name + '. ' + err.stack));
                }

                widget.configId = widgetConfig.id;
                def.resolve(widget);
            }), function(err){
                def.reject(err);
            });
            // }

            return def;
        },
        _getContainer: function(config){
            // console.log(config);
            var PositionStyle = utils.getPositionStyle(config.position);
            PositionStyle.position = "absolute";
            if(config.containerType == 'mapDiv'){
                return html.create('div',{
                    "style": PositionStyle
                },html.byId(window.appInfo.userConfig.map.mapDiv))
            }
        },
        // _createPreloadWidgetIcon: function(widgetConfig){
        //     var iconDijit = new OnScreenWidgetIcon({
        //         panelManager: this.panelManager,
        //         widgetManager: this.widgetManager,
        //         widgetConfig: widgetConfig,
        //         configId: widgetConfig.id,
        //         map: this.map
        //     });

        //     if(widgetConfig.position.relativeTo === 'map'){
        //         html.place(iconDijit.domNode, this.mapId);
        //     }else{
        //         html.place(iconDijit.domNode, this.id);
        //     }
        //     //icon position doesn't use width/height in config
        //     html.setStyle(iconDijit.domNode, dgpUtils.getPositionStyle({
        //         top: widgetConfig.position.top,
        //         left: widgetConfig.position.left,
        //         right: widgetConfig.position.right,
        //         bottom: widgetConfig.position.bottom,
        //         width: 40,
        //         height: 40
        //     }));
        //     iconDijit.startup();

        //     // 预先打开的预加载widget 只有一个
        //     if(!this.openAtStartWidget && widgetConfig.openAtStart){
        //         iconDijit.switchToOpen();
        //         this.openAtStartWidget = widgetConfig.name;
        //     }

        //     this.preloadWidgetIcons.push(iconDijit);
        //     return iconDijit;
        // },
        // /**
        //  * 渲染iframe嵌入系统
        //  * @private
        //  */
        // renderIframes: function () {
        //     var userName = '';
        //     if (window.user) {
        //         userName = encodeURI(window.user.encryptionName);
        //     }
        //     this.pmIframeWidget = domCon.create('iframe', {
        //         className: 'dgp-embed-iframe',
        //         name: 'pmIframe',
        //         src: window.appInfo.systemUrl + '?key=' + userName + "&userRole=0"
        //     }, this.containerNode);
        //     return this.pmIframeWidget;
        // },

        // _showDocumentWindow: function(file) {
        //     if(this.docWin) {
        //         this.docWin.destroy();
        //     }
        //     this.docWin = new DocWindow(file);
        //     this.docWin.placeAt(this.overlayNode);
        //     html.addClass(this.docWin.domNode, 'md-content');
        //     if(file.fileInfo.position) {
        //         var style = dgpUtils.getPositionStyle(file.fileInfo.position);
        //         html.setStyle(this.overlayNode, style);
        //         html.setStyle(this.overlayNode, 'z-index', 100);
        //     }
        //     html.addClass(this.overlayNode, 'show');
        // },
        // _closeDocumentWindow: function() {
        //     if(this.docWin) {
        //         this.docWin.destroyRecursive();
        //     }
        //     this.docWin = null;
        //     html.removeClass(this.overlayNode, 'show');
        // },
        // _doPostLoad: function(){
        //     require(['dgp/dynamic/postload']);
        //     console.timeEnd('preLoadWidget');
        //     domStyle.set(this.id, 'visibility', 'visible');
        //     console.timeEnd('app Load');
        //     domStyle.set(dgpConfig.loadingId, 'display', 'none');
        //     domStyle.set(dgpConfig.loginPageId, 'display', 'none');
        //     domStyle.set(dgpConfig.portalPageId, 'display', 'none');

        //     arrayUtil.forEach(this.appConfig.widgetOnScreen.widgets, function(widgetConfig) {
        //         if(!widgetConfig.isPreLoad){
        //             this._loadPreloadWidget(widgetConfig, this.appConfig);
        //         }
        //     }, this);
        //     this.mapManager.loadShadowLayers();
        // },
        // _onPreloadModulesLoaded: function(){
        //     this.preloadModulesLoadDef.resolve();
        // },


        resize: function() {
            arrayUtil.forEach(this.widgetManager.getAllWidgets(), function(w) {
                if (w.inPanel === false) {
                    w.resize();
                }
            }, this);
        },
    });
    clazz.getInstance = function(options,domId) {
        if (instance === null) {
            instance = new clazz(options,domId);
            window._layoutManager = instance;
        }
        return instance;
    };
    return clazz;
})