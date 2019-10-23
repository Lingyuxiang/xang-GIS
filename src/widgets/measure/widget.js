define([
  'dojo/_base/declare',
  "esri/map",
  "esri/toolbars/draw",
  "esri/symbols/PictureMarkerSymbol",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/geometry/screenUtils",
  "esri/geometry/Geometry",
  "esri/tasks/GeometryService",
  "esri/tasks/LengthsParameters",
  "esri/tasks/AreasAndLengthsParameters",
  "esri/Color",
  "esri/symbols/TextSymbol",
  "esri/symbols/Font",
  'krn/base/BaseWidget'
], function (
		declare,Map,Draw,PictureMarkerSymbol,SimpleMarkerSymbol,SimpleLineSymbol,SimpleFillSymbol,screenUtils,
		Geometry,GeometryService,LengthsParameters,AreasAndLengthsParameters,Color,TextSymbol,Font,BaseWidget
	){
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
      var map = this.map;//地图
      var coorMeasure,clickMeasure,angleMeasure;//测量
      var isCoormeasure = true;
      var isDistancemeasure = true;
      var isAreameasure = true;
      var isAnglemeasure = true;
      var measureToolbar = new Draw(map); //创建绘图工具
      var ployoverlay,polylineGraphic;
      var tempCoordinate = [];
      var geometryUrl = window.appInfo.userConfig.map.geometryService.url;//获取几何服务url
      var geometryService = new GeometryService(geometryUrl);//创建几何服务
      var font = new Font("12px", Font.STYLE_NORMAL,Font.VARIANT_NORMAL, Font.WEIGHT_NORMAL,"Courier");
      var redcolor = new Color([255,0,0]);
      //测量显示/隐藏
      $("#measureBur").click(function(e){ 
    	  e.stopPropagation();
    	  $("#measureList").toggle();
      });
      $("#measureList .bu-lor").click(function(){
    	  $(this).addClass('active').siblings().removeClass("active");
      });
      $("#measureList").hover(function (){  
		$("#measureList").show(); 
      },function (){  
      	$("#measureList").hide();  
      }); 
      //坐标测量
      $("#measure-coordinate").click(function(){
     	 clearMeasure();//关闭所有测量
     	 if(isCoormeasure){//第一次点击
     		 map.setMapCursor("default");//默认
     		 coorMeasure = map.on("click", function(ev){
        		var X = ev.mapPoint.x;
        		var Y = ev.mapPoint.y;
        		//显示坐标测量信息
  				var coorx = Number(X).toFixed(2);
  				var coory = Number(Y).toFixed(2);
  				var overlay = redCircleIcon(X,Y);
  				var textsymbol = new esri.symbol.TextSymbol(' Coordinate: '+ coorx + ' , ' + coory ,font,redcolor);
  				textsymbol.setOffset(10, 20);
  				var graphicText = new esri.Graphic(ev.mapPoint, textsymbol);
  				map.graphics.add(graphicText);
  		  	 })
     		 isCoormeasure = false
     	 }else{//第二次点击 
     		 $(".bu-lor").removeClass("active");
     		 isCoormeasure = true;
     		 map.setMapCursor("grab");//手掌
     	 }
      });
      //距离测量
      $("#measure-distance").click(function(){
     	 clearMeasure();
     	 if(isDistancemeasure){//第一次点击
     		 map.setMapCursor("default");//默认
     		 measureToolbar.activate(Draw.POLYLINE);//线
          	 measureToolbar.on("draw-complete", doMeasure); //绘图结束后，执行
          	isDistancemeasure = false
     	 }else{//第二次点击
     		 $(".bu-lor").removeClass("active");
     		 isDistancemeasure = true;
     		 map.setMapCursor("grab");//手掌
     	 }
      });
      //面积测量
      $("#measure-area").click(function(){
     	 clearMeasure();
     	 if(isAreameasure){//第一次点击
     		 map.setMapCursor("default");//默认
     		 measureToolbar.activate(Draw.POLYGON);//多边形
  		  	 measureToolbar.on("draw-complete", doMeasure); //绘图结束后，执行
     		 isAreameasure = false
     	 }else{//第二次点击
     		 $(".bu-lor").removeClass("active");
     		 isAreameasure = true;
     		 map.setMapCursor("grab");//手掌
     	 }
      });
      //角度测量点击
      $("#measure-angle").click(function(){
     	 clearMeasure();
     	 if(isAnglemeasure){//第一次点击
     		 map.setMapCursor("default");//默认
     		 measureAngle();//角度测量
     		 isAnglemeasure = false
     	 }else{//第二次点击
     		 $(".bu-lor").removeClass("active");
     		 isAnglemeasure = true;
     		 map.setMapCursor("grab");//手掌
     	 }
      });
      //清除所有测量事件
      function clearMeasure(){
    	  map.setMapCursor("grab");//手掌
    	  if(coorMeasure){//移除测量坐标
   		      coorMeasure.remove();
          }
  	      if(measureToolbar){//移除距离、面积测量
     		  measureToolbar.deactivate();
     	  }
          if(angleMeasure){//移除角度测量
        	  angleMeasure.remove();
          }
      };
      //点
      function redCircleIcon(lon, lat) {
      	 var symbol = new esri.symbol.PictureMarkerSymbol("../../images/redcircle-icon.png", 6, 6);
         var centerPoint = new esri.geometry.Point(lon,lat,map.spatialReference);
         var redCircleGraphic = new esri.Graphic(centerPoint, symbol);
         map.graphics.add(redCircleGraphic);
         return redCircleGraphic;
      };
      //线、面
      function doMeasure(evt) {
     	 map.setMapCursor("default");
     	 measurecoordinate = evt;//几何图形坐标
         var geometry = evt.geometry;
         switch (geometry.type) {
              case "polyline":
                  var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,redcolor, 2);
                  break;
              case "polygon":
              	var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,redcolor, 2),new Color([148, 148, 148, 0.2]));
              	break;
          }
          //设置样式
          var graphic = new esri.Graphic(geometry,symbol);
          map.graphics.add(graphic);
          ployoverlay = graphic;//赋值给全局变量用于删除几何体
          //进行投影转换，完成后调用projectComplete
          showMeasureResults(evt);
      };
      //显示测量结果
      var showPt=null;
      function showMeasureResults(evt){
          map.setMapCursor("default");
          var geometry = evt.geometry;
          switch (geometry.type) {
              case "polyline":{
                  var length = geometry.paths[0].length;
                  showPt = new esri.geometry.Point(geometry.paths[0][length-1],map.spatialReference);
                  var lengthParams = new LengthsParameters();
                  lengthParams.lengthUnit = esri.tasks.GeometryService.UNIT_KILOMETER;
                  lengthParams.polylines = [geometry];
                  geometryService.lengths(lengthParams);
                  break;
              }
              case "polygon":{
                  showPt = new esri.geometry.Point(geometry.rings[0][0],map.spatialReference);
                  var areasAndLengthParams = new AreasAndLengthsParameters();
                  areasAndLengthParams.lengthUnit = esri.tasks.GeometryService.UNIT_KILOMETER;
                  areasAndLengthParams.areaUnit = esri.tasks.GeometryService.UNIT_SQUARE_KILOMETERS;
                  geometryService.simplify([geometry], function(simplifiedGeometries) {
                      areasAndLengthParams.polygons = simplifiedGeometries;
                      geometryService.areasAndLengths(areasAndLengthParams);
                  });
                  break;
              }
          }
      };
      //距离测量结果
      geometryService.on("lengths-complete", function(evt) {
          var result = evt.result.lengths[0];//结果
          if(result < 1){
         	 result = Number(result*1000).toFixed(2) + " m ";
          }else{
         	 result = Number(result).toFixed(2) + " km ";
          }
         var data = measurecoordinate.geometry.paths[0];
     	 var coorx = data[data.length - 1][0];
     	 var coory = data[data.length - 1][1];
     	 var point = new esri.geometry.Point(coorx,coory,map.spatialReference);
     	 var textsymbol = new esri.symbol.TextSymbol(' Total length: '+ result,font,redcolor);
		 textsymbol.setOffset(10, 20);
		 var graphicText = new esri.Graphic(point, textsymbol);
		 map.graphics.add(graphicText);
      });
      //面积测量结果
      geometryService.on("areas-and-lengths-complete", function(evt) {
     	 var area_result = Number(evt.result.areas[0]).toFixed(2);//面积（平方千米）
     	 var lengths_result = Number(evt.result.lengths[0]).toFixed(2);//周长(千米） 
     	 var data = measurecoordinate.geometry.rings[0];
     	 var coorx = data[data.length - 1][0];
     	 var coory = data[data.length - 1][1];
     	 var point = new esri.geometry.Point(coorx,coory,map.spatialReference);
		 var textsymbol = new esri.symbol.TextSymbol(' Area: '+ area_result + ' km² , Perimeter: '+lengths_result+' km ',font,redcolor);
		 textsymbol.setOffset(10, 20);
		 var graphicText = new esri.Graphic(point, textsymbol);
		 map.graphics.add(graphicText);
      });
      //角度测量
      function measureAngle(){
     	 tempCoordinate = [];//置空
     	 var overlayArry = [];//关闭事件关联的几何体
     	 var icon = $(this);
     	 $(this).data("angle",{step:0});
 		angleMeasure = map.on("click", function(ev){
			var X = ev.mapPoint.x;
    		var Y = ev.mapPoint.y;
			var step = icon.data("angle");   
			if(step.step < 3){
				 tempCoordinate.push([X,Y]);
					 var pointGraphic = redCircleIcon(X,Y);
					 var lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, redcolor, 1);
		         	 var polylineJson = {"paths":[tempCoordinate],"spatialReference":map.spatialReference};//坐标和空间参考
		         	 var Polyline = new esri.geometry.Polyline(polylineJson);//线
		         	 polylineGraphic = new esri.Graphic(Polyline, lineSymbol);
		         	 overlayArry.push(polylineGraphic);//线
		         	 overlayArry.push(pointGraphic);//点
		 	         map.graphics.add(polylineGraphic);
		 	         if(step.step == 2){//第三个点绘制完后显示弹框
		 	        	var coorx = tempCoordinate[1][0];//顶点x
 		            	var coory = tempCoordinate[1][1];//顶点y
 		            	var point = new esri.geometry.Point(coorx,coory,map.spatialReference);
 						var angleA = showAngleResults(tempCoordinate);//获取角度
 						var textsymbol = new esri.symbol.TextSymbol(angleA+'°',font,redcolor);
 						textsymbol.setOffset(10, 20);
 						var graphicText = new esri.Graphic(point, textsymbol);
 						map.graphics.add(graphicText);
		 	         }
     				 step.step++;//计数器加1
				}else{
					angleMeasure.remove();//关闭当前几何体测量点击
					measureAngle();//重新激活该测量
				}
	  	 })
      };
      //计算角度
      function showAngleResults(data){
    	  var lengthAB = Math.sqrt( Math.pow(data[1][0] - data[0][0], 2) + Math.pow(data[1][1] - data[0][1], 2));
          var lengthAC = Math.sqrt( Math.pow(data[1][0] - data[2][0], 2) + Math.pow(data[1][1] - data[2][1], 2));
          var lengthBC = Math.sqrt( Math.pow(data[0][0] - data[2][0], 2) + Math.pow(data[0][1] - data[2][1], 2));
	      var cosA = (Math.pow(lengthAB, 2) + Math.pow(lengthAC, 2) - Math.pow(lengthBC, 2)) / (2 * lengthAB * lengthAC);
	      var angleA = Math.round( Math.acos(cosA) * 180 / Math.PI );//夹角度数
 		  return  angleA
      };
    
    }
      
	});
});
