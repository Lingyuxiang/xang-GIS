/**
 * @file 专题
 * @author  lingyx
 * @version 1.0.0
 * @ignore  created on 2019/9/4
 */
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    // 'dgp/utils/baseUtils',
    'dojo/topic',
    'dojo/Evented',
    'krn/core/MapManager'
    // 'dgp/core/ServiceManager'
], function(
    declare,
    lang,
    arrayUtil,
    // baseUtils,
    topic,
    Evented,
    MapManager
    // ServiceManager
) {
    var clazz = declare([Evented], {
        layers:null,
        uid: null,
        name: null,
        defSql:null, //专题过滤显示 的sql语句
        status: null,
        opacity:null,
        _relatedShadowServices: null,
        constructor: function() {
            // this.inherited(arguments);
            lang.mixin(this, arguments[0]);
            this.mapManager = MapManager.getInstance();
            this.layers = this.orginalData.layers;
            this.layerObj = this.orginalData.layerObject
            this.uid = this.orginalData.id;
            this.name = this.orginalData.name;
            this.opacity = this.opacity || 100;
            this._relatedShadowServices = [];
        },

        _getRelatedShadowServices: function() {
            if(this._relatedShadowServices && this._relatedShadowServices.length !== 0) {
                return this._relatedShadowServices;
            }
            var _shadowServices =[];
            arrayUtil.forEach(this.layers, function(layerInfo) {
                var layer
                if(layerInfo.type === 'dynamic') {
                    layer  = this.mapManager.getShadowLayers(layerInfo.serviceUid + '_shadow_' + layerInfo.layerIndex);
                }else if(layerInfo.type === 'tiled') {
                    layer = this.mapManager.getShadowLayers(layerInfo.serviceUid);
                }
                _shadowServices.push(layer);
            }, this);

            return _shadowServices;
        },

        open: function() {
            this.TopicManager.openTopics([this]);

         },
        close: function() {
            this.TopicManager.closeTopics([this]);

        },

        setDefinitions: function(sql) {
            this.defSql = sql;
            this._relatedShadowServices = this._getRelatedShadowServices();
            arrayUtil.forEach( this._relatedShadowServices, function(layer) {
                if(layer.declaredClass === 'esri.layers.ArcGISDynamicMapServiceLayer') {
                    var layerIndex = layer.visibleLayers[0];
                    var layerDefs = layer.layerDefinitions || [];
                    layerDefs[layerIndex] = sql;
                    layer.setLayerDefinitions(layerDefs);
                }
            }, this);
        },

        clearDefinitions: function() {
            this.defSql = null;
            this._relatedShadowServices = this._getRelatedShadowServices();
            arrayUtil.forEach( this._relatedShadowServices, function(layer) {
                if(layer.declaredClass === 'esri.layers.ArcGISDynamicMapServiceLayer') {
                    var layerIndex = layer.visibleLayers[0];
                    var layerDefs = layer.layerDefinitions || [];
                    layerDefs[layerIndex] = undefined;//todo
                    layer.setLayerDefinitions(layerDefs);
                }
            }, this);
        },
        favorite: function() {

            this.TopicManager.addToFavoritedTopics(this);
            var data = {
                topicGuid: this.uid,
                topicIcon: this.icon
            }
            return ServiceManager.favoriteTopic(data);
        },
        cancelFavorite: function() {
            this.TopicManager.removeFromFavoritedTopics(this);
            var data = {
                topicGuid: this.uid,
                topicIcon: this.icon
            }
            return ServiceManager.cancelFavoriteTopic(data);

        },
        setOpacity: function(opacity, source) {
            this._relatedShadowServices = this._getRelatedShadowServices();
            arrayUtil.forEach(this._relatedShadowServices, function(shadowService) {
                shadowService.setOpacity(opacity/100)
            }, this);
            this.opacity = opacity/100;
            this.emit(baseUtils.const.event.TOPIC_OPACITY_CHANGE, {opacity:opacity, source:source})
        }
    });
    clazz.getNoSpatialTopic = function(dir, level) {
        return ServiceManager.getNoSpatialTopic(dir, level);
    };
    return clazz;
});