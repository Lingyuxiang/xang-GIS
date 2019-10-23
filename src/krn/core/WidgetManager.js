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
    'dojo/Deferred',
    'dojo/topic',
    'dojo/Evented',
    'dojo/on',
    'dojo/aspect',
    'dojo/json',
    'dojo/query',
    'dojo/request/xhr',
    'dojo/promise/all',
    'krn/utils/dgpUtils'
], function (declare,
             lang,
             arrayUtil,
             html,
             Deferred,
             topic,
             Evented,
             on,
             aspect,
             JSON,
             query,
             xhr,
             all,
             dgpUtils) {
    var instance = null,
        clazz = declare(Evented, {
            loaded: null,
            activeWidget: null,
            map: null,
            sideBarWidget: null,
            constructor: function () {
                this.loaded = [];
                this.missedActions = [];
                this.activeWidget = null;
                this._bindEvents();
            },
            loadWidget: function (setting) {
                var def = new Deferred(),
                    findWidget;

                setting = lang.clone(setting);

                findWidget = this.getWidgetById(setting.id);

                if (findWidget) {
                    def.resolve(findWidget);
                } else {
                    all([this.loadWidgetClass(setting)])
                    .then(lang.hitch(this, function (results) {
                        var clazz = results[0];
                        this.loadWidgetResources(setting).then(lang.hitch(this, function (resouces) {
                            try {
                                var widget = this.createWidget(setting, clazz, resouces);
                                html.setAttr(widget.domNode, 'data-widget-name', setting.name);
                                // console.log('widget [' + setting.label + '] created.');
                            } catch (err) {
                                console.log('create [' + setting.label + '] error:' + err.stack);
    
                                def.reject(err);
                            }
                            def.resolve(widget);
                            //use timeout to let the widget can get the correct dimension in startup function
                            // setTimeout(lang.hitch(this, function () {
                            //     def.resolve(widget);
                            //     //确定侧边栏功能
                            //     if (widget.isSideBar) {
                            //         this.sideBarWidget = widget;
                            //     }
                            //     this.emit('widget-created', widget);
                            //     topic.publish('widgetCreated', widget);
                            // }), 50);
    
                        }), function (err) {
                            def.reject(err);
                        });
                    }))


                }
                return def;
            },
            createWidget: function (setting, clazz, resouces) {
                var widget;
                if (this.getWidgetById(setting.id)) {
                    return this.getWidgetById(setting.id);
                }


                setting.param = setting.param;

                setting.config = resouces.config || {};

                if (resouces.template) {
                    setting.templateString = resouces.template;
                }

                setting['class'] = 'dgp-widget';
                if (!setting.label) {
                    setting.label = setting.name;
                }
                if (this.map) {
                    setting.map = this.map;
                }
                // setting.appConfig = this.appConfig;

                // for IE8
                var setting2 = {};
                for (var prop in setting) {
                    if (setting.hasOwnProperty(prop)) {
                        setting2[prop] = setting[prop];
                    }
                }

                setting2.widgetManager = this;

                widget = new clazz(setting2);
                widget.clazz = clazz;
                aspect.after(widget, 'startup', lang.hitch(this, this._postWidgetStartup, widget));
                aspect.before(widget, 'destroy', lang.hitch(this, this._onDestroyWidget, widget));

                on(widget.domNode, 'click', lang.hitch(this, this._onClickWidget, widget));

                this.loaded.push(widget);
                return widget;
            },
            openWidget: function (widget, /*optional*/data) {
                if (typeof widget === 'string') {
                    widget = this.getWidgetById(widget);
                    if (!widget) {
                        return;
                    }
                }
                if (!widget.started) {
                    if (widget.inSideBar) {
                        var sideBarPanel = this._createSidePanel(widget);
                        sideBarPanel.domNode.sideBarWidth = sideBarPanel.sideBarWidth;
                        this.sideBarWidget.addSidePanel(sideBarPanel.domNode);
                    }
                    try {
                        widget.started = true;
                        widget.startup();
                    } catch (err) {
                        console.error('fail to startup widget ' + widget.name + '. ' + err.stack);
                    }
                }else {
                    if (widget.inSideBar) {
                        var sideBarPanel = this.sideBarWidget.getPanelById(widget.id+'_side');
                        if(sideBarPanel) {
                            this.sideBarWidget.showPanel(sideBarPanel);
                        }
                    }
                }
                if (widget.state === 'closed') {
                    if(widget.domNode) {
                        html.setStyle(widget.domNode, 'display', '');
                    }
                    widget.setState('opened');
                    try {
                        widget.onOpen(data);
                    } catch (err) {
                        console.error('fail to open widget ' + widget.name + '. ' + err.stack);
                    }
                }
            },
            _createSidePanel: function (widget) {
                var sideBarPanel =new BaseSidePanel({widget:widget,widgetManager:this});
                sideBarPanel.sideBarWidth = widget.sideBarWidth || null;
                widget.sidePanel = sideBarPanel;
                return sideBarPanel;
            },
            closeWidget: function (widget) {
                if (typeof widget === 'string') {
                    widget = this.getWidgetById(widget);
                    if (!widget) {
                        return;
                    }
                }

                if (widget.state !== 'closed') {
                    if (this.activeWidget && this.activeWidget.id === widget.id) {
                        this.activeWidget.onDeActive();
                        this.activeWidget = null;
                    }
                    html.setStyle(widget.domNode, 'display', 'none');
                    widget.setState('closed');
                    try {
                        widget.onClose();
                        if (widget.inSideBar) {
                            if(widget.fakeClose) {
                                var sidePanel = widget.sidePanel;
                                this.sideBarWidget.hideSidePanel(sidePanel.domNode);
                            }else {
                                var sidePanel = widget.sidePanel;
                                this.destroyWidget(widget);
                                this.sideBarWidget.removeSidePanel(sidePanel.domNode);
                            }

                        }
                    } catch (err) {
                        console.log(console.error('fail to close widget ' + widget.name + '. ' + err.stack));
                    }
                }
            },
            minimizeWidget: function (widget) {
                if (typeof widget === 'string') {
                    widget = this.getWidgetById(widget);
                    if (!widget) {
                        return;
                    }
                }

                if (widget.state === 'closed') {
                    this.openWidget(widget);
                }
                widget.setWindowState('minimized');
                try {
                    widget.onMinimize();
                } catch (err) {
                    console.log(console.error('fail to minimize widget ' + widget.name + '. ' + err.stack));
                }
            },
            destroyWidget: function (widget) {
                var m;
                if (typeof widget === 'string') {
                    m = this.getWidgetById(widget);
                    if (!m) {
                        return;
                    } else {
                        widget = m;
                    }
                }
                this._removeWidget(widget);
                try {
                    widget.destroy();
                } catch (err) {
                    console.log(console.error('fail to destroy widget ' + widget.name + '. ' + err.stack));
                }
            },
            loadWidgetClass: function (setting) {
                var def = new Deferred();

                var uri;
                uri = setting.widgetPath + 'widget.js';
                require({packages: []}, [uri], lang.hitch(this, function (clazz) {
                    def.resolve(clazz);
                }));
                dgpUtils.checkError(setting.uri, def);
                return def;
            },
            loadWidgetManifest: function (widgetJson) {
                var def = new Deferred();

                var url = dgpUtils.getUriInfo(widgetJson.uri).folderUrl + 'manifest.json';
                if (widgetJson.manifest) {
                    def.resolve(widgetJson);
                    return def;
                }

                xhr(url, {
                    handleAs: 'json',
                    preventCache: true,
                    headers: {
                        "X-Requested-With": null
                    }
                }).then(lang.hitch(this, function (manifest) {
                    if (manifest.error && manifest.error.code) {
                        return def.reject(manifest.error);
                    }
                    manifest.category = 'widget';
                    lang.mixin(manifest, dgpUtils.getUriInfo(widgetJson.uri));

                    this._processManifest(manifest);

                    dgpUtils.widgetJson.addManifest2WidgetJson(widgetJson, manifest);
                    def.resolve(widgetJson);
                }), function (err) {
                    def.reject(err);
                });
                return def;
            },
            loadWidgetResources: function (setting) {
                var def = new Deferred(),
                    defConfig, defStyle, defTemplate, defs = [];

                var setting2 = lang.clone(setting);

                defConfig = this.tryLoadWidgetConfig(setting2);
                defStyle = this._tryLoadResource(setting2, 'style');
                defTemplate = this._tryLoadResource(setting2, 'template');

                defs.push(defConfig);
                defs.push(defTemplate);
                defs.push(defStyle);

                all(defs).then(lang.hitch(this, function (results) {
                    var res = {};
                    res.config = results[0];
                    res.template = results[1];
                    res.style = results[2];
                    def.resolve(res);
                }), function (err) {
                    def.reject(err);
                });

                return def;
            },
            tryLoadWidgetConfig: function (setting) {
                return this._tryLoadWidgetConfig(setting).then(lang.hitch(this, function (widgetConfig) {
                    setting.config = widgetConfig;
                    return widgetConfig;
                }));
            },
            getAllWidgets: function () {
                return this.loaded;
            },
            loadWidgetStyle: function (widgetSetting) {
                var id = 'widget/style/' + widgetSetting.widgetPath + 'widget',
                    def = new Deferred();
                id = this._replaceId(id);
                if (html.byId(id)) {
                    def.resolve('load');
                    return def;
                }
                // var themeCommonStyleId = 'theme_' + this.appConfig.theme.name + '_style_common';
                return dgpUtils.loadStyleLink(id, widgetSetting.styleFile, null);
            },
            loadWidgetConfig: function (widgetSetting) {
                var configFilePath = require({packages: []}).toUrl(widgetSetting.configFile);
                if (require.cache['url:' + configFilePath]) {
                    var def = new Deferred();
                    def.resolve(JSON.parse(require.cache['url:' + configFilePath]));
                    return def;
                }
                return xhr(configFilePath, {
                    handleAs: "json",
                    preventCache: true,
                    headers: {
                        "X-Requested-With": null
                    }
                });
            },
            loadWidgetTemplate: function (widgetSetting) {
                var def = new Deferred();
                require({packages: []}, ['dojo/text!' + widgetSetting.templateFile],
                    function (template) {
                        def.resolve(template);
                    });

                dgpUtils.checkError(widgetSetting.templateFile, def);
                return def;
            },
            getWidgetById: function (id) {
                var ret;
                arrayUtil.some(this.loaded, function (w) {
                    if (w.id === id) {
                        ret = w;
                        return true;
                    }
                }, this);
                return ret;
            },
            getWidgetsByName: function (name) {
                var ret = [];
                arrayUtil.some(this.loaded, function (w) {
                    if (w.name === name) {
                        ret.push(w);
                    }
                }, this);
                return ret;
            },
            removeWidgetStyle: function (widget) {
                html.destroy(this._replaceId('widget/style/' + widget.uri));
            },
            _onActionTriggered: function (info) {
                if (info.elementId === 'map' || info.elementId === 'app') {
                    return;
                }
                var m = this.getWidgetById(info.elementId);
                if (!m) {
                    this.missedActions.push({
                        id: info.elementId,
                        action: {
                            name: info.action,
                            data: info.data
                        }
                    });
                } else {
                    m.onAction(info.action, info.data);
                }
                //may be the controller widget also need process the action
                array.forEach(this.getControllerWidgets(), function (ctrlWidget) {
                    if (ctrlWidget.widgetIsControlled(info.elementId)) {
                        ctrlWidget.onAction(info.action, {
                            widgetId: info.elementId,
                            data: info.data
                        });
                    }
                }, this);
            },


            activateWidget: function (widget) {
                //activate a widget, the widget must be opened first
                if (typeof widget === 'string') {
                    widget = this.getWidgetById(widget);
                    if (!widget) {
                        return;
                    }
                }
                if (widget.state === 'closed') {
                    return;
                }

                this._activeWidget(widget);
            },
            _activeWidget: function (widget) {
                if (this.activeWidget) {
                     if (this.activeWidget.state === 'active') {
                        this.activeWidget.setState('opened');
                        this.activeWidget.onDeActive();
                    }
                }
                this.activeWidget = widget;
                if (this.activeWidget.state !== 'opened') {
                    return;
                }
                this.activeWidget.setState('active');
                this.activeWidget.onActive();
                var ap = this.panelManager.activePanel;
                if(ap && ap.state === 'active'){
                    ap.setState('opened');
                    ap.onDeActive();
                    this.panelManager.activePanel = null;
                }
            },
            _postWidgetStartup: function (widgetObject) {
                widgetObject.started = true;
                dgpUtils.setVerticalCenter(widgetObject.domNode);
                aspect.after(widgetObject, 'resize', lang.hitch(this,
                    dgpUtils.setVerticalCenter, widgetObject.domNode));
                this.openWidget(widgetObject);

                this._triggerMissedAction(widgetObject);
            },
            _onDestroyWidget: function (widget) {
                if (widget.state !== 'closed') {
                    this.closeWidget(widget);
                }
                this._removeWidget(widget);
                this.emit('widget-destroyed', widget.id);
                topic.publish('widgetDestroyed', widget.id);
                console.log('destroy widget [' + widget.uri + '].');
            },
            _triggerMissedAction: function (widget) {
                this.missedActions.forEach(function (info) {
                    if (info.id === widget.id) {
                        widget.onAction(info.action.name, info.action.data);
                    }
                });
            },
            _processManifest: function (manifest) {
                manifest.label = manifest.label || manifest.name;
                dgpUtils.manifest.addManifestProperies(manifest);
            },
            _tryLoadWidgetConfig: function (setting) {
                var def = new Deferred();
                if (setting.config && lang.isObject(setting.config)) {
                    def.resolve(setting.config);
                    return def;
                } else if (setting.config) {
                    if (require.cache['url:' + setting.config]) {
                        def.resolve(JSON.parse(require.cache['url:' + setting.config]));
                        return def;
                    }
                    var configFile = dgpUtils.processUrlInAppConfig(setting.config);
                    var configFileArray = configFile.split('/');
                    configFileArray[configFileArray.length - 1] =
                        encodeURIComponent(configFileArray[configFileArray.length - 1]);
                    configFile = configFileArray.join('/');
                    return xhr(configFile, {
                        handleAs: "json",
                        preventCache: true,
                        headers: {
                            "X-Requested-With": null
                        }
                    });
                } else {
                    return this._tryLoadResource(setting, 'config').then(function (config) {
                        setting.isDefaultConfig = true;
                        return config;
                    });
                }
            },
            _tryLoadResource: function (setting, flag) {
                var file, hasp,
                    def = new Deferred(),
                    doLoad = function () {
                        var loadDef;
                        if (flag === 'config') {
                            loadDef = this.loadWidgetConfig(setting);
                        } else if (flag === 'style') {
                            loadDef = this.loadWidgetStyle(setting);
                        } else if (flag === 'template') {
                            loadDef = this.loadWidgetTemplate(setting);
                        } else {
                            return def;
                        }
                        loadDef.then(function (data) {
                            def.resolve(data);
                        }, function (err) {
                            console.error(setting.uri);
                            def.reject(err);
                        });
                    };

                if (flag === 'config') {
                    file = setting.widgetPath + 'config.json';
                    setting.configFile = file;
                    hasp = 'hasConfig';
                } else if (flag === 'style') {
                    file = setting.widgetPath + 'css/style.css';
                    setting.styleFile = file;
                    hasp = 'hasStyle';
                } else if (flag === 'template') {
                    // Todo
                    // var htmlName = setting.uri.substr(setting.uri.lastIndexOf('/')+1, setting.uri.length);
                    file = setting.widgetPath + 'widget.html';
                    //file = setting.amdFolder + 'Widget.html';
                    setting.templateFile = file;
                    hasp = 'hasUIFile';
                } else {
                    return def;
                }

                if (setting[hasp]) {
                    doLoad.apply(this);
                } else {
                    def.resolve(null);
                }
                return def;
            },

            _replaceId: function (id) {
                return id.replace(/\//g, '_').replace(/\./g, '_');
            },
            _bindEvents: function () {
                topic.subscribe("mapLoaded", lang.hitch(this, this._onMapLoaded));
                topic.subscribe("appConfigLoaded", lang.hitch(this, this._onAppConfigLoaded));
                topic.subscribe('userSignIn', lang.hitch(this, this._onUserSignIn));
                topic.subscribe('userSignOut', lang.hitch(this, this._onUserSignOut));
                topic.subscribe('/dnd/move/start', lang.hitch(this, this._onMoveStart));
            },

            _onUserSignIn: function (credential) {
                arrayUtil.forEach(this.loaded, function (m) {
                    m.onSignIn(credential);
                }, this);
            },

            _onUserSignOut: function () {
                arrayUtil.forEach(this.loaded, function (m) {
                    m.onSignOut();
                }, this);
            },
            _onAppConfigLoaded: function (_appConfig) {
                var appConfig = lang.clone(_appConfig);
                this.appConfig = appConfig;
            },

            _onMapLoaded: function (map) {
                this.map = map;
            },
            _onMoveStart: function (mover) {
                arrayUtil.forEach(this.loaded, function (widget) {
                    if (widget.domNode === mover.node) {

                    }
                }, this);
            },
            _remove: function (id) {
                return arrayUtil.some(this.loaded, function (w, i) {
                    if (w.id === id) {
                        this.loaded.splice(i, 1);
                        return true;
                    }
                }, this);
            },

            _removeWidget: function (widget) {
                var m;
                if (typeof widget === 'string') {
                    m = this.getWidgetById(widget);
                    if (!m) {
                        //maybe, the widget is loading
                        return;
                    } else {
                        widget = m;
                    }
                }
                if (this.activeWidget && this.activeWidget.id === widget.id) {
                    this.activeWidget = null;
                }
                this._remove(widget.id);
                if (this.getWidgetsByName(widget.name).length === 0) {
                    this.removeWidgetStyle(widget);
                }
            }
        });

    clazz.getInstance = function () {
        if (instance === null) {
            instance = new clazz();
            window._widgetManager = instance;
        }
        return instance;
    };
    return clazz;
});