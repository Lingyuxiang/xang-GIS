/**
 * @file
 * @author  lingyx
 * @version 1.0.0
 * @ignore  created on 2017/9/5
 */
define([
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/dom-class',
    'dojo/Deferred',        
    'esri/graphic',
    'esri/layers/ArcGISDynamicMapServiceLayer',
    'esri/layers/GraphicsLayer',
    'esri/toolbars/draw',
    'esri/Color',
    'esri/symbols/Font',
    'esri/geometry/Polyline',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/TextSymbol',
    'esri/lang',
    'esri/arcgis/utils',
    'esri/dijit/PopupTemplate',
    'esri/SpatialReference',
    'esri/geometry/Extent',
    'esri/layers/WMTSLayerInfo',
    'esri/layers/TileInfo',
    'esri/geometry/Multipoint',
    'esri/geometry/Polygon',
    'esri/geometry/webMercatorUtils',
    'esri/tasks/GeometryService',
    'esri/tasks/ProjectParameters',
    'esri/tasks/FeatureSet',
    'esri/symbols/PictureMarkerSymbol',
    'esri/layers/DynamicLayerInfo',
    'esri/layers/LayerDataSource',
    'esri/layers/TableDataSource',
    'esri/layers/LayerDrawingOptions',
    'esri/layers/LabelClass',
    'esri/renderers/SimpleRenderer',
    'esri/renderers/UniqueValueRenderer',
    'esri/urlUtils',
    'esri/request',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/graphicsUtils',
    'esri/symbols/jsonUtils',
    // 'dgp/model/DGPWMTSLayer',
    // 'dgp/core/MapManager',
    // 'dgp/core/ServiceManager',
    'esri/geometry/geometryEngine',
    // 'dgp/LayerInfos/LayerInfos'
], function (
    arrayUtil,
    lang,
    domClass,
    Deferred,
    graphic,
    ArcGISDynamicMapServiceLayer,
    GraphicsLayer,
    Draw,
    Color,
    Font,
    Polyline,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    SimpleFillSymbol,
    TextSymbol,
    esriLang,
    arcgisUtils,
    PopupTemplate,
    SpatialReference,
    Extent,
    WMTSLayerInfo,
    TileInfo,
    Multipoint,
    Polygon,
    webMercatorUtils,
    GeometryService,
    ProjectParameters,
    FeatureSet,
    PictureMarkerSymbol,
    DynamicLayerInfo,
    LayerDataSource,
    TableDataSource,
    LayerDrawingOptions,
    LabelClass,
    SimpleRenderer,
    UniqueValueRenderer,
    esriUrlUtils,
    esriRequest,
    EsriQuery,
    QueryTask,
    graphicsUtils,
    esriSymJsonUtils,
    // DGPWMTSLayer,
    // MapManager,
    // ServiceManager,
    geometryEngine
    // LayerInfos
    ) {

    var mo = {};


    mo.calDistance = _calDistance;
    mo.calArea = _calArea;
    mo.layerVisibleSetByName = _layerVisibleSetByName;
    mo.featureAction = (function(){
        var result = {};

        //options: {extentFactor}
        result.zoomTo = function(map, arr, /*optional*/ options) {
            if(!options){
                options = {};
            }
            if(!options.hasOwnProperty('extentFactor')){
                options.extentFactor = 1.2;
            }
            if (map && arr && arr.length > 0) {
                var isGeometries = arrayUtil.every(arr, function(a) {
                    return a && a.spatialReference && a.type;
                });
                var isGraphics = arrayUtil.every(arr, function(a) {
                    return a && a.geometry && a.geometry.spatialReference && a.geometry.type;
                });
                if (isGraphics || isGeometries) {
                    if (isGeometries) {
                        arr = arrayUtil.map(arr, function(a) {
                            return {
                                geometry: a
                            };
                        });
                    }

                    if (arr.length === 1 && arr[0].geometry.type === 'point' ) {
                        var levelOrFactor = 15;
                        levelOrFactor = map.getMaxZoom() > -1 ? map.getMaxZoom() : 0.1;
                        map.centerAndZoom(arr[0].geometry, levelOrFactor);
                    } else {
                        var extent = graphicsUtils.graphicsExtent(arr);
                        map.setExtent(extent.expand(options.extentFactor));
                    }
                }
            }
        };

        result.flash = function(graphics, layer) {
            var isGraphics = arrayUtil.every(graphics || [], function(g) {
                return g && g.geometry;
            });
            if (!isGraphics) {
                return;
            }

            var features = graphics;
            var first = features[0];
            var featureSymbols = arrayUtil.map(features, function(f){
                return f.symbol;
            });
            var gurdSymbol = first.symbol ||
                lang.getObject('renderer.symbol', false, layer);
            var cSymbol = null;
            if (layer && layer.geometryType === 'esriGeometryPoint') {
                cSymbol = new PictureMarkerSymbol(require.toUrl('dgp') + '/images/flash.gif', 20, 20);
            } else {
                cSymbol = lang.clone(gurdSymbol);
                if (cSymbol) {
                    if (cSymbol.outline) {
                        cSymbol.outline.setColor("#000000");
                    } else {
                        cSymbol.setColor("#ffc500");
                    }
                }
            }

            function changeSymbol(s, flash) {
                arrayUtil.forEach(features, function(f, idx) {
                    f.setSymbol(flash ? s : featureSymbols[idx] || gurdSymbol);
                });
            }

            function flash(cb) {
                return function() {
                    setTimeout(function() {
                        changeSymbol(cSymbol, true);
                        if (features[0] && layer) {
                            layer.redraw();
                        }
                        setTimeout(function() {
                            changeSymbol(null, false);
                            if (features[0] && layer) {
                                layer.redraw();
                            }
                            cb();
                        }, 200);
                    }, 200);
                };
            }

            if (first && gurdSymbol && cSymbol && layer) {
                if (layer.geometryType === 'esriGeometryPoint') {
                    changeSymbol(cSymbol, true);
                    layer.redraw();
                    setTimeout(function() {
                        changeSymbol(null, false);
                        layer.redraw();
                    }, 2000);
                } else {
                    flash(flash(flash(function() {})))();
                }
            }
        };

        result.panTo = function(map, graphics) {
            var isGraphics = arrayUtil.every(graphics || [], function(g) {
                return g && g.geometry;
            });
            if (!isGraphics) {
                return;
            }

            var center;
            if(graphics.length > 0){
                var extent = graphicsUtils.graphicsExtent(graphics);
                center = extent.getCenter();
            }else{
                var geometry = graphics[0].geometry;
                if(geometry.type === 'polyline' || geometry.type === 'polygon'){
                    center = geometry.getExtent().getCenter();
                }else if(geometry.type === 'extent'){
                    center = geometry.getCenter();
                }else if(geometry.type === 'multipoint'){
                    if(geometry.points.length > 1){
                        center = geometry.getExtent().getCenter();
                    }else{
                        center = geometry.getPoint(0);
                    }
                }else{
                    center = geometry;
                }
            }

            map.centerAt(center);
        };

        result.showPopup = function(map, graphics) {
            var isGraphics = arrayUtil.every(graphics || [], function(g) {
                return g && g.geometry;
            });
            if (!isGraphics) {
                return;
            }

            var popup = map.infoWindow;
            popup.setFeatures(graphics);
            var f = graphics[0];
            if (f.geometry.type === 'point') {
                popup.show(f.geometry, {
                    closetFirst: true
                });
            } else {
                popup.show(f.geometry.getExtent().getCenter(), {
                    closetFirst: true
                });
            }
        };

        return result;
    }());
    mo.setMap = function(map) {
        mo.map = map;
        mo.LayerInfos = LayerInfos.getInstanceSync();
    };

    mo.getLayerIndexInfo = _getLayerIndexInfo;
    // mo.getColorByData = function(data){
    //     // data = [1,2,3,4,5]
    //     var max = Math.max.apply(null, data);
    //     var min = Math.min.apply(null, data);
    //     const result = data.map(v=>{
    //         return getColorByNumber(v-min,max)
    //     })
       
    //     function rgbaToHex(color) {
	//         var values = color
	//           .replace(/rgba?\(/, '')
	//           .replace(/\)/, '')
	//           .replace(/[\s+]/g, '')
	//           .split(',');
	//         var a = parseFloat(values[3] || 1),
	//           r = Math.floor(a * parseInt(values[0]) + (1 - a) * 255),
	//           g = Math.floor(a * parseInt(values[1]) + (1 - a) * 255),
	//           b = Math.floor(a * parseInt(values[2]) + (1 - a) * 255);
	//         return "#" +
	//           ("0" + r.toString(16)).slice(-2) +
	//           ("0" + g.toString(16)).slice(-2) +
	//           ("0" + b.toString(16)).slice(-2);
	//     }
    //     function getColorByNumber(n,max) {
	//     	let halfMax = (max-min) / 2  
	//         var one = 255 / halfMax; 
	//         console.log('one= ' + one)
	//         var r = 0;
	//         var g = 0;
	//         var b = 0;
	//         if (n < halfMax) {
	//           r = one * n;  
	//           g = 255;
	//         }
	//         if (n >= halfMax) {
	//           g = (255 - ((n - halfMax) * one)) < 0 ? 0 : (255 - ((n - halfMax) * one))
	//           r = 255;
	//         }
	//         r = parseInt(r);// 取整
	//         g = parseInt(g);// 取整
	//         b = parseInt(b);// 取整

	//         // console.log(r,g,b)
    //         // return rgbaToHex("rgb(" + r + "," + g + "," + b + ")");
    //         return [r,g,b];
    //     }
    //     return result
    // }
    mo.getColorByData = function(data){
        // data = [1,2,3,4,5]
        var max = Math.max.apply(null, data);
        var min = Math.min.apply(null, data);
        const result = data.map(v=>{
            return getColorByNumber(v-min,max)
        })
        function rgbaToHex(color) {
	        var values = color
	          .replace(/rgba?\(/, '')
	          .replace(/\)/, '')
	          .replace(/[\s+]/g, '')
	          .split(',');
	        var a = parseFloat(values[3] || 1),
	          r = Math.floor(a * parseInt(values[0]) + (1 - a) * 255),
	          g = Math.floor(a * parseInt(values[1]) + (1 - a) * 255),
	          b = Math.floor(a * parseInt(values[2]) + (1 - a) * 255);
	        return "#" +
	          ("0" + r.toString(16)).slice(-2) +
	          ("0" + g.toString(16)).slice(-2) +
	          ("0" + b.toString(16)).slice(-2);
	    }
        function getColorByNumber(n,max) {
	    	let halfMax = (max-min)? (max-min):1
	        var one = 200 / halfMax; 
	        console.log('one= ' + one)
	        var r = 0;
	        var g = 0;
	        var b = 0;
	        if (n <= halfMax) {
              b = 200 - (one * n);  
	          g = 200 - (one * n);  
	          r = 255;
	        }
	        if (n > halfMax) {
              g = (135 - ((n - halfMax) * one)) < 0 ? 0 : (135 - ((n - halfMax) * one))
              b = (135 - ((n - halfMax) * one)) < 0 ? 0 : (135 - ((n - halfMax) * one))
	          r = 135;
	        }
	        r = parseInt(r);
	        g = parseInt(g);
	        b = parseInt(b);
            // return rgbaToHex("rgb(" + r + "," + g + "," + b + ")");
            return [r,g,b];
        }
        return result
    }

    mo.getDefaultMarkerSymbol = function(){
        var args = {
            "style": "esriSMSCircle",
            "color": [0, 0, 128, 128],
            "name": "Circle",
            "outline": {
                "color": [0, 0, 128, 255],
                "width": 1
            },
            "type": "esriSMS",
            "size": 18
        };
        return esriSymJsonUtils.fromJson(args);
    };

    mo.getDefaultLineSymbol = function(){
        var args = {
            "tags": ["solid"],
            "title": "Blue Thin",
            "style": "esriSLSSolid",
            "color": [79, 129, 189, 255],
            "width": 3,
            "name": "Blue 1",
            "type": "esriSLS"
        };
        return esriSymJsonUtils.fromJson(args);
    };

    mo.getDefaultFillSymbol = function(){
        var args = {
            "tags": ["opaque"],
            "title": "Blue",
            "style": "esriSFSSolid",
            "color": [79, 129, 189, 255],
            "name": "Blue 6",
            "type": "esriSFS",
            "outline": {
                "style": "esriSLSSolid",
                "color": [255,255,255, 255],
                "width": 0.5,
                "type": "esriSLS"
            }
        };
        return esriSymJsonUtils.fromJson(args);
    };
    mo.getFillOnlyOutLineSymbol = function(){
        var args = {
            "tags": ["opaque"],
            "title": "Blue",
            "style": "esriSFSSolid",
            "color": [79, 129, 189, 0],
            "name": "Blue 6",
            "type": "esriSFS",
            "outline": {
                "style": "esriSLSSolid",
                "color": [39, 152, 215, 255],
                "width": 1.5,
                "type": "esriSLS"
            }
        };
        return esriSymJsonUtils.fromJson(args);
    };

    mo.createWMTSOptions = _createWMTSOptions;

    mo.cadLoader = (function(){
        var result = {};
        result.uploadCADFile = function (file) {
            var formData = new FormData();
            var obj = {
                "type": 'cad'
            };
            formData.append("properties", JSON.stringify(obj));
            console.log(JSON.stringify(obj));
            formData.append('file_0', file);
            console.log(file);
            return ServiceManager.uploadCADFile(formData);
        }

        result.createFeatureClass = function (fileName, soeUrl) {
            return ServiceManager.parseCADFile(fileName, soeUrl);
            // return ServiceManager.testA();
        };

        result.formatFeatureClass = function (featureClass) {
            for (var key in featureClass) {
                if (key.indexOf("Annotation") >= 0) {
                    var _Annotation = key;
                } else if (key.indexOf("MultiPatch") >= 0) {
                    var _Multipatch = key;
                } else if (key.indexOf("Point") >= 0) {
                    var _Point = key;
                } else if (key.indexOf("Polygon") >= 0) {
                    var _Polygon = key;
                } else if (key.indexOf("Polyline") >= 0) {
                    var _Polyline = key;
                }
            }
            var _tempSOEArray = [];
            if (_Annotation != null && _Annotation != "")
                _tempSOEArray.push({ key: _Annotation, label: "Annotation", renderer: featureClass[_Annotation] });
            if (_Point != null && _Point != "")
                _tempSOEArray.push({ key: _Point, label: "Point", renderer: featureClass[_Point] });
            if (_Multipatch != null && _Multipatch != "")
                _tempSOEArray.push({ key: _Multipatch, label: "MultiPatch", renderer: featureClass[_Multipatch] });
            if (_Polygon != null && _Polygon != "")
                _tempSOEArray.push({ key: _Polygon, label: "Polygon", renderer: featureClass[_Polygon] });
            if (_Polyline != null && _Polyline != "")
                _tempSOEArray.push({ key: _Polyline, label: "Polyline", renderer: featureClass[_Polyline] });

            return _tempSOEArray;
        };

        result.renderDynamicLayer = function (dynamicLayer, featuresInfo, workspaceID) {
            var _cadDynamicLayerInfos = dynamicLayer.createDynamicLayerInfosFromLayerInfos(),
                _layerDrawingOptions = [],
                _layerIdArray = [],
                polylineGDBName;
            var relateData = [];

            arrayUtil.forEach(featuresInfo, function (featureInfo) {
                if (featureInfo.renderer !== '') {
                    var featureName = featureInfo.key,
                        cadDynamicLayerInfo = new DynamicLayerInfo(),
                        cadTableDataSource = new TableDataSource(),
                        cadLayerDataSource = new LayerDataSource(),
                        cadLayerDrawingOptionsStr = featureInfo.renderer,
                        cadLayerIndex = _cadDynamicLayerInfos.length,
                        _cadLayerDrawingInfo;

                    cadDynamicLayerInfo.id = cadLayerIndex;
                    cadDynamicLayerInfo.name = featureName;
                    cadDynamicLayerInfo.defaultVisibility = true;

                    cadTableDataSource.workspaceId = workspaceID;
                    cadTableDataSource.dataSourceName = featureName;
                    cadLayerDataSource.dataSource = cadTableDataSource;

                    cadDynamicLayerInfo.source = cadLayerDataSource;
                    relateData.push({'name':featureName, 'id':cadLayerIndex});//图层名与图层ID的关联数据
                    // relateData[featureName] = cadLayerIndex;
                    switch (featureInfo.label) {
                        case 'Point':
                            _cadLayerDrawingInfo = this.getPointDrawingInfo(cadLayerDrawingOptionsStr);
                            break;
                        case 'Polyline':
                            _cadLayerDrawingInfo = this.getPolylineDrawingInfo(cadLayerDrawingOptionsStr);
                            polylineGDBName = featureInfo.key;
                            break;
                        case 'Polygon':
                            _cadLayerDrawingInfo = this.getPolygonDrawingInfo(cadLayerDrawingOptionsStr);
                            break;
                        case 'Annotation':
                            _cadLayerDrawingInfo = this.getPointDrawingInfo(cadLayerDrawingOptionsStr);
                            break;
                        case 'MultiPatch':
                            _cadLayerDrawingInfo = this.getMultiPatchDrawingInfo(cadLayerDrawingOptionsStr);
                            break;
                    }
                    _layerIdArray.push(cadLayerIndex);
                    _cadDynamicLayerInfos.push(cadDynamicLayerInfo);
                    _layerDrawingOptions[cadLayerIndex] = _cadLayerDrawingInfo;
                }
            }, this);

            dynamicLayer.setDynamicLayerInfos(_cadDynamicLayerInfos, true);
            dynamicLayer.setLayerDrawingOptions(_layerDrawingOptions);
            dynamicLayer.setVisibleLayers(_layerIdArray);


            var cadFileInfo = {
                "fileInfo": featuresInfo,
                "layerIds": _layerIdArray,
                "cadMapService": dynamicLayer,
                "dynamicLayerInfo": _cadDynamicLayerInfos,
                "layerDrawingOption": _layerDrawingOptions,
                "polylineName": polylineGDBName,
                "relateData":relateData,
            }
            console.log(cadFileInfo);
            return cadFileInfo;
        };

        result.getPointDrawingInfo = function (renderStr) {
            var layerDrawingOptions = new LayerDrawingOptions();
            if (renderStr === '')
                return layerDrawingOptions;
            renderStr = renderStr.replace(/\s/g, "");

            var testJson = this.transferToLowerCase(renderStr, 2);
            layerDrawingOptions.transparency = testJson.transparency;
            layerDrawingOptions.showLabels = true;
            layerDrawingOptions.scaleSymbols = true;


            var labelClassJson = testJson.labelingInfo;
            var textSysJson = labelClassJson.symbol;

            var fontAttr = {
                "family": textSysJson.fontFamily === undefined ? '' : textSysJson.fontFamily,
                "size": textSysJson.size,
                "style": textSysJson.fontStyle === undefined ? '' : textSysJson.fontStyle,
                "weight": textSysJson.fontWeight === undefined ? '' : textSysJson.fontWeight,
                "decoration": textSysJson.fontDecoration === undefined ? '' : textSysJson.fontDecoration
            };

            for (var k in textSysJson) {
                if (k.indexOf('font') !== -1 || k.indexOf('size') !== -1) {
                    delete textSysJson[k];
                }
            }
            textSysJson.font = fontAttr;

            labelClassJson.symbol = textSysJson;
            labelClassJson.maxScale = labelClassJson['max.Scale'];
            labelClassJson.minScale = labelClassJson['min.Scale'];
            var lc = new LabelClass(labelClassJson);
            layerDrawingOptions.labelingInfo = [lc];


            var testSimRenderer = testJson.renderer.simpleRenderer;
            testSimRenderer.symbol.type = "esriSMS";
            var simpleRender = new SimpleRenderer(testSimRenderer);
            layerDrawingOptions.renderer = simpleRender;

            return layerDrawingOptions;
        };
        result.getPolylineDrawingInfo = function (renderer) {
            var layerDrawingOptions = new LayerDrawingOptions();
            if (renderer === "")
                return layerDrawingOptions;
            renderer = renderer.replace(/\s/g, "");

            var testJson = this.transferToLowerCase(renderer, 2);
            var testUniqueJson = testJson.renderer.uniqueValueRenderer;
            for (var i in testUniqueJson) {
                testUniqueJson[i] = testUniqueJson[i] === 'null' ? null : testUniqueJson[i];
            }
            testUniqueJson.defaultSymbol.type = "esriSLS";
            if (testUniqueJson.uniqueValueInfos.length > 0) {
                arrayUtil.forEach(testUniqueJson.uniqueValueInfos, lang.hitch(this, function (item) {
                    item.symbol.type = "esriSLS";
                }))
            }

            var testUniqueRenderer = new UniqueValueRenderer(testUniqueJson);
            layerDrawingOptions.transparency = testJson.transparency;
            layerDrawingOptions.labelingInfo = testJson.labelingInfo;
            layerDrawingOptions.renderer = testUniqueRenderer;

            return layerDrawingOptions;
        };
        result.getPolygonDrawingInfo = function (renderer) {
            var layerDrawingOptions = new LayerDrawingOptions();
            if (renderer === "")
                return layerDrawingOptions;
            renderer = renderer.replace(/\s/g, "");
            var drawingOptionsObj = JSON.parse(renderer);
            layerDrawingOptions.transparency = drawingOptionsObj.Transparency;
            layerDrawingOptions.labelingInfo = drawingOptionsObj.LabelingInfo;

            var uniqueRendererObj = drawingOptionsObj.Renderer["UniqueValueRenderer"];
            var uniqueRenderer = new UniqueValueRenderer();

            uniqueRenderer.attributeField = uniqueRendererObj["Field1"];
            uniqueRenderer.attributeField2 = uniqueRendererObj["Field2"] === 'null' ? null : uniqueRendererObj["Field2"];
            uniqueRenderer.attributeField3 = uniqueRendererObj["Field3"] === 'null' ? null : uniqueRendererObj["Field3"];
            uniqueRenderer.fieldDelimiter = uniqueRendererObj["FieldDelimiter"];

            var defaultSymbolObj = uniqueRendererObj["DefaultSymbol"];
            var _style = defaultSymbolObj.Style;
            var _color = new Color(defaultSymbolObj.Color);
            var _outLine = new SimpleLineSymbol(defaultSymbolObj.Outline)
            uniqueRenderer.defaultSymbol = new SimpleFillSymbol(_style, _outLine, _color);

            var valuesArray = uniqueRendererObj["UniqueValueInfos"];
            if (valuesArray.length > 0) {
                arrayUtil.forEach(valuesArray, lang.hitch(this, function (item) {
                    var outRender = new SimpleLineSymbol(item.Symbol);
                    var sym = new SimpleFillSymbol(item.Symbol.Style, outRender, new Color(item.Symbol.Color));
                    uniqueRenderer.addValue({
                        value: item.Value,
                        symbol: sym,
                        label: item.Label,
                        description: item.Description
                    });
                }));
            }
            layerDrawingOptions.renderer = uniqueRenderer;
            return layerDrawingOptions;
        };

        result.getMultiPatchDrawingInfo = function (renderStr) {
            var layerDrawingOptions = new LayerDrawingOptions();
            layerDrawingOptions.transparency = 0;
            return layerDrawingOptions;
        };
        result._formatString = function (string) {
            var string = string.toString().trimComplate();
            var camelStrArr = [];
            arrayUtil.forEach(string.split('"'), function (word) {
                word = word.toCamelCase();
                camelStrArr.push(word);
            }, this);
            string = camelStrArr.join('"');
            return string;
        }
        result.transferToLowerCase = function (string, index) {
            var separateStr = string.split('"');
            separateStr.forEach(lang.hitch(this, function (item, idx) {
                if (item.length >= index) {
                    separateStr[idx] = item.slice(0, index).toLowerCase() + item.slice(index);
                }
            }));
            var newStr = separateStr.join('"');
            return JSON.parse(newStr);
        }
        result.getExtentAndLocate = function (map, url, dataSourceName, workspaceID) {
            var layer =
                {
                    "source": {
                        "type": "dataLayer",
                        "dataSource": {
                            "workspaceId": workspaceID,
                            "dataSourceName": dataSourceName,
                            "type": "table"
                        }
                    }
                };
            var def = new Deferred();
            ServiceManager.getDynamicLayer(layer, url).then(function (response) {
                console.log(response);
                var responseExt = response.extent;
                var newExtent = new Extent(responseExt.xmin, responseExt.ymin, responseExt.xmax, responseExt.ymax, new SpatialReference(map.extent.spatialReference));
                map.setExtent(newExtent.expand(2));
                def.resolve(newExtent);
            },function(err){
                def.reject(err);
            })
            return def
        }
        return result;
    }());

    mo.shpLoader = (function () {
        var result = {};
        result.uploadSHPFile = function (files) {
            var formData = new FormData();
            var obj = {
                "type": 'shp'
            };
            formData.append("properties", JSON.stringify(obj));
            for (var i = 0; i < files.length; i++) {
                formData.append('file_' + i, files[i])
            }
            return ServiceManager.uploadCADFile(formData);
        }
        result.getSimpleRenderer = function ( ) {

            //定义线符号
            var lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255, 0, 0]), 3);
            //定义面符号
            var fillSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, lineSymbol, new Color([79, 129, 189, 0.2]));

            var renderer = new SimpleRenderer(fillSymbol);
            return renderer;

        }
        result.getSHPDatasource = function (shpFileName, workspaceID) {
            var shpTableDataSource = new TableDataSource();
            shpTableDataSource.workspaceId = workspaceID;
            shpTableDataSource.dataSourceName = shpFileName;

            var shpLayerDataSource = new LayerDataSource();
            shpLayerDataSource.dataSource = shpTableDataSource;
            return shpLayerDataSource;
        }
        result.getExtentAndLocateShp = function (map,layer) {
            var fullExtent = layer.fullExtent;
            map.setExtent(fullExtent.expand(2));
            return fullExtent;
        }

        return result;
    }());
    mo.imageLoader = (function () {
        var result = {};
        result.uploadImageFile = function (files) {
            var formData = new FormData();
            var obj = {
                "type": ''
            };
            formData.append("properties", JSON.stringify(obj));
            for (var i = 0; i < files.length; i++) {
                formData.append('file_' + i, files[i])
            }

            return ServiceManager.uploadCADFile(formData);
        }

        return result;
    }());
    function _getLayerIndexInfo(layerName, serviceName) {
        var LayerInfo = null,
            subLayerInfo = null,
            layerIndex = -1;
        var serviceInfo = this.map.itemInfo.operationalLayers;
        arrayUtil.forEach(serviceInfo, function (serviceinfoItem) {
            if (serviceinfoItem.title === serviceName) {
                LayerInfo = serviceinfoItem;
            }
        }, this);
        if(LayerInfo) {
            var curLayerInfos = LayerInfo.layerObject.layerInfos;
            arrayUtil.forEach(curLayerInfos, function (layerinfoItem) {
                if (layerinfoItem.name === layerName && layerinfoItem.subLayerIds == null) {
                    layerIndex = layerinfoItem.id;
                    subLayerInfo = layerinfoItem;
                }
            }, this);
        }
        return {
            targetService: LayerInfo?LayerInfo.layerObject:null,
            layerIndex: layerIndex,
            subLayerInfo:subLayerInfo
        };
    }

    function _layerVisibleSetByName(layerInfo) {
        var LayerInfo = null;
        arrayUtil.forEach(this.LayerInfos._finalLayerInfos, function (layerinfoItem) {
            if (layerinfoItem.title === layerInfo.serviceName) {
                LayerInfo = layerinfoItem;
            }
        }, this);
        var layerIndex = -2000;
        arrayUtil.forEach(LayerInfo.layerObject.layerInfos, function (finalLayerInfo) {
            if (finalLayerInfo.name === layerInfo.layername && !layerInfo.subLayerIds) {
                layerIndex = finalLayerInfo.id;
            }
        }, this);

        if (layerIndex > -2000) {
            changeLayerVisible(LayerInfo.layerObject, layerIndex, layerInfo.layervisible);
        }
    }

    function changeLayerVisible(dlayer, layerid, layervisible) {
        if (dlayer == null) return;
        if (layerid < 0) return;
        var arrc = dlayer.visibleLayers;
        arrc = dealWithLayerInfos(arrc, dlayer.layerInfos);
        if (arrc == null || (arrc.length == 1 && arrc[0] == -1)) {
            arrc = [];
        }
        if (layervisible) {
            if (!checkLayerId(arrc, layerid)) {
                arrc.push(layerid);
            }
        }
        else {
            if (checkLayerId(arrc, layerid)) {
                arrc = removeLayerId(arrc, layerid);
            }
        }

        dlayer.setVisibleLayers(arrc, false);
    }

    function checkLayerId(arrc, layerid) {
        if (arrc == null) return false;
        for (var i = 0; i < arrc.length; i++) {
            if (arrc[i] == layerid) {
                return true;
            }
        }
        return false;
    }

    function removeLayerId(arrc, layerid) {
        if (arrc == null) return;
        var temp = [];
        for (var i = 0; i < arrc.length; i++) {
            if (arrc[i] != layerid) {
                temp.push(arrc[i]);
            }
        }
        return temp;
    }

    function dealWithLayerInfos(visibleList, layerinfos) {
        var temp = [];
        var hashID = {};
        var filteredList = arrayUtil.filter(visibleList, function(visibleIndex) {
            return visibleIndex >= 0;
        },this);

        arrayUtil.forEach(filteredList, function(visibleIndex) {
            var layerinfo = layerinfos[visibleIndex];
            if(!layerinfo.subLayerIds) {
                if( !hashID[visibleIndex] ){
                    hashID[visibleIndex] = 1;
                    temp.push(visibleIndex);
                }
            }
        } ,this);

        return temp;
    }

    function _createWMTSOptions(WMTSConfig) {
        var fullExtent = new Extent(WMTSConfig.fullExtent);
        var initialExtent = new Extent(WMTSConfig.initialExtent);
        var tileInfo = new TileInfo(WMTSConfig.titleInfo);
        var layerInfo = new WMTSLayerInfo({
            tileInfo: tileInfo,
            fullExtent: fullExtent,
            initialExtent: initialExtent,
            identifier: WMTSConfig.identifier,
            tileMatrixSet: WMTSConfig.tileMatrixSet,
            style: WMTSConfig.style
        });
        layerInfo.format = "tiles";
        var resourceInfo = {
            version: WMTSConfig.version,
            layerInfos: [layerInfo],
            copyright: WMTSConfig.copyright
        };

        var options = {
            serviceMode:WMTSConfig.serviceMode,
            resourceInfo: resourceInfo,
            layerInfo: layerInfo
        };

        return options;
    }
    /**
     * 测量距离
     * @param point1
     * @param point2
     * @param spatialReference
     * @returns {*}
     * @private
     */
    function _calDistance(point1, point2, spatialReference) {
        if(spatialReference.wkid=='4490') {
            var line = new Polyline(4326);//todo
        }else {
            var line = new Polyline(spatialReference);
        }

        line.addPath([point1, point2]);
        if (spatialReference.isWebMercator() || spatialReference.wkid == '4326' || spatialReference.wkid == '4490') {
            return geometryEngine.geodesicLength(line, 'meters');
        } else {
            return geometryEngine.planarLength(line, 'meters')
        }
    }

    /**
     * 测量面积
     * @param polygon
     * @param spatialReference
     * @returns {*}
     * @private
     */
    function _calArea(polygon, spatialReference) {
        if (spatialReference.isWebMercator() || spatialReference.wkid == "4326" ||  spatialReference.wkid == "4490") {
            return geometryEngine.geodesicArea(polygon, "square-meters")
        } else {
            return geometryEngine.planarArea(polygon, "square-meters")
        }
    }

    return mo;
});