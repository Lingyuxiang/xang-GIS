/**
 * Created by lingyx on 2019/08/20
 */
define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/json',
	'dojo/on',
	'dojo/topic',
	'dojo/query',
	'dojo/Deferred',
	'dojo/promise/all',
	'dojo/dom-style',
	'dojo/dom-class',
	'dojo/dom-construct',
	'esri/tasks/FindTask',
	'esri/tasks/FindParameters',
	'esri/graphic',
    'esri/layers/GraphicsLayer',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/TextSymbol',
    'esri/symbols/PictureMarkerSymbol',
    'esri/geometry/Extent',
    'esri/geometry/Point',
    'esri/geometry/Polyline',
	'esri/geometry/Polygon',
	'esri/symbols/jsonUtils',
	'esri/InfoTemplate',
	'esri/tasks/IdentifyTask',
    'esri/tasks/IdentifyParameters',
	'krn/base/BaseWidget',
	'krn/core/MapManager',
	'krn/core/TopicManager',
	'krn/utils/geometryUtils'
], function (declare,
             lang,
             array,
             JSON,
             on,
             topic,
             query,
			 Deferred,
			 all,
             domStyle,
             domClass,
			 domCon,
			 FindTask,
			 FindParameters,
			 Graphic,
             GraphicsLayer,
             SimpleFillSymbol,
             SimpleLineSymbol,
             SimpleMarkerSymbol,
             TextSymbol,
             PictureMarkerSymbol,
             Extent,
             Point,
             Polyline,
			 Polygon,
			 jsonUtils,
			 InfoTemplate,
			 IdentifyTask, 
			 IdentifyParameters,
			 BaseWidget,
			 MapManager,
			 TopicManager,
			 geometryUtils
			 ) {
	return declare([BaseWidget], {
		// baseClass: 'searchBar-widget',
		_graLayer: null,
		_numInfo: [],
		_serverType: null,
		constructor(paras) {
			this.topicManager = TopicManager.getInstance();
			this.mapManager = MapManager.getInstance();
		},
		postCreate() {
			try{
				this._serverType =  window.parent._objectType; 
			}catch{
				console.log("未能读取到服务类型");
				return
			}
			 this._bindEven();
			this._initDefaultSymbols();
			this._createGraLayer();
			// this._getRegionInfo();

		},
		startup() {
			this._openSZLayer();
		},
		_bindEven(){
			this.own(
				on(this.map,"click",(e)=>{
					const param = {
						geometry: e.mapPoint,
						MapServer: this.config[this._serverType].serviceUrl,
						layerIds: [0]
					}
					this._generalIdentifyTask(param).then((result)=>{
						this._createGraLayer();
						const currentGra = [] ;
						if(result[0] == undefined){
							return
						}
						const returnID = result[0].feature.attributes[this.config[this._serverType].returnField]

						const param = {
							MapServer: this.config[this._serverType].serviceUrl,
							layerIds: [0],
							searchFields: [this.config[this._serverType].returnField],
							searchText: returnID,
							contains: false
						}
						this._generalFindTask(param).then((result)=>{
							// console.log(result);
							result.forEach((value,index)=>{
								switch (value.feature.geometry.type) {
									case 'point':
										value.feature.setSymbol(this.pointSymbol);
										break;
									case 'polyline':
										value.feature.setSymbol(this.polylineSymbol);
										break;
									case 'polygon':
										value.feature.setSymbol(this.polygonSymbol);
										break;
								}
								currentGra.push(value.feature);
								this._graLayer.add(value.feature);
							})
							geometryUtils.featureAction.flash(currentGra, this._graLayer);
							geometryUtils.featureAction.zoomTo(this.map, currentGra, { 'extentFactor': 3 });
						})
						window.parent.showManagementPop(returnID);
					});
				})
			)
		},
		_initDefaultSymbols () {
            var polygonSys = {
                "style": "esriSFSSolid",
                "color": [79, 129, 189, 128],
                "type": "esriSFS",
                "outline": {
                    "style": "esriSLSSolid",
                    "color": [0, 191, 255, 125],
                    "width": 1.5,
                    "type": "esriSLS"
                }
            };
            var pointSys = {
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
            var lineSys = {
                "style": "esriSLSSolid",
                "color": [79, 129, 189, 255],
                "width": 3,
                "name": "Blue 1",
                "type": "esriSLS"
            };
            if (!this.pointSymbol) {
                this.pointSymbol = jsonUtils.fromJson(pointSys);
            }
            if (!this.polylineSymbol) {
                this.polylineSymbol = jsonUtils.fromJson(lineSys);
            }
            if (!this.polygonSymbol) {
                this.polygonSymbol = jsonUtils.fromJson(polygonSys);
            }
        },
		_openSZLayer(){
			var _this = this;
			layui.use(['tree'], ()=>{
				const tree = layui.tree;
				setCheck();
				function setCheck() {
					try{
						tree.setChecked('demoId2', [_this.config[_this._serverType].topicID])
					}
					catch{
						setTimeout(()=>{
							setCheck();
						},200)
					}
				}
			})
		},
		_getRegionInfo() {
			if(window.parent.szNum.length != 0){
				this._numInfo = window.parent.szNum;
				let searchField = Array.from(new Set(this._numInfo));
				console.log("地图已经拿到数据");
				console.log(searchField);
			}else{
				setTimeout(()=>{
					this._getRegionInfo();
				},500)
			}
		},
		 /**
         * 创建或清空GraphicLayer
         * @private
         */
        _createGraLayer () {
			// this.map.infoWindow.hide();
            if (!this._graLayer) {
                this._graLayer = new GraphicsLayer();
                this.map.addLayer(this._graLayer);
            } else {
                this._graLayer.clear();
            }
		},
		/**
		 * I查询
		 * @param MapServer {String} url
		 * @param geometry {Object} geometry
		 * @param Tolerance {Number} 容差
		 * @param layerIds  {Array} 图层ID
		 */
		_generalIdentifyTask({MapServer,geometry,Tolerance = 1,layerIds,layerOption}){
			var def = new Deferred();
			
			//定义空间查询对象，注意他的参数是整个地图服务，而不是单个图层
			var identifyTask = new IdentifyTask(MapServer);
			//定义空间查询参数对象
			var params = new IdentifyParameters();
			//容差
			params.tolerance = Tolerance;
			//是否返回几何信息
			params.returnGeometry = true;
			//空间查询的图层
			params.layerIds = layerIds;
			//空间查询的条件
			params.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
			params.width = this.map.width;
			params.height = this.map.height;
			//空间查询的几何对象
			params.geometry = geometry;
			params.mapExtent = this.map.extent;
			//执行空间查询
			identifyTask.execute(params, _ShowFindResult);  

			 function _ShowFindResult (result) {
				console.log(result)
				def.resolve(result);
			 }
			 return def
		},
		/**
		 * Find查询
		 * @param MapServer {String} url
		 * @param layerIds  {Array} 图层ID
		 * @param searchFields {Array} 查询字段
		 * @param searchText {String} 搜索值
		 */
		_generalFindTask({MapServer,layerIds,searchFields=null,searchText,contains=true}){
			const findTask = new FindTask(MapServer);
			const findParams = new FindParameters();
			findParams.returnGeometry = true;
			findParams.layerIds = layerIds;
			findParams.contains = contains;
			if(searchFields){
			   findParams.searchFields = searchFields;
			}
			findParams.searchText = searchText;
			const p = new Promise((resolve,reject)=>{
				findTask.execute(findParams,_ShowFindResult);
				function _ShowFindResult (result) {
					resolve(result);
				 }
			})
			return p;





			// var def = new Deferred();
			//  var findTask = new FindTask(MapServer);
			//  var findParams = new FindParameters();
			//  findParams.returnGeometry = true;
			//  findParams.layerIds = layerIds;
			//  if(searchFields){
			// 	findParams.searchFields = searchFields;
			//  }
	
			//  findParams.searchText = searchText;
			//  findTask.execute(findParams,_ShowFindResult);

			//  function _ShowFindResult (result) {

			// 	console.log(result)
			// 	def.resolve({result: result,layerUrl: MapServer,showField: showField});
			//  }
			//  return def
		},
		// _ShowFindResult: function(result){
		// 	console.log(result);
		// }, 
		_executeFindtask: function(data){

		}
	});
});