
window.operation = {};
define([
  'dojo/_base/declare',
  "esri/map",
  "esri/symbols/PictureMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/Color",
  'krn/base/BaseWidget',
  'krn/utils/geometryUtils'
], function (
      declare,Map,PictureMarkerSymbol,SimpleLineSymbol,SimpleFillSymbol,Color,
      BaseWidget,geometryUtils
		) {
	return declare([BaseWidget], {
		constructor(){
		},
		postCreate(){
		this._init();
    },
    _init(){
    	var map = this.map;//地图
    	var pointGraphic,lineGraphic,polygonGraphic;//几何图形
      /**
       * 清除全部graphics
       */
      operation.clearAll = function(){
        map.graphics.clear();
      };
    	/**
    	 * 绘制点
    	 * @param x 点的x坐标
    	 * @param y 点的y坐标
    	 * @param type 图标类型,type=0,1,2,3,..
    	 * @param isclear 是否清除
    	 * @param iszoom 是否放大地图级别
    	 */
    	operation.drawPointGraphic = function(x,y,type,isclear,iszoom){
          var x = Number(x);
          var y = Number(y);
          if(isclear){
            map.graphics.remove(pointGraphic);//清除上一个graphic
          }
  	      //0.普通红色定位图标
	      var imgUrl = ['../../images/map_marker_red.png'];
          var symbol = new esri.symbol.PictureMarkerSymbol(imgUrl[type], 18, 27);
          symbol.setOffset(0, 14);//y轴方向向上偏移14个像素
          var centerPoint = new esri.geometry.Point(x,y,map.spatialReference);
          if(iszoom){
        	 map.centerAndZoom(centerPoint,10);
          }
          pointGraphic = new esri.Graphic(centerPoint, symbol);
          map.graphics.add(pointGraphic);
          
    	};
    	/**
    	 * 绘制管线
    	 * @param dataArr 线的坐标数组,例如:[["x","y"],["x","y"]]
    	 * @param type 线的样式,type=0,1,2,3,..
    	 * @param isclear 是否清除
    	 * @param iszoom 是否放大地图级别
    	 */
    	operation.drawPipelineGraphic = function(dataArr,type,isclear,iszoom){
    		 var lineSymbol;
        	 var polygonLine = new esri.geometry.Polyline(dataArr);
        	 if(isclear){
        		 map.graphics.remove(lineGraphic);
        	 }
        	 if(type == 0){//红色
        		lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 3);
        	 }
             lineGraphic = new esri.Graphic(polygonLine, lineSymbol);
             if(iszoom){
	        	 var pointObj = lineGraphic.geometry.getExtent().getCenter();//获取管线中心点
	        	 var centerPoint = new esri.geometry.Point(pointObj.x,pointObj.y,map.spatialReference);//设置放大管线中心点
	        	 map.centerAndZoom(centerPoint,10);//放大地图级别 
	         }	
             map.graphics.add(lineGraphic);
    	};
    	/**
    	 * 绘制区域
    	 * @param dataArr 面的坐标数组,例如:[[["x","y"],["x","y"],...,["x","y"]]] or 多面 [[["x","y"],["x","y"],...,["x","y"]],[["x","y"],["x","y"],...,["x","y"]]]
    	 * @param type 面的样式,type=0,1,2,3,..
    	 * @param isclear 是否清除
    	 * @param iszoom 是否放大地图级别
    	 */
    	operation.drawPolygonGraphic = function(dataArr,type,isclear,iszoom){
    		var polygonSymbol;
    		var polygon = new esri.geometry.Polygon({"rings":dataArr,"spatialReference" : map.spatialReference});
    		if(isclear){
    			map.graphics.remove(polygonGraphic);
       	 	}
            if(type == 0){//FSZ
            	polygonSymbol =  new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0]), 1),new Color([234, 207, 250, 1]));
            }else if(type == 1){//DMA
            	polygonSymbol =  new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0]), 1),new Color([188, 247, 237, 1]));
            }
	        polygonGraphic = new esri.Graphic(polygon, polygonSymbol);
	         if(iszoom){
	        	 geometryUtils.featureAction.zoomTo(map, [polygonGraphic], { 'extentFactor': 3 });
	         }	         
	         map.graphics.add(polygonGraphic);
    	};
	}
	});
});
