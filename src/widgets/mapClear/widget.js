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
	'krn/core/TopicManager',
	'dojo/_base/array'
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
			 TopicManager,
			 arrayUtil) {
	return declare([BaseWidget], {
		baseClass: 'mapclear-widget',
		constructor(){
			// this.topicManager = TopicManager.getInstance();
			// this.mapManager = MapManager.getInstance();
		},
		postCreate(){
			// this._clearMap();
		},
        _clearMap(){
			this.map.graphics.clear();
			this.map.infoWindow.hide();
            var graLayerIds = this.map.graphicsLayerIds;
            arrayUtil.forEach(graLayerIds, lang.hitch(this, function(graLayerId) {
                var graLayer = this.map.getLayer(graLayerId);
                if(graLayer)
                {
                    graLayer.clear();
                }
            }), this);

        }
	});
});