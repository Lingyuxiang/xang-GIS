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
	'dojo/dom-style',
	'dojo/dom-class',
	'dojo/dom-construct',
	'krn/base/BaseWidget',
	'krn/core/MapManager',
	'krn/core/TopicManager'
], function (declare,
             lang,
             array,
             JSON,
             on,
             topic,
             query,
             Deferred,
             domStyle,
             domClass,
			 domCon,
			 BaseWidget,
			 MapManager,
			 TopicManager) {
	return declare([BaseWidget], {
		baseClass: 'layerControl-widget',
	
		constructor: function (paras) {
			// this.inherited(arguments);
			this.topicManager = TopicManager.getInstance();
			this.mapManager = MapManager.getInstance();
		},
		postCreate: function () {
			// this.inherited(arguments);
		},
		startup: function () {
			// this.inherited(arguments);
			this._initAllTopic();
			// this._initlayerTree();
		},
		_initAllTopic: function(){
			this.topicManager.getAllTopics().then(this._initlayerTree());
		},
		_initlayerTree: function(){
			this._layerTree.style.maxHeight = (document.body.clientHeight - 90) + "px";
			this._initLayUI(this._doMyTreeData());
			// this.map.itemInfo.operationalLayers[4].layerObject.setVisibility(true);
			// this.map.itemInfo.operationalLayers[4].layerObject.setVisibleLayers([1]);
			// this.map.addLayer(this.map.itemInfo.operationalLayers[4].layerObject);

			console.log(this.map.itemInfo.operationalLayers);
		},
		_doMyTreeData: function(){
			var layerInfo = this.map.itemInfo.operationalLayers;
			var treeData = [];
			layerInfo.forEach(function(item,index){
				var layerItem = {
					level: 1,
					id: item.id,
					parentId: -1,
					title: item.title,
					spread: false,
					type: item.type,
					children: []
				}
				if(layerItem.type === "dynamic" && item._config.controlLay == "*" || Array.isArray(item._config.controlLay)){
					var childLayer = item.layerObject.layerInfos;
					childLayer.forEach(function(childLayeritem){
						if(item._config.controlLay == "*" && childLayeritem.parentLayerId == "-1"){
							var layInfo = {
									id: item.id + "_" + childLayeritem.id,
									parentId: item.id,
									layerId: [childLayeritem.id],
									title: childLayeritem.name,
									level: 2,
									type: item.type
							}
							if(childLayeritem.subLayerIds){
								layInfo.layerId = layInfo.layerId.concat(childLayeritem.subLayerIds);
							}
							layerItem.children.push(layInfo)
						}else if(item._config.controlLay.indexOf(childLayeritem.id) > -1  && childLayeritem.parentLayerId == "-1"){
							var layInfo = {
								id: item.id + "_" + childLayeritem.id,
								parentId: item.id,
								layerId: [childLayeritem.id],
								title: childLayeritem.name,
								level: 2,
								type: item.type
							}
							if(childLayeritem.subLayerIds){
								layInfo.layerId = layInfo.layerId.concat(childLayeritem.subLayerIds);
							}
							layerItem.children.push(layInfo)
						}
					})						
				}else if(layerItem.type === "tiled"){

				}
				treeData.push(layerItem)
			})
			return treeData
		},
		_openLayerControl: function(){
			if(this._layerTree.style.display == 'block'){
				this._layerTree.style.display = 'none';
			}else{
				this._layerTree.style.display = 'block';
			}
			
		},
		_initLayUI: function(treeData){
			var _this = this;
			layui.use(['tree', 'layer', 'util'], function(){
				var $ = layui.$,
				tree = layui.tree,
				layer = layui.layer,
				util = layui.util,
				index = 100;

				// 树xuanran
				tree.render({
					elem: '#layControlTree',
					data: treeData,
					id: 'demoId2',
					showLine: false, //关闭连接线
					click: function(obj){
					  layer.msg(JSON.stringify(obj.data));
					  console.log(obj);
					},
					oncheck: function(obj){
					  _this._onLayerTreeCheck(obj);
					},
					operate: function(obj){
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
		},
		_onLayerTreeCheck: function(obj){
			var opertion = obj.checked?"open":"close";

			if(obj.data.type === "dynamic"){
				if(obj.data.level == 2){
					this.topicManager.setDynamicVisibleLayers(obj.data.parentId,obj.data.layerId,opertion);
				}else if(obj.data.level == 1){
					var topicLayersID = [];
					function getTopicAllLayers (obj){
						obj.forEach(function(item){
							if(item.children){
								getTopicAllLayers(item.children);
							}else{
								topicLayersID = topicLayersID.concat(item.layerId);
							}
						})
					}
					getTopicAllLayers(obj.data.children);
					this.topicManager.setDynamicVisibleLayers(obj.data.id,topicLayersID,opertion);
				}
			}else if(obj.data.type === "tiled"){
				this.topicManager.setTiledVisibleLayers(obj.data.id,opertion);
			}
			
			var region = this.map.getLayer("GDHK_SD_REGION");
			var subRegionLayer = this.map.getLayer("GDHK_SD_SUB_REGION");
			if(subRegionLayer){
				this.map.reorderLayer(subRegionLayer, 1)
			}
			if(region){
				this.map.reorderLayer(region, 1)
			}

		},
		_openOpertion: function(obj){

		},
		_closeOpertion: function(obj){

		},
		_onMouseOut: function(e,handler){
			     if (!e) e = window.event;
			     var reltg = e.relatedTarget ? e.relatedTarget : e.toElement;
			     while (reltg && reltg != e.currentTarget) reltg = reltg.parentNode;
			     if (reltg !=  e.currentTarget) {
			         // 这里可以编写 onmouseleave 事件的处理代码
			         this._layerTree.style.display = "none";
			     }
		}
	});
});