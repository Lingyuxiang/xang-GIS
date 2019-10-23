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
	'esri/InfoTemplate',
	'krn/base/BaseWidget',
	'krn/core/MapManager',
	'krn/core/TopicManager',
	'krn/utils/geometryUtils',
	'./tableWidget/tableWidget'
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
			 InfoTemplate,
			 BaseWidget,
			 MapManager,
			 TopicManager,
			 geometryUtils,
			 tableWidget) {
	return declare([BaseWidget], {
		baseClass: 'searchBar-widget',
		_selectedLayers: [],
		_graLayer: null,
		constructor: function (paras) {
			this.topicManager = TopicManager.getInstance();
			this.mapManager = MapManager.getInstance();
		},
		postCreate: function () {
		},
		startup: function () {
			// this._tableWidget = new tableWidget().placeAt(this._tableBox);
			this._initlayerTree();
		},
		_initlayerTree: function(){
			this._layerTree.style.maxHeight = (document.body.clientHeight - 90) + "px";
			this._initLayUI(this._doMyTreeData());
			// this.map.itemInfo.operationalLayers[4].layerObject.setVisibility(true);
			// this.map.itemInfo.operationalLayers[4].layerObject.setVisibleLayers([1]);
			// this.map.addLayer(this.map.itemInfo.operationalLayers[4].layerObject);
		},
		_clearResultBox: function(){
			domCon.empty(this._tableBox);
		},
		 /**
         * 创建或清空GraphicLayer
         * @private
         */
        _createGraLayer: function () {
			this.map.infoWindow.hide();
            if (!this._graLayer) {
                this._graLayer = new GraphicsLayer();
                this.map.addLayer(this._graLayer);
            } else {
                this._graLayer.clear();
            }
        },
		_onItemClick: function(e){

			const target = e.currentTarget;
			const targetInfo = this.item;
			const geometry = targetInfo.feature.geometry;
			const attributes = targetInfo.feature.attributes;
			let geoTpe,symbolParam;
			switch(targetInfo.geometryType){
				case "esriGeometryPolyline": 
					geoTpe="polyline";
					symbolParam=geometryUtils.getDefaultLineSymbol();
					break;
				case "esriGeometryPolygon":
					geoTpe="polygon";
					symbolParam=geometryUtils.getDefaultFillSymbol();
					break;
				case "esriGeometryPoint":
					geoTpe="point";
					symbolParam=geometryUtils.getDefaultMarkerSymbol();
					break;
			}
			this._this._createGraLayer();

			const graphic = new Graphic();

			//console.log(symbolParam);
			switch (geoTpe) {
				case "point":
					geometryType = new Point(geometry);
					if (symbolParam.url) {
						symbolType = new PictureMarkerSymbol(symbolParam);
					} else if (symbolParam.type === 'textsymbol') {
						symbolType = new TextSymbol(symbolParam);
					} else {
						symbolType = new SimpleMarkerSymbol(symbolParam);
						symbolType.setStyle(symbolParam.style);
					}
					break;
				case "extent":
					geometryType = new Extent(geometry);
					symbolType = new SimpleFillSymbol(symbolParam);
					symbolType.setStyle(symbolParam.style);
					break;
				case "polyline":
					geometryType = new Polyline(geometry);
					symbolType = new SimpleLineSymbol(symbolParam);
					break;
				case "polygon":
					geometryType = new Polygon(geometry);
					symbolType = new SimpleFillSymbol(symbolParam);  //直接使用报错原因：实例化时style变成了空
					symbolType.setStyle(symbolParam.style);   //补全缺失的参数值
					break;
				case "multipoint":
					geometryType = new Multipoint(geometry);
					var lineSym = new SimpleLineSymbol(symbolParam.outline.style,
						new Color([symbolParam.outline.color.r, symbolParam.outline.color.g, symbolParam.outline.color.b,
							symbolParam.outline.color.a]), symbolParam.outline.width);
					symbolType = new SimpleMarkerSymbol(symbolParam.style, symbolParam.size, lineSym,
						new Color([symbolParam.color.r, symbolParam.color.g, symbolParam.color.b, symbolParam.color.a]));
					break;
			}
			graphic.geometry = geometryType;
			graphic.symbol = symbolType;
			// graphic.infoTemplate = new InfoTemplate("Vernal Pool Locations","Latitude: ${Ycoord} <br/>Longitude: ${Xcoord} <br/>Plant Name:${Plant}");
			graphic.attributes = attributes;
			var infoTemplate = new InfoTemplate("Attributes","<b>STREET_NO</b> : ${STREET_NO}<br><b>SHAPE</b>:${SHAPE}");
			this._this._graLayer.setInfoTemplate(infoTemplate);

			this._this._graLayer.add(graphic);
			if(geoTpe == "point"){
				this._this.map.centerAndZoom(graphic.geometry,8);
			}else{
				this._this.map.setExtent(graphic.geometry.getExtent().expand(2));
			}
			

			console.log(this.item);
		},
		_renderResultBox: function(results){
			this._clearResultBox();
			if(results.length == 0){
				this._createGraLayer();
				layer.msg('没有查询到相关结果',{time: 1000});

				return
			}
			results.forEach((item,index)=>{
				var itemBox = domCon.create('div',{
					class:"search-result-box"
				},this._tableBox)

				on(itemBox,'click',lang.hitch({item,_this:this},this._onItemClick))

				domCon.create('span',{
					class:"search-result-id",
					innerHTML: index + 1 + '.'
				},itemBox)
				domCon.create('span',{
					class:"search-result-text",
					innerHTML: item.foundFieldName + ': ' + item.feature.attributes[item.foundFieldName]
				},itemBox)
			})
			this._showResultBox();
		},
		_showResultBox: function(){
			this._tableBox.style.display = "block";
		},
		_doMyTreeData: function(){
			var treeData = [];
			this.config.searchLayer.forEach(function(item){
				treeData.push({
					title: item.id + '. '+item.name,
					id: item.id,
					guid: item.guid,
					url: item.url,
					searchFields: item.searchFields,
					searchLayers: item.searchLayers
				})
			})
			return treeData
		},
		_openSelect: function(e){
			if(this._searchTree.style.display == "block"){
				this._searchTree.style.display = "none";
				this._searchIcon.innerHTML = "&#xe61a";
			}else{
				this._searchTree.style.display = "block";
				this._searchIcon.innerHTML = "&#xe61c";
			}
		},
		_onLayerTreeCheck: function(obj){
			console.log(obj);
			var opertion = obj.checked?"open":"close";
		},
		/**
		 * Find查询
		 * @param MapServer {String} url
		 * @param layerIds  {Array} 图层ID
		 * @param searchFields {Array} 查询字段
		 * @param searchText {String} 搜索值
		 */
		_generalFindTask: function(MapServer,layerIds,searchFields,searchText,showField ){
			var def = new Deferred();
			 var findTask = new FindTask(MapServer);
			 var findParams = new FindParameters();
			 findParams.returnGeometry = true;
			 findParams.layerIds = layerIds;
			 if(searchFields){
				findParams.searchFields = searchFields;
			 }
	
			 findParams.searchText = searchText;
			 findTask.execute(findParams,_ShowFindResult);

			 function _ShowFindResult (result) {

				console.log(result)
				def.resolve({result: result,layerUrl: MapServer,showField: showField});
			 }
			 return def
		},
		// _ShowFindResult: function(result){
		// 	console.log(result);
		// }, 
		_executeFindtask: function(data){
			var defs = []

			this._selectedLayers.forEach(lang.hitch(this,function(obj){
				// var layer = this.mapManager.map.getLayer(obj.data.guid);
				var layer = this.topicManager.getTopicById(obj.guid).layerObj;
				if(layer){
					var childLayer = layer.layerInfos;
					var layerIdS = obj.searchLayers;
					var searchFields = obj.searchFields;
					var searchText = data.SearchText;
					if(layerIdS == "*"){
						layerIdS = [];
						childLayer.forEach(function(childLayeritem){
							layerIdS.push(childLayeritem.id)
						})
					}
					defs.push(this._generalFindTask(layer.url,layerIdS,searchFields,searchText))
				}
			}))
			all(defs).then(lang.hitch(this,function(results){
				var allResult = [];
				results.forEach((item,index)=>{
					allResult = allResult.concat(item.result);
				})
				this._renderResultBox(allResult);
			}))
		},
		_selectedLayerControl: function(obj,checked){
			if(checked){
				this._selectedLayers.push(obj.data);
			}else{
				this._selectedLayers.forEach(lang.hitch(this,function(layer,index){
					if(layer.id == obj.data.id){
						this._selectedLayers.splice(index,1);
					}
				}))
			}

		},
		_onMouseFocus: function(){
			this._tableBox.style.display = "block";
		},
		_onblur: function(){
			this._tableBox.style.display = "none";
		},
		_onMouseOut: function(e,handler){
			if (!e) e = window.event;
			var reltg = e.relatedTarget ? e.relatedTarget : e.toElement;
			while (reltg && reltg != e.currentTarget) reltg = reltg.parentNode;
			if (reltg !=  e.currentTarget) {
				// 这里可以编写 onmouseleave 事件的处理代码
				if(this._tableInput != document.activeElement){
					this._tableBox.style.display = "none";
				}
			}
   		},
		_initLayUI: function(treeData){
			var _this = this;
			layui.use(["form",'tree', 'layer', 'util', 'table'], function(){
				var form = layui.form;
				var $ = layui.$,
				tree = layui.tree,
				layer = layui.layer,
				util = layui.util,
				index = 100,
				table = layui.table;
				//监听提交
				form.on('submit(_goSearch)', function(data){
					// layer.alert(JSON.stringify(data.field), {
					// title: '最终的提交信息'
					// })
					_this._executeFindtask(data.field);
					return false;
				});

				// 树xuanran
				tree.render({
					elem: '#layerTree'
					,data: treeData
					,id: 'demoId1'
					,showLine: false //关闭连接线
					,click: function(obj){
					  layer.msg(JSON.stringify(obj.data));
					  console.log(obj);
					}
					,oncheck: function(obj){
						var checkedData = tree.getChecked('demoId1');
						var inputValue = ""
						checkedData.forEach(function(item,index){
							inputValue = inputValue + item.id
							if(index != checkedData.length-1){
								inputValue += ","
							}
						})
						_this._selectLayerID.innerHTML=inputValue;

						_this._selectedLayerControl(obj,obj.checked);
					}
					,operate: function(obj){
					  var type = obj.type;
					  if(type == 'add'){
						//ajax操作，返回key值
						return index++;
					  }else if(type == 'update'){
						console.log(obj.elem.find('.layui-tree-txt').html());
					  }else if(type == 'del'){
						console.log(obj);
					  };
					}
					,showCheckbox: true  //是否显示复选框      
					// ,onlyIconControl: true //是否仅允许节点左侧图标控制展开收缩
					// ,isJump: 0  //点击文案跳转地址
				  });
				  
			});
		}
	});
});