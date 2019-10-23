window.homeLegend={}
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
  "esri/SpatialReference",
  "esri/geometry/Point",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",

  "esri/Color",

  'krn/base/BaseWidget',
  'krn/utils/serverUtils',
  'krn/utils/geometryUtils'
], function (
      declare,
      Map, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer,FeatureLayer,InfoTemplate, ClassBreaksRenderer,UniqueValueRenderer,
      Legend,SpatialReference,Point, SimpleLineSymbol, SimpleFillSymbol,
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
        //var yxlayer = new esri.layers.ArcGISDynamicMapServiceLayer("http://10.13.1.2:6080/arcgis/rest/services/GDHK_SD/GDHK_SD_SUB_REGION/MapServer",{"opacity" : 0.4});
         //_map.addLayer(yxlayer);

          function addPolygon(map,data,symbol){
            //console.log(polylinering)
              var rings = ArrayS2N(data.rings);
              //delete data.rings;
              var polygon = new esri.geometry.Polygon(rings);
              polygon.spatialReference = map.spatialReference
              var polygonGraphic = new esri.Graphic(polygon, symbol);
              polygonGraphic.attributes = data
              
              map.graphics.add(polygonGraphic); 
              
             

        
          }


          homeLegend.drawPolygon = function (data){
         
            var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID);
            symbol.color = data.color
            if(data.lineColor){
              symbol.outline = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color(data.lineColor), data.lineWidth!=null?data.lineWidth:2);
            }
                 
            addPolygon(_map,data,symbol)

          }
          homeLegend.clear = function(){
            _map.graphics.clear()
          }
          homeLegend.setLegend = function(title,legend){
            var titleE = document.getElementById("legend_name");
            titleE.innerHTML = title
            var contentE = document.getElementById("legend_content");
            contentE.innerHTML = ""
            var c = "";
            for (var i = 0; i < legend.length; i++) {
              const e = legend[i];
               c += '<div class="item"><span class="color-block" style="background-color: '+ e.color+'"></span><span>'+e.content+'</span></div>'
              
            }
            contentE.innerHTML = c
          } 
          homeLegend.zoom = function(data){
           
            var graphics = [];
            var keys = Object.keys(data);
              for (var index = 0; index < _map.graphics.graphics.length; index++) {
                var g = _map.graphics.graphics[index];
                var is = true;
                for (var y = 0; y < keys.length; y++) {
                  if (g.attributes[keys[y]] != data[keys[y]]) is = false;
                  
                }
                if(is) {
                  graphics.push(g)
                  
                }
                
              }
              if(graphics.length > 0){
                geometryUtils.featureAction.zoomTo(_map, graphics, { 'extentFactor': 1.3 });
              }
             
          }
          homeLegend.select = function(data){
           
            var graphic = null;
            var keys = Object.keys(data);
              for (var index = 0; index < _map.graphics.graphics.length; index++) {
                var g = _map.graphics.graphics[index];
                var is = true;
                for (var y = 0; y < keys.length; y++) {
                  if (g.attributes[keys[y]] != data[keys[y]]) is = false;
                  
                }
                if(is) {
                  graphic = g
                  
                }
                
              }

              if(graphic != null){
                select(graphic)
              }
             
          }
          homeLegend.selectCallback = null;

          function select(graphic){
            if(_selected){
              _selected.symbol.outline = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color(_selected.attributes.lineColor != null?_selected.attributes.lineColor:[0,0,0,0]), _selected.attributes.lineWidth!=null?_selected.attributes.lineWidth:2);                  
            }
            _map.graphics.remove(graphic)
            graphic.symbol.outline = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([46,24,245,1]), 3);           
            _map.graphics.add(graphic)
            _map.graphics.refresh()
            _selected = graphic
            if(homeLegend.selectCallback != null){
              homeLegend.selectCallback(_selected.attributes)
            }
       
            console.log(_selected)
          }

         
          function ArrayS2N(array){
            for (var i = 0; i < array.length; i++) {
              array[i] = array[i].map(Number);
              
            }
            return array
          }
         
          window.homeLegend.inited = true
          var _selected = null;
          var graphic = null
          dojo.connect(_map.graphics, "onClick", function(e){
           
            for (var i = 0; i < _map.graphics.graphics.length-1; i++) {
              var g = _map.graphics.graphics[i];

              if( g.attributes && g.attributes.type != "region" 
              && g.geometry.contains(e.mapPoint)){
                  graphic = g;
                  break;
              }
            }
          
            if(graphic != null  && graphic.attributes.type != "region" && _selected != graphic){
                  select(graphic)
              }
            

          });

          $('#btn_hideLegend').click(function(){
            $('#legend').css("visibility","hidden")
            $('#btn_showLegend').css("visibility","visible")
          })
          $('#btn_showLegend').click(function(){
            $('#legend').css("visibility","visible")
            $('#btn_showLegend').css("visibility","hidden")
          })
      })
    } 
  });
  }
);
