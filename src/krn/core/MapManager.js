/**
 * @file
 * @author  lingyx
 * @version 1.0.0
 * @ignore  created on 2019/8/30
 */
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/dom-construct',
    'dojo/query',
    'dojo/topic',
    'dojo/on',
    'dojo/aspect',
    'dojo/keys',
    'dojo/Deferred',
    'dojo/promise/all',
    'dojo/i18n',
    'dojo/_base/config',
    'esri/dijit/InfoWindow',
    'esri/InfoTemplate',
    'esri/request',
    'esri/arcgis/utils',
    'esri/geometry/Extent',
    'esri/geometry/Point',
    'esri/layers/ArcGISTiledMapServiceLayer',
    'esri/layers/ArcGISDynamicMapServiceLayer'
], function (
    declare,
    lang,
    arrayUtil,
    html,
    domCon,
    query,
    topic,
    on,
    aspect,
    keys,
    Deferred,
    all,
    i18n,
    dojoConfig,
    InfoWindow,
    InfoTemplate,
    esriRequest,
    arcgisUtils,
    Extent,
    Point,
    ArcGISTiledMapServiceLayer,
    ArcGISDynamicMapServiceLayer
) {

    var instance = null,
        clazz = declare(null, {
            appConfig: null,
            mapDivId: 'map',
            map: null,
            _wmtsLoad: true,
            _operLayers : null,
            constructor: function ( options, mapDivId) {
                this.appConfig = options.appConfig;
                this.mapDivId = mapDivId;
                this.id = mapDivId;
                this.nls = window.dgpNls;
                this._operLayers = [];
            },
            _addOGCConfig: function() {
                if(window.sysConfig.ogcService.enable) {
                    var xhr = new XMLHttpRequest();
                    xhr.overrideMimeType&&xhr.overrideMimeType('application/json');
                    xhr.open('GET', 'configs/WMTSConfig.json', true);
                    xhr.onreadystatechange = lang.hitch(this, function () {
                        if (xhr.readyState == 4 && xhr.status == '200') {
                            var ogcServices = JSON.parse(xhr.responseText);
                            this._wmtsConfog = ogcServices;
                            var cloneWmtsConfig = lang.clone(ogcServices);
                            var tempArr = cloneWmtsConfig.reverse();
                            arrayUtil.forEach(tempArr, function(ogcService, index) {
                                var url = '';
                                if(index === tempArr.length-1) url = window.sysConfig.ogcService.url;
                                this.appConfig.map.basemaps.unshift({
                                    'label': ogcService.label,
                                    'url': url,
                                    'type': ogcService.type,
                                    'clip': false,
                                    'icon': 'baseMap.png',
                                    'visible': ogcService.visible
                                });
                            }, this);
                            window.appConfig = this.appConfig;
                            this._wmtsLoad = true;
                        }
                    })
                    xhr.send(null);
                } else {
                    this._wmtsLoad = true;
                }
            },

            showMap: function () {
                if(this._wmtsLoad)
                    this._showMap(this.appConfig);
                else {
                    setTimeout(lang.hitch(this, this.showMap), 500);
                }
            },
            setMapPosition: function (position) {
                this.mapPosition = position;
                var posStyle = dgpUtils.getPositionStyle(position);
                html.setStyle(this.mapDivId, posStyle);
                if (this.map && this.map.resize) {
                    this.map.resize(true);
                }
            },
            _showMap: function (appConfig) {
                var appConfig = appConfig.userConfig;
                require(['esri/map'], lang.hitch(this, function (Map) {

                    var map = new Map(this.mapDivId, this._processMapOptions(appConfig.map.mapOptions));
                    window.distMap = map;
                    html.setStyle(map.root, 'zIndex', 0);
                    map._initialExtent = map.extent;

                    var mapLayerDefs = [];
                    this._visitConfigBaseMapLayers(appConfig.map.basemaps, lang.hitch(this, function (layerConfig, i) {
                        mapLayerDefs.push(this.createLayer(map,layerConfig, i));
                    }));

                    // var shadowDefs = [];
                    this._visitConfigOperationMapLayers(appConfig.map.operationallayers, lang.hitch(this, function(layerConfig) {
                        mapLayerDefs.push(this._createRealLayer(map, layerConfig));

                    }));

                    // all(shadowDefs).then(lang.hitch(this, function(hashArray) {
                    //     arrayUtil.forEach(hashArray, function(hashItem) {
                    //         lang.mixin(this._shadowLayersHash, hashItem);
                    //     }, this)
                    //     map.shadowLayersHash = this._shadowLayersHash;
                    // }));

                    all(mapLayerDefs).then(lang.hitch(this, function() {
                        this._loadLayerInfo(map);
                        // console.log("ddddd");
                        // this._loadPreloadWidgets(this.appConfig);
                    }));
                    $("#initLevel").show();
                    $("#initLevel").click(function(){
                    	map.setLevel(1);
                    })
                }));
            },
       
            _createRealLayer: function(map,layerConfig) {
                var def = new Deferred();
                var layerClass = null;
                if(layerConfig.type === 'dynamic'){
                    layerClass = ArcGISDynamicMapServiceLayer;
                }else if(layerConfig.type === 'tiled') {
                    layerClass = ArcGISTiledMapServiceLayer;
                }
                var layer = new layerClass(layerConfig.url);
                layer.id = layerConfig.guid;
                layer.guid = layerConfig.guid;
                layer.type = layerConfig.type;
                layer.label = layerConfig.name ||  layerConfig.label;
                if(typeof(layerConfig.visible) !=="undefined" || layerConfig.visible !== null) {
                    layer.setVisibility(layerConfig.visible);
                }
                if(layerConfig.type === 'dynamic'){
                    layer.setVisibleLayers([]);
                }
                this._operLayers.push({
                        layerObject: layer,
                        title: layer.label || layer.title || layer.name || layer.id || " ",
                        id: layer.id || " ",
                        type: layer.type,
                        _config: layerConfig
                });
                def.resolve();
                return def;
            },
            _visitConfigBaseMapLayers: function (baseMapConfig, cb) {
                arrayUtil.forEach(baseMapConfig, function (layerConfig, i) {
                    layerConfig.isOperationalLayer = false;
                    cb(layerConfig, i);
                }, this);
            },
            _visitConfigOperationMapLayers: function(operationalConfig, cb) {
              arrayUtil.forEach(operationalConfig, function (layerConfig, i) {
                    layerConfig.isOperationalLayer = true;
                    cb(layerConfig, i);
                }, this);
            },
         
            createLayer: function(map, layerConfig, index) {
                var def = new Deferred();
                var options = {};
                var layerClass = null;
                if(layerConfig.type === 'tiled'){
                    layerClass = ArcGISTiledMapServiceLayer
                }else if(layerConfig.type === 'dynamic') {
                    layerClass = ArcGISDynamicMapServiceLayer;
                }else if(layerConfig.type.indexOf('tdt') > -1) { // todo
                    layerClass = DGPWMTSLayer;
                    options = geometryUtils.createWMTSOptions(this._wmtsConfog[index]);
                    options.baseUrl = layerConfig.url;
                    layerConfig.url = this._wmtsConfog[index].url;
                }
                var infoTemplate,
                    keyProperties = ['label', 'url', 'type', 'icon', 'clip', 'isOperationalLayer','visible'];
                for (var p in layerConfig) {
                    if (keyProperties.indexOf(p) > -1) {
                        options[p] = layerConfig[p];
                    }
                }

                var layer = new layerClass(layerConfig.url, options);
                layer.options = options;
                layer.isOperationalLayer = layerConfig.isOperationalLayer;
                layer.label = layerConfig.name ||  layerConfig.label;
                layer.icon = layerConfig.icon;
                layer.clip = layerConfig.clip;
                layer.baseUrl = options.baseUrl; // todo
                layer.setVisibility(layerConfig.visible);
                if(layerConfig.guid) {
                    layer.id = layerConfig.guid;
                    layer.guid = layerConfig.guid;
                }
                var timeOut = setTimeout(function(){
                        if(!def.isResolved()){
                            def.resolve({error: {errorString:layerConfig.name+ '图层加载失败'}});
                        }
                    }, 10 * 1000);
                if(layerConfig.type !== 'tdt') {
                    layer.on('load', function (resLyr) {
                        clearTimeout(timeOut);
                        // console.log('加载了：' + resLyr.layer.label);
                        def.resolve(resLyr);
                    });
                    layer.on('error', function (error) {
                        console.log(error);
                        clearTimeout(timeOut);
                        if(layer){
                            map.removeLayer(layer);
                        }
                        def.resolve({error: lang.mixin(error, {errorString:layerConfig.name+ '图层加载失败'})});
                    });
                }else {
                    def.resolve(layer);
                }

                if(layerConfig.type ==='dynamic' && !layerConfig.isOperationalLayer) {
                        //layer.setVisibleLayers([1,2,3]);// todo
                }
                map.addLayer(layer);
                return def;
            },
            _loadLayerInfo: function(map) {
               var itemInfo = this._obtainMapLayers(map);
                map.itemInfo = itemInfo;
                this.reInitInfoWindow(map);
                this._publishMapEvent(map);
            },

            loadShadowLayers: function() {
                var shadowDefs = [];
                this._visitConfigOperationMapLayers(this.appConfig.map.operationallayers, lang.hitch(this, function(layerConfig) {
                    shadowDefs.push(this._createShadowLayers(this.map ,layerConfig));
                }));
                all(shadowDefs).then(lang.hitch(this, function(hashArray) {
                    arrayUtil.forEach(hashArray, function(hashItem) {
                        lang.mixin(this._shadowLayersHash, hashItem);
                    }, this)
                    map.shadowLayersHash = this._shadowLayersHash;
                }));
            },
            _createShadowLayers: function(map, layerConfig) {
                var def = new Deferred();
                var _shadowHash = {};
                var serviceInfo = new ServiceInfo(layerConfig);
                var layerClass = null;
                if(layerConfig.type === 'dynamic') {
                    layerClass = ArcGISDynamicMapServiceLayer;
                    serviceInfo.getLeafLayers().then(lang.hitch(this, function(leafLayers) {
                        arrayUtil.forEach(leafLayers, function(leafLayer) {
                            var layer = new layerClass(layerConfig.url);
                            layer.setVisibleLayers([leafLayer.id]);
                            layer.setVisibility(false);
                            layer.isOperationalLayer = layerConfig.isOperationalLayer;
                            layer.label = layerConfig.name ||  layerConfig.label;
                            layer.icon = layerConfig.icon;
                            if(layerConfig.guid) {
                                layer.id = layerConfig.guid+'_shadow_'+ leafLayer.id;
                                layer.guid = layerConfig.guid+'_shadow_'+ leafLayer.id;
                                _shadowHash[layer.guid] = layer;
                            }
                        }, this);
                        def.resolve(_shadowHash);
                    }));
                }else if(layerConfig.type=== 'tiled') {
                    layerClass = ArcGISTiledMapServiceLayer;
                    var layer = new layerClass(layerConfig.url);
                    layer.isOperationalLayer = layerConfig.isOperationalLayer;
                    layer.label = layerConfig.name ||  layerConfig.label;
                    layer.icon = layerConfig.icon;
                    if(layerConfig.guid) {
                        layer.id = layerConfig.guid;
                        layer.guid = layerConfig.guid;
                        layer.setVisibility(false);
                        _shadowHash[layer.guid] = layer;
                    }
                    def.resolve(_shadowHash);


                    var cloneLayer = {
                        dynamicToken:layerConfig.dynamicToken,
                        guid:layerConfig.guid+'_shadow',
                        icon:layerConfig.icon,
                        isOperationalLayer:layerConfig.isOperationalLayer,
                        name:layerConfig.name+' ',
                        type:'dynamic',
                        url:layerConfig.url,
                        visible:true
                    };
                    var dynLayer = new ArcGISDynamicMapServiceLayer(cloneLayer.url);
                    // dynLayer.setVisibleLayers([leafLayer.id]);
                    dynLayer.setVisibility(false);
                    dynLayer.isOperationalLayer = cloneLayer.isOperationalLayer;
                    dynLayer.label = cloneLayer.name ||  cloneLayer.label;
                    dynLayer.icon = cloneLayer.icon;
                    if(cloneLayer.guid) {
                        dynLayer.id = cloneLayer.guid+'_0';
                        dynLayer.guid = cloneLayer.guid+'_0';
                        _shadowHash[dynLayer.guid] = dynLayer;
                    }
                }
                return def;
            },
            //按需初始化服务
            _createShadowLayer:function(guid){
                var layerConfig = this._serverHash[guid];
                var _shadowHash = {};
                var serviceInfo = new ServiceInfo(layerConfig);
                var layerClass = null;
                if(layerConfig.type === 'dynamic') {
                    layerClass = ArcGISDynamicMapServiceLayer;
                    serviceInfo.getLeafLayers().then(lang.hitch(this, function(leafLayers) {
                        arrayUtil.forEach(leafLayers, function(leafLayer) {
                            var layer = new layerClass(layerConfig.url);
                            layer.setVisibleLayers([leafLayer.id]);
                            layer.setVisibility(false);
                            layer.isOperationalLayer = layerConfig.isOperationalLayer;
                            layer.label = layerConfig.name ||  layerConfig.label;
                            layer.icon = layerConfig.icon;
                            if(layerConfig.guid) {
                                layer.id = layerConfig.guid+'_shadow_'+ leafLayer.id;
                                layer.guid = layerConfig.guid+'_shadow_'+ leafLayer.id;
                                map.shadowLayersHash = this._shadowLayersHash[layer.guid] = layer;
                                this._serverHash[layer.guid] = layerConfig;
                            }
                        }, this);
                        return layer;
                    }));
                }else if(layerConfig.type=== 'tiled') {
                    layerClass = ArcGISTiledMapServiceLayer;
                    var layer = new layerClass(layerConfig.url);
                    layer.isOperationalLayer = layerConfig.isOperationalLayer;
                    layer.label = layerConfig.name ||  layerConfig.label;
                    layer.icon = layerConfig.icon;
                    if(layerConfig.guid) {
                        layer.id = layerConfig.guid;
                        layer.guid = layerConfig.guid;
                        layer.setVisibility(false);
                        map.shadowLayersHash = this._shadowLayersHash[layer.guid] = layer;
                        this._serverHash[layer.guid] = layerConfig;
                    }
                    return layer;
                }
            },
            getShadowLayers: function(guid) {
                var layer = this.map.getLayer(guid);
                if(!layer) {
                    layer = this._shadowLayersHash[guid];
                    if(!layer)
                    {
                        layer = this._createShadowLayer(guid);
                    }
                    layer.hasLoaded = false;
                }else {
                    layer.hasLoaded = true;
                }
                return layer;
            },
            _publishMapEvent: function(map) {
                window._viewerMap = map;
                this.map = map;
                this.resetInfoWindow(true);
                topic.publish('mapLoaded', this.map);
            },
            _addDataLoadingOnMapUpdate: function (map) {
                var loadHtml = '<div class="load-container">' +
                    '<div class="loader">Loading...</div>' +
                    '</div>';
                var loadContainer = html.toDom(loadHtml);
                html.place(loadContainer, map.root);
                if (map.updating) {
                    html.addClass(loadContainer, 'loading');
                }
                on(map, 'update-start', lang.hitch(this, function () {
                    this._dectedTime = setTimeout(lang.hitch(this, function() {
                        if(!this.mapUpdateEnd) {
                            html.addClass(loadContainer, 'loading');
                            clearTimeout(this._dectedTime);
                        }
                    }), 300);

                }));
                on(map, 'update-end', lang.hitch(this, function () {
                    html.removeClass(loadContainer, 'loading');
                    clearTimeout(this._dectedTime);

                }));
                on(map, 'unload', lang.hitch(this, function () {
                    html.destroy(loadContainer);
                    loadContainer = null;
                    this._destroyLoadingShelter();
                }));
            },

            reInitInfoWindow: function (map) {

                query(".titlePane .titleButton.maximize").forEach(function (node) {
                    html.destroy(node);
                });
                query(".sizer .actionsPane").forEach(function (node) {
                    html.destroy(node);
                });
                query(".sizer .titlePane").forEach(function (node) {
                    html.destroy(node);
                });



            },
            _obtainMapLayers: function (map) {
                var basemapLayers = [];
                var retObj = {
                    baseMapLayers: [],
                    operationalLayers: []
                };
                arrayUtil.forEach(map.layerIds, function (layerId) {
                    var layer = map.getLayer(layerId);
                    if (!layer.isOperationalLayer) {
                        basemapLayers.push({
                            layerObject: layer,
                            title: layer.label || layer.title || layer.name || layer.id || " ",
                            id: layer.id || " ",
                            type: layer.type
                        });
                    }
                }, this);

                retObj.baseMapLayers = basemapLayers;
                retObj.operationalLayers = this._operLayers;
                return retObj;
            },
            _processMapOptions: function (mapOptions) {
                if (!mapOptions) {
                    return;
                }
                if (!mapOptions.lods) {
                    delete mapOptions.lods;
                }
                if (mapOptions.lods && mapOptions.lods.length === 0) {
                    delete mapOptions.lods;
                }
                var ret = lang.clone(mapOptions);
                if (ret.extent) {
                    ret.extent = new Extent(ret.extent);
                }
                if (ret.center && !lang.isArrayLike(ret.center)) {
                    ret.center = new Point(ret.center);
                }
                if (ret.infoWindow) {
                    ret.infoWindow = new InfoWindow(ret.infoWindow, html.create('div', {}, this.mapDivId));
                }
                
                ret.maxZoom = 10;
                ret.minZoom = 1;
                return ret;
            },
            _bindEvents: function() {
                on(window, 'resize', lang.hitch(this, this.onWindowResize));
            },
            onWindowResize: function () {
                if (this.map && this.map.resize) {
                    this.map.resize();
                    this.resetInfoWindow(false);
                }
            },
            resetInfoWindow: function (isNewMap) {
                if (isNewMap) {
                    this._mapInfoWindow = this.map.infoWindow;
                }
                this.map.infoWindow.hide();
                this.map.setInfoWindow(this._mapInfoWindow);

                var popUp = this.map.infoWindow;
                popUp.pagingInfo = false;
                popUp.pagingControls = false;
                // 删除外边框
                if (popUp.markerSymbol && popUp.markerSymbol.outline) {
                    popUp.markerSymbol.setOutline(null);
                }
            }
        });
        clazz.getInstance = function (options, mapDivId) {
        if (instance === null) {
            instance = new clazz(options, mapDivId);
        }
        return instance;
    };

    return clazz;
});
