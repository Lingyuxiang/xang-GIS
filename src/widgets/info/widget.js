window.mapInfoPanel={}
define([
  'dojo/_base/declare',
  "esri/map",
  "esri/layers/ArcGISTiledMapServiceLayer",
  "esri/layers/ArcGISDynamicMapServiceLayer",
  "esri/layers/FeatureLayer",
  "esri/InfoTemplate",
  "esri/renderers/ClassBreaksRenderer",
  "esri/renderers/UniqueValueRenderer",
  "esri/dijit/Legend",

  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",

  "esri/Color",

  'krn/base/BaseWidget',
  'krn/utils/serverUtils',
  'krn/utils/geometryUtils'
], function (
      declare,
      Map, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer,FeatureLayer,InfoTemplate, ClassBreaksRenderer,UniqueValueRenderer,
      Legend, SimpleLineSymbol, SimpleFillSymbol,
      Color,
      BaseWidget,
      serverUtils,
      geometryUtils
		) {
	return declare([BaseWidget], {
		baseClass: 'mapclear-widget',
		constructor(){
		},
		postCreate(){
      
    },
    startup(){
      this._init();
    },
    _init(){
      
      var _map = this.map;//地图
      $(function(){
         mapInfoPanel.show = function (data){
            $('#map_info').show()
            if(data)
            mapInfoPanel.set(data)
         }
         mapInfoPanel.hide = function (data){
          $('#map_info').hide()
         }
         mapInfoPanel.isShow = function(){
           return ($('#map_info').css('display') == 'none');
         }
         mapInfoPanel.set = function (data){
          $('#info_content').html('')
          var str = '';
          var keys = Object.keys(data);
          for (var i = 0; i < keys.length; i++) {
            str += '<div class="item"><div class="item-name" title="'+keys[i]+'">'+keys[i]+'</div><div class="item-content"  title="'+data[keys[i]]+'">'+data[keys[i]]+'</div></div>'            
          }
          $('#info_content').html(str)
         }
         $('#btn_hideinfo').click(function(){
           $('#map_info').hide()
         })
      })
    } 
  });
  }
);
