/**
 * @file
 * @author  lingyx
 * @version 1.0.0
 * @ignore  created on 2019/9/3
 */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/topic',
    'dojo/Deferred',
    'krn/model/MapTopic',
    // 'dgp/core/ServiceManager',
    'krn/core/MapManager'
    // 'dgp/utils/baseUtils'
], function (
    declare,
    arrayUtil,
    lang,
    on,
    topic,
    Deferred,
    MapTopic,
    // ServiceManager,
    MapManager
    // baseUtils
    ) {
    var instance = null,
        clazz = declare(null, {

            _opened: null,
            _loaded: null,
            _favorited: null,
            _allTopics: null,
            constructor: function () {
                this._loaded = [];
                this._opened = [];
                this._favorited = [];
                this.mapManager = MapManager.getInstance();

            
                // this._allTopics = window.appInfo.userConfig.map.operationallayers;
                this._allTopics = this.mapManager.map.itemInfo.operationalLayers;
                this._initLoadedTopics(this._allTopics);
            },

            getAllTopics: function () {
                var def = new Deferred();
                if(this._allTopics) {
                    def.resolve(this._allTopics);
                }else {
                    // ServiceManager.getAllTopics(user.getAllTopicData).then(lang.hitch(this, function(response) {
                    //     this._allTopics = response.data[0].appTopicDTO;
                    //     this._initLoadedTopics(this._allTopics);
                    //     def.resolve(this._allTopics);
                    // }));
                }
                return def;
            },

            closeAllTopics: function() {
                var openTopics = [];
                if(this._opened && this._opened.length > 0) {
                    for(var i=0; i<this._opened.length; i++)
                    {
                        openTopics.push(this._opened[i]);
                    }
                }
                //var openTopics = lang.clone(this._opened);
                arrayUtil.forEach(openTopics, function(openedTopic) {
                    openedTopic.close();
                });
                this._opened = [];
            },
            getFavoriteTopics: function(userCode) {
              return ServiceManager.getFavoriteTopics(userCode);
            },
            /**
             *
             * @param userCode --用户code
             * @param guid -- 专题guid
             * @param type --类型 1:逐级 2:所有
             * @returns {*}
             */
            getChildTopic: function (userCode, guid, type) {
                return ServiceManager.getChildTopic(userCode, guid, type);
            },

            _initLoadedTopics: function(topicInfos) {
                arrayUtil.forEach(topicInfos, function(topicInfo) {
                    if (!!Number(topicInfo.isGroup)) {
                        this._initLoadedTopics(topicInfo.childTopic);
                    }else {
                        var relatedTopic = new MapTopic({orginalData:topicInfo,TopicManager:this});
                        this.addToLoadedTopics(relatedTopic);
                    }
                }, this);
            },

            addToLoadedTopics: function (topicItem) {
                var found = false;
                arrayUtil.forEach(this._loaded, function (loadedTopic, index) {
                    if (loadedTopic.uid === topicItem.uid) {
                        this._loaded[index] = topicItem;
                        found = true;
                    }
                }, this);
                if (!found) {
                    this._loaded.push(topicItem);
                }

            },

   
            openTopics: function (topics) {

                var layers = [];
                var dynamicLayers = [];
                var tiledServices = [];
                var hasTiledService = {};
                arrayUtil.forEach(topics, function (topicItem) {
                    if(topicItem.status != 1){
                        topicItem.emit(baseUtils.const.event.TOPIC_OPEN);
                        topic.publish(baseUtils.const.topic.TOPIC_OPEN, topicItem);
                        topicItem.status = 1;
                        layers = layers.concat(topicItem.layers);
                    }
                }, this);

                arrayUtil.forEach(layers, function(layerItem) {
                    if(layerItem.type === 'dynamic') {
                        dynamicLayers.push(layerItem);
                    }else if(layerItem.type === 'tiled') {
                        if(!hasTiledService[layerItem.serviceUid]){
                            tiledServices.push(layerItem.serviceUid);
                            hasTiledService[layerItem.serviceUid] = true;
                        }
                    }
                }, this);
                var hasDynamicService = {};
                //todo
                arrayUtil.forEach(dynamicLayers, function (layerItem) {
                    if (layerItem.layerIndex!== 'undefined'&& layerItem.layerIndex !== null) {
                        if (hasDynamicService[layerItem.serviceUid]) {
                            hasDynamicService[layerItem.serviceUid].visibleLayers.push(layerItem.layerIndex);
                        } else {
                            hasDynamicService[layerItem.serviceUid] = {
                                visibleLayers: [layerItem.layerIndex]
                            };
                        }
                    }
                }, this);
                var changedInfos = [];
                Object.keys(hasDynamicService).forEach(function (serviceUid) {
                    var visibleLayerIndexes = hasDynamicService[serviceUid].visibleLayers;
                    visibleLayerIndexes.reverse();
                    var changedInfo = {
                        id:serviceUid,
                        visibleLayers:[]
                    }
                    changedInfos.push(changedInfo);
                    arrayUtil.forEach(visibleLayerIndexes, function(visibleIndex) {
                        changedInfo.visibleLayers.push(visibleIndex);
                        var layer = this.mapManager.getShadowLayers(serviceUid+'_shadow_'+ visibleIndex);
                        if(!layer.hasLoaded){
                            this.mapManager.map.addLayer(layer);

                            on(layer, 'update-start', lang.hitch(this, function (evt) {
                                // 强行修改layerDefs参数为JSON格式 eg:{"1":"XMMC='张江润和'"}
                                if(evt.target._params.hasOwnProperty('layerDefs') === true && evt.target._params.layerDefs !== null) {
                                    if(evt.target._params.layerDefs.charAt(0) !='{') {
                                        evt.target._params.layerDefs = evt.target._params.layerDefs.split(':').join(':"').split(';').join('",') + '"';
                                        evt.target._params.layerDefs = '{' + evt.target._params.layerDefs + '}';
                                    }
                                }
                            }));
                        }
                        layer.setVisibility(true);
                        this.mapManager.map.reorderLayer(layer,this.mapManager.map.layerIds.length -1);
                    },this);

                }, this);
                arrayUtil.forEach(tiledServices, function(serviceUid) {
                    var layer = this.mapManager.getShadowLayers(serviceUid);
                    if(!layer.hasLoaded){
                        this.mapManager.map.addLayer(layer);
                    }
                    layer.setVisibility(true);
                    var changedInfo = {
                        id:serviceUid
                    };
                    changedInfos.push(changedInfo);
                    this.mapManager.map.reorderLayer(layer,this.mapManager.map.layerIds.length -1);
                },this);
                topic.publish(baseUtils.const.topic.LAYERINFOS_VISIBLELAYERS_CHANGE,{operation:'add',info:changedInfos});
                this.addToOpenedTopics(topics);

                topic.publish(baseUtils.const.topic.TOPIC_CHANGE);
            },
    
            closeTopics: function (topics) {
                var layers = [];
                var dynamicLayers = [];
                var tiledServices = [];
                var hasTiledService = {};

                arrayUtil.forEach(topics, function (topicItem) {
                    if(topicItem.status != 0){
                        topicItem.emit(baseUtils.const.event.TOPIC_CLOSE);
                        topic.publish(baseUtils.const.topic.TOPIC_CLOSE, topicItem);
                        topicItem.status = 0;
                        layers = layers.concat(topicItem.layers);
                    }

                }, this);

                arrayUtil.forEach(layers, function(layerItem) {
                    if(layerItem.type === 'dynamic') {
                        dynamicLayers.push(layerItem);
                    }else if(layerItem.type === 'tiled') {
                        if(!hasTiledService[layerItem.serviceUid]){
                            tiledServices.push(layerItem.serviceUid);
                            hasTiledService[layerItem.serviceUid] = true;
                        }
                    }
                }, this);
                var hasDynamicService = {};
                //todo
                arrayUtil.forEach(dynamicLayers, function (layerItem) {
                    if (layerItem.layerIndex!== 'undefined'&& layerItem.layerIndex !== null) {
                        if (hasDynamicService[layerItem.serviceUid]) {
                            hasDynamicService[layerItem.serviceUid].hideLayers.push(layerItem.layerIndex);
                        } else {
                            hasDynamicService[layerItem.serviceUid] = {
                                hideLayers: [layerItem.layerIndex]
                            };
                        }
                    }
                }, this);
                var changedInfos = [];
                Object.keys(hasDynamicService).forEach(function (serviceUid) {
                    var hideLayerIndexes = hasDynamicService[serviceUid].hideLayers;
                    var changedInfo = {
                        id:serviceUid,
                        hideLayers:hideLayerIndexes
                    }
                    changedInfos.push(changedInfo);
                    arrayUtil.forEach(hideLayerIndexes, function(hideIndex) {
                        var layer = this.mapManager.getShadowLayers(serviceUid+'_shadow_'+ hideIndex);
                        layer.setVisibility(false);

                    },this);
                }, this);

                arrayUtil.forEach(tiledServices, function(serviceUid) {
                    var layer = this.mapManager.getShadowLayers(serviceUid);
                    layer.setVisibility(false);
                    var changedInfo = {
                        id:serviceUid
                    };
                    changedInfos.push(changedInfo);
                },this);
                topic.publish(baseUtils.const.topic.LAYERINFOS_VISIBLELAYERS_CHANGE,{operation:'remove',info:changedInfos});
                this.removeFromOpenedTopics(topics);

                topic.publish(baseUtils.const.topic.TOPIC_CHANGE);
            },
            setLayerVisible: function(layer,visibleLayers,option){
                var currentVisibleId = layer.visibleLayers;
                var newVisibledId;
                if(option == "open"){
                    newVisibledId = this.unique(currentVisibleId.concat(visibleLayers));
                }else if(option == "close"){
                    var deleteIndex;
                    visibleLayers.forEach(function(item){
                        deleteIndex = currentVisibleId.indexOf(item);
                        if(deleteIndex != -1){
                            currentVisibleId.splice(deleteIndex,1)
                            newVisibledId = currentVisibleId;
                        }
                    })
                    
                    // var index = currentVisibleId.indexOf(visibleLayers);
                    // if(index > -1){
                    //     newVisibledId = currentVisibleId.splice(index,index+1)
                    // }
                }
                // if(newVisibledId == undefined){
                //     layer.setVisibleLayers([]);
                // }else{
                    layer.setVisibleLayers(newVisibledId);
                // }
                return layer
            },
            unique: function(arr){      
                for(var i=0; i<arr.length; i++){
                    for(var j=i+1; j<arr.length; j++){
                        if(arr[i]==arr[j]){         //第一个等同于第二个，splice方法删除第二个
                            arr.splice(j,1);
                            j--;
                        }
                    }
                }
                return arr;
            },
            setTiledVisibleLayers: function(topicId,option){
                function setVisible (layer,option){
                    if(option == "open"){
                        layer.setVisibility(true);
                    }else if (option == "close"){
                        layer.setVisibility(false);
                    }
                }
                var currentTopic = this.getTopicById(topicId);
                var layer = this.mapManager.map.getLayer(topicId);
                if(layer){
                    setVisible(layer,option);
                }else{
                    var _this = this;
                    var operationalLayers = this.mapManager.map.itemInfo.operationalLayers;
                    operationalLayers.forEach(lang.hitch(this,function(layer,index){
                        if(layer.id == topicId){
                            // this.setLayerVisible(layer.layerObject,visibleLayers,option);
                            this.mapManager.map.addLayer(layer.layerObject);
                            setVisible(layer.layerObject,option);
                            return
                        }
                    }))
                }
            },
            setDynamicVisibleLayers: function(topicId,visibleLayers,option){
                var currentTopic = this.getTopicById(topicId);
                var layer = this.mapManager.map.getLayer(topicId);
                if(layer){
                    this.setLayerVisible(layer,visibleLayers,option);
                    // this.mapManager.map.addLayer(layer.layerObject);
                }else{
                    // console.log(this.mapManager.map);
                    var _this = this;
                    var operationalLayers = this.mapManager.map.itemInfo.operationalLayers;
                    operationalLayers.forEach(lang.hitch(this,function(layer,index){
                        if(layer.id == topicId){
                            this.setLayerVisible(layer.layerObject,visibleLayers,option);
                            this.mapManager.map.addLayer(layer.layerObject);
                            return
                        }
                    }))
                }
            },

      
            openTopicsById: function(ids) {
                var topics = [];
                arrayUtil.forEach(ids, function(id) {
                    var topic = this.getTopicById(id);
                    topics.push(topic);
                }, this);
                this.openTopics(topics);
            },
     
            closeTopicsById: function(ids) {
                var topics = [];
                arrayUtil.forEach(ids, function(id) {
                    var topic = this.getTopicById(id);
                    topics.push(topic);
                }, this);
                 this.closeTopics(topics);
            },
     
            addToOpenedTopics: function (topicItems) {
                var found = false;
                arrayUtil.forEach(topicItems, function (topicItem) {
                    found = false;
                    arrayUtil.forEach(this._opened, function (openedTopic, index) {
                        if (openedTopic.uid === topicItem.uid) {
                            this._opened[index] = topicItem;
                            found = true;
                        }
                    }, this);
                    if (!found) {
                        this._opened.push(topicItem);
                    }
                },this);

                // arrayUtil.forEach(topicItems, function(topicItem){
                //     // 记录专题日志
                //     var syslog = {
                //         'category': '专题访问',
                //         'eventName': topicItem.name
                //     };
                //     ServiceManager.recordSystemLog(syslog).then(lang.hitch(this, function(result) {

                //     }));
                // });
            },
        
            removeFromOpenedTopics: function (topicItems) {
                var deleteArray = [];
                arrayUtil.forEach(topicItems, function (topicItem) {
                    arrayUtil.forEach(this._opened,function(openItem, index){
                        if(openItem.uid == topicItem.uid){
                            this._opened[index].readyDelete = true;
                        }else{
                            this._opened[index].readyDelete = false;
                        }
                    },this)
/*                    return arrayUtil.some(this._opened, function (w, i) {
                        if (w.uid === topicItem.uid) {
                            this._opened[i].readyDelete = true;
                        }
                    }, this);*/
                }, this);

                var newOpened = [];
                arrayUtil.forEach(this._opened, function(item,index){
                    if(!item.readyDelete){
                        newOpened.push(this._opened[index]);
                    }
                },this);
                this._opened = newOpened;


        /*        var len = this._opened.length-1;
                for(var i = len ; i>=0; i--){
                    if(this._opened[i].readyDelete){
                        this._opened.splice(i, 1);
                    }
                }*/
            },

            addToFavoritedTopics: function (topicItem) {
                var found = false;
                arrayUtil.forEach(this._favorited, function (favoritedTopic, index) {
                    if (favoritedTopic.uid === topicItem.uid) {
                        this._favorited[index] = topicItem;
                        found = true;
                    }
                }, this);
                if (!found) {
                    this._favorited.push(topicItem);
                }
            },

            removeFromFavoritedTopics: function(topicItem) {
                    return arrayUtil.some(this._favorited, function (w, i) {
                        if (w.uid === topicItem.uid) {
                            this._favorited.splice(i, 1);
                            return true;
                        }
                    }, this);
            },
            getTopicById: function (id) {
                var ret = null;
                arrayUtil.some(this._loaded, function (w) {
                    if (w.uid === id) {
                        ret = w;
                        return true;
                    }
                }, this);
                return ret;
            },
            getTopicsByName: function (name) {
                var ret = [];
                arrayUtil.some(this._loaded, function (w) {
                    if (w.name === name) {
                        ret.push(w);
                    }
                }, this);
                return ret;
            },

            getOpenedTopicById: function (id) {
                var ret = null;
                arrayUtil.some(this._opened, function (w) {
                    if (w.uid === id) {
                        ret = w;
                        return true;
                    }
                }, this);
                return ret;
            },
            getOpenedTopicsByName: function (name) {
                var ret = [];
                arrayUtil.some(this._opened, function (w) {
                    if (w.name === name) {
                        ret.push(w);
                    }
                }, this);
                return ret;
            },
            getOpenedTopics: function () {
                return this._opened;
            }
        });
    clazz.getInstance = function () {
        if (instance === null) {
            instance = new clazz();
        }
        return instance;
    };
    return clazz
});