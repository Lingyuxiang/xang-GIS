window.operation = {};
define([
  'dojo/_base/declare',
  "esri/map",
  "esri/layers/ArcGISTiledMapServiceLayer",
  "esri/layers/FeatureLayer",
  "esri/InfoTemplate",
  "esri/renderers/ClassBreaksRenderer",
  "esri/renderers/UniqueValueRenderer",
  "esri/symbols/SimpleLineSymbol",
  "esri/dijit/Legend",
  "esri/Color",
  './js/ClusterLayer',
   "esri/symbols/PictureMarkerSymbol",
    "esri/symbols/SimpleMarkerSymbol",
  'krn/base/BaseWidget'
  // "extras/ClusterLayer"

], function (
      declare,
      Map, ArcGISTiledMapServiceLayer, FeatureLayer,InfoTemplate, ClassBreaksRenderer,UniqueValueRenderer,
      SimpleLineSymbol,Legend, Color,ClusterLayer,PictureMarkerSymbol,SimpleMarkerSymbol,
      BaseWidget
		) {
	return declare([BaseWidget], {
		baseClass: 'mapclear-widget',
		constructor(){
		},
		postCreate(){
    },
    startup(){
        layui.use(['form','tree','laydate'], ()=>{
            this._form = layui.form;
            this._tree = layui.tree;
            this._laydate = layui.laydate;
        });
      this._init();
    },
    _init(){
      var _map = this.map;//地图
      var centerPoint = _map.center = [113, 37];
      var pointGraphic,lineGraphic,polygonGraphic;//几何图形
      var loggerId = "3001";
      var dataSource = "DL";
      $(function(){
        //图例显示/隐藏
        $("#legend-btn").click(function(){
        	$(".legend-box").toggle();
        });
          getMapPointPosition()
      });

     function getMapPointPosition() {
          /*var point = new Point(x, y, new SpatialReference({wkid:4326}));
          var simpleMarkerSymbol = new SimpleMarkerSymbol();
          var graphic = new Graphic(point, simpleMarkerSymbol);

          map.graphics.add(graphic);*/
          /*var loggerId = "3001";
          var dataSource = "DL";*/
          var subscribeStatus = "0";
          var param = {
              // "loggerId": loggerId,
              // "dataSource": dataSource,
              "subscribeStatus":"subscribeStatus"
          }
          request({
              url:baseUrl + '/monitoringController/queryMoniLocation.htm',
              data:JSON.stringify(param),
              success:function(data){
                  var mapData = data.data;
                  for(var i=0;i<mapData.length;i++){
                      var X = mapData[i].x;
                      var Y = mapData[i].y;
                      var dataSource = mapData[i].dataSource;
                      var loggerId = mapData[i].loggerId;
                      var loggerType = mapData[i].loggerType;
                      if("" !=X && undefined !=X && null!=X &&"" !=Y && undefined !=Y && null!=Y){
                          drawPointGraphic(X,Y,i,false,true);
                      }
                  }
		    },
              method:"POST",
              dataType:"JSON",
              isJson:true
          });
         /* $.ajax({
              url: baseUrl + '/monitoringController/queryMoniLocation.htm',
              data: param,
              dataType: "json",
              //contentType: "application/json; charset=utf-8",
              heads: {
                  'content-type': 'application/x-www-form-urlencoded'
              },
              async: false,
              method: 'post',
              success: function (data) {
                  var mapData = data.data;
                  for(var i=0;i<mapData.length;i++){
                      var X = mapData[i].x;
                      var Y = mapData[i].y;
                      if("" !=X && undefined !=X && null!=X &&"" !=Y && undefined !=Y && null!=Y){
                          drawPointGraphic(X,Y,0,true,true);
                      }
                  }
                  var X = mapData[0].x;
                  var Y = mapData[0].y;
                  //drawPointGraphic(X,Y,1,true,true);

              }
          });*/
        /* var dataObj = [
             {"loggerId":"3001","dataSource":"DL","x":"838639.1675","y":"823340.4837","alarmStatus":"0"},
             {"loggerId":"3007","dataSource":"DL","x":"839246.263","y":"822946.786","alarmStatus":"0"},
             {"loggerId":"10116","dataSource":"DL","x":"839530.835","y":"822102.114","alarmStatus":"0"},
             {"loggerId":"3001","dataSource":"DL","x":"839121.925","y":"822090.045","alarmStatus":"0"},
             {"loggerId":"3007","dataSource":"DL","x":"840535.824","y":"820032.192","alarmStatus":"0"},
             {"loggerId":"10116","dataSource":"DL","x":"842562.920","y":"819184.093","alarmStatus":"0"},
             {"loggerId":"3001","dataSource":"DL","x":"841657.586","y":"817817.651","alarmStatus":"0"},
             {"loggerId":"3007","dataSource":"DL","x":"842020.305","y":"818762.405","alarmStatus":"0"},
             {"loggerId":"10116","dataSource":"DL","x":"841949.877","y":"818785.234","alarmStatus":"0"}
         ];*/
        /* for(var i=0;i<dataObj.length;i++){
             var X = dataObj[i].x;
             var Y = dataObj[i].y;
             var pointObj = [X,Y];
             drawPointGraphic(X,Y,i,false,true);
         }*/
      }
     function drawPointGraphic(x,y,type,isclear,iszoom){
        var x = Number(x);
        var y = Number(y);
        if(isclear){
            _map.graphics.remove(pointGraphic);//清除上一个graphic
        }
        //0.普通红色定位图标
        var imgUrl = [
            '../../images/monitoringMapPoints/Flow(ALM).png',
            '../../images/monitoringMapPoints/Flow(Inactive).png',
            '../../images/monitoringMapPoints/Flow(NL).png',
            '../../images/monitoringMapPoints/Noise(ALM).png',
            '../../images/monitoringMapPoints/Noise(Inactive).png',
            '../../images/monitoringMapPoints/Noise(NL).png',
            '../../images/monitoringMapPoints/PressureFlow(ALM).png',
            '../../images/monitoringMapPoints/PressureFlow(Inactive).png',
            '../../images/monitoringMapPoints/PressureFlow(NL).png',
            '../../images/monitoringMapPoints/Pressure(ALM).png',
            '../../images/monitoringMapPoints/Pressure(Inactive).png',
            '../../images/monitoringMapPoints/Pressure(NL).png',
        ];
        var symbol = new esri.symbol.PictureMarkerSymbol(imgUrl[type], 18, 27);
        symbol.setOffset(0, 14);//标注点y轴方向向上偏移14个像素
        var Point = new esri.geometry.Point(x,y,map.spatialReference);
        if(iszoom){
            _map.centerAndZoom(centerPoint,13);//设置地图的默认中心点坐标以及缩放级别
        }
        pointGraphic = new esri.Graphic(Point, symbol);//地图上的点信息
        _map.graphics.add(pointGraphic); //map.graphics地图图层
         /*clusterLayer = new ClusterLayer({
             "data": Point,
             //"data": 12,
             "distance": 100,
             "id": "clusters",
             "labelColor": "#fff",
             "labelOffset": 10,
             "resolution": _map.extent.getWidth() / map.width,
             "singleColor": "#888",
             //"singleSymbol":pictureMarkerSymbol
             //"singleTemplate": popupTemplate
         });
         var defaultSym = new SimpleMarkerSymbol().setSize(4);
         var renderer = new ClassBreaksRenderer(defaultSym, "clusterCount");

         var picBaseUrl = "https://static.arcgis.com/images/Symbols/Shapes/";
         var blue = new PictureMarkerSymbol(picBaseUrl + "BluePin1LargeB.png", 32, 32).setOffset(0, 15);
         var green = new PictureMarkerSymbol(picBaseUrl + "GreenPin1LargeB.png", 64, 64).setOffset(0, 15);
         var red = new PictureMarkerSymbol(picBaseUrl + "RedPin1LargeB.png", 72, 72).setOffset(0, 15);
         renderer.addBreak(0, 2, blue);
         renderer.addBreak(2, 200, green);
         renderer.addBreak(200, 1001, red);

         clusterLayer.setRenderer(renderer);
         _map.addLayer(clusterLayer);*/





     }
      function request({
                             url,
                             data,
                             success,
                             error,
                             method,
                             dataType,
                             isJson,
                             async
                         }) {
            if(method == null) {
                // 默认post方式
                method = "post";
            }
            if(dataType == null) {
                // 默认json数据类型
                dataType = "json";
            }
            if(async == null) {
                // 默认同步
                async = true
            }
            if(error == null) {
                // 默认输出错误日志
                error = ajaxError
            }
            var defaultOpt = {
                url: url,
                dataType: dataType,
                type: method,
                data: data,
                async: async,
                contentType: isJson ? 'application/json; charset=UTF-8' : 'application/x-www-form-urlencoded; charset=UTF-8',
                traditional: true,
                success: function(data) {
                    if(data.code >= 10000 && data.code < 11000) {
                        // 未登录,则返回登录界面
                        if(data.code == 10000) {
                            top.location.href = top.location.href.replace('layout/index.html', 'login/index.html')
                            return;
                        }
                        layer ? layer.msg(data.description, {
                            icon: 2
                        }) : alert(data.description);
                        return;
                    }
                    if(success)
                        success(data);
                },
                error: error
            };
            $.ajax(defaultOpt);
        }
    }



   })
 });
