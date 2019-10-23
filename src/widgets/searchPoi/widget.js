define([
  'dojo/_base/declare',
  "esri/map",
  "esri/tasks/QueryTask",
  "esri/tasks/query",
  "esri/symbols/PictureMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/Color",
  'esri/tasks/FindTask',
  'esri/tasks/FindParameters',
  'krn/base/BaseWidget',
  'krn/utils/geometryUtils',
  'krn/utils/serverUtils'
], function (
      declare,
      Map, QueryTask,query,PictureMarkerSymbol,SimpleLineSymbol,SimpleFillSymbol,Color,FindTask,FindParameters,
      BaseWidget,geometryUtils,serverUtils
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
      var map = this.map;//地图
      var _this = this;
      var areaData = null;//区域数据
      var pointGraphic,lineGraphic,polygonGraphic;//几何图形
      var defaultLevel = map.getLevel();//默认级别
      $(function(){
    	  initFrom();//初始化渲染类型下拉框
          $("#search-btn").click(function(){
        	  $("#search-list-tbody").empty();//清空历史元素
        	  searchType(); 
    	  });
         //搜索面板鼠标移入移出事件
    	  $(".searchPoi-box,#search-content").hover(function (){  
    			$("#search-content").show(); 
          },function (){  
        	   $("#search-content").hide();
          }); 
      });
      //搜索列表列的点击事件
      $("#search-list-tbody").delegate("tr", "click", function() {
 			var n = $(this).index();
 			var dataType = $('#select_type option:selected').val();//类别
 			var name = $(".tr-name").eq(n).html();
 				name = unescapeHTML(name);//特殊字符转义
	 		$("#search-input").val(name);//显示选中的结果
 			if(dataType == "baseMap" || dataType == "lampPost" || dataType == "slopeNumber" || dataType == "tileName"){
 	 			var datasource = $(".datasource").eq(n).html();
 	 			var uniquefield = $(".uniquefield").eq(n).html();
 	 			var uniqueid = $(".uniqueid").eq(n).html();
 	 			var serviceUrl = null;
 	 			for(var key in _this.config.poiUrl){
 	 				if(key == datasource){
 	 					serviceUrl = _this.config.poiUrl[key];//服务地址
 	 					break;
 	 				}
 	 			}
 	 			searchPoiInfo(serviceUrl,uniquefield,uniqueid);//查询poi点的位置信息
 			}else if(dataType == "DMA/PMA" || dataType == "freshSZ" || dataType == "flushingSZ"){
 				for (var i = 0; i < areaData.length; i++) {
 					var value = "";
 					if(dataType == "DMA/PMA"){
 						value = areaData[i].attributes.NEW_NO;
 					}else if(dataType == "freshSZ" || dataType == "flushingSZ"){
 						value = areaData[i].attributes.SUP_CODE;
 					}
 					if(name == value){
 						var ring = areaData[i].geometry.rings;
 						drawPolygonGraphic(ring,0,true,true);//区域渲染
 						break;
 					}
				}
 			}else if(dataType == "dataLogger" || dataType == "noiselogger"){
 				var coorx = $(".coor-x").eq(n).html();
 				var coory = $(".coor-y").eq(n).html();
 				drawPointGraphic(coorx,coory,0,true,true);
 			}
 			
 	 });
     //特殊字符转义，将字符实体转成< > & “ ‘
     function unescapeHTML(a){
    	 a = "" + a;
         return a.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
      }
     //渲染类型下拉选项
     function initFrom(){
    	 layui.use(['form','jquery'], function() {
  		   var form = layui.form;
  		   var layer = layui.layer;
  		   var html = "";
  		   var selectType = _this.config.selectType;
  		   for (var i = 0; i <selectType.length; i++) {
  				var name = selectType[i].en;
  				var value = selectType[i].Value;
  				var param = selectType[i].Param;
  				html += '<option value="'+value+'" data-type="'+param+'">'+name+'</option>'
  			}
  		    $('#select_type').html(html)
  		    form.render('select');
  		})
     };
     //搜索分类
     function searchType(){
    	 var dataType = $('#select_type option:selected').val();//类别
    	 switch (dataType) {
         case 'baseMap':
        	 getPoiData();//地址/街道/建筑物/地方名称
             break;
         case 'lampPost':
        	 getPoiData();//路灯
             break;
         case 'slopeNumber':
        	 getPoiData();//斜坡编号
             break;
         case 'tileName':
        	 getPoiData();//切片名称
             break;
         case 'valveNumber':
        	 getServicData({'layerIds':"14,18","searchFields":"VRN_NUMBER"});//阀门参考编号
             break;
         case 'hydrant':
        	 getServicData({'layerIds':"28,32,36","searchFields":"FAC_TYPE,HRN"});//消防栓
             break;
         case 'WSDInstallation':
        	 getServicData({'layerIds':"0,7,11,22,26","searchFields":"INSTALLATION_ID"});//WSD
             break;
         case 'DMA/PMA':
        	 getServicData({'layerIds':"0","searchFields":"NEW_NO"});//DMA/PMA
             break;
         case 'freshSZ':
        	 getServicData({'layerIds':"0","searchFields":"SUP_CODE"});//Fresh Water Supply Zone
             break;
         case 'flushingSZ':
        	 getServicData({'layerIds':"0","searchFields":"SUP_CODE"});//Flushing Water Supply Zone
             break;
         case 'coordinate':
         	 getPoint();//坐标查询
             break;
         case 'dataLogger':
          	 getMoniLocation("DL");//遥感
             break;
         case 'noiselogger':
        	 getMoniLocation("NL");//噪声
             break;
    	 }
     };
     //模糊搜索底图Poi点
     function getPoiData(){
      var datasource = $('#select_type option:selected').attr('data-type');
      var value = $("#search-input").val();
      var param = {'datasource':datasource,'depictC':value};
	  var url = baseUrl + 'POIInfoController/getPoiInfo.htm';
		serverUtils.excutePostRequest(url,"poi",param,true).then(function(data){
		    var dataInfo = data;
	        var html="";
	        for(var i=0;i<dataInfo.length;i++){
	        	var datasource = dataInfo[i].datasource;//服务
	        	var uniquefield = dataInfo[i].uniquefield;
	        	var uniqueid = dataInfo[i].uniqueid;
	        	var depictE = dataInfo[i].depictE;
	        	var depictC = dataInfo[i].depictC;
	        	if(depictE == depictC){
	        		depictC = "";
	        	}
	        	html += '<tr class="search-list-tr"><td>'
	    	        		+'<p class ="tr-name">'+depictE+'</p>'
	    	        		+'<p class ="poi-name-c">'+depictC+'</p>'
	    	        		+'<span class="datasource hide">'+datasource+'</span>'
	    	        		+'<span class="uniquefield hide">'+uniquefield+'</span>'
	    	        		+'<span class="uniqueid hide">'+uniqueid+'</span>'
		        		+'</td></tr>'
	        }
	        $("#search-list-tbody").empty();//清空历史元素
			$('#search-list-tbody').append(html);
			$("#search-content").show();
		})
     };
     //查询poi点的位置信息,Query服务查询
     function searchPoiInfo(serviceUrl,uniquefield,uniqueid){
           var query= new esri.tasks.Query();
           query.outFields = ["*"];
           query.where =uniquefield+" = "+uniqueid;
           query.returnGeometry = true;
           var queryTask = new QueryTask(serviceUrl); 
           queryTask.execute(query,function(results){
           	var data = results.features[0].geometry;
           	if(data.hasOwnProperty("x")){
           		drawPointGraphic(data.x,data.y,0,true,true);//点定位
           	}
           })
         
     };
     //服务查询条件处理
     function getServicData(obj){
    	 var allResult = [];
    	 var datasource = $('#select_type option:selected').attr('data-type');
    	 var dataType = $('#select_type option:selected').val();//类别
      	 var value = $("#search-input").val();
      	 datasource = datasource.split(',');
      	 for (var i = 0; i < datasource.length; i++) {
      		var serviceKey = datasource[i];
			var serviceUrl = "";
			for(var key in _this.config.serviceUrl){
 				if(key == serviceKey){
 					serviceUrl = _this.config.serviceUrl[key];//服务地址
 					break;
 				}
 			}
			var params = {
	      			 "mapServicUrl":serviceUrl,//服务类型
	      			 "layerIds":obj.layerIds,//子图层
	      			 "searchFields":obj.searchFields,//字段
	      			 "searchText":value//值
	      	 }
			if(dataType == 'valveNumber' || dataType == 'hydrant' || dataType == 'WSDInstallation'){
				allResult.push(findTask(params));
			}else if(dataType == "DMA/PMA" || dataType == "freshSZ" || dataType == "flushingSZ"){
				allResult.push(queryTask(params));
			}
		 }
      	 Promise.all(allResult).then((result) => {
         	   if(dataType == 'valveNumber' || dataType == 'hydrant' || dataType == 'WSDInstallation'){
         		  showAssetsList(result);//资产（淡水、咸水、原水）服务查询数据渲染(含树结构）
         	   }else if(dataType == "DMA/PMA" || dataType == "freshSZ" || dataType == "flushingSZ"){
         		  showDMSLayerInfo(result);//DMS图层服务查询数据渲染
         	   }  
     	 }).catch((error) => {
     	  console.log(error)
     	 })
     };
     //FindTask服务查询
     function findTask(obj){
    	 return new Promise((resolve,reject) => {
        	 var findTask = new FindTask(obj.mapServicUrl);
    		 var findParameters = new FindParameters();
             findParameters.returnGeometry = true;
             findParameters.layerIds = [obj.layerIds];
             findParameters.searchFields = [obj.searchFields];
             findParameters.searchText = obj.searchText;
             findTask.execute(findParameters, function(results){
            	 resolve(results)
             })
    	 })
     };
     //查询图层信息,Query服务查询
     function queryTask(obj){
    	 return new Promise((resolve,reject) => {
    		 var mapServicUrl = obj.mapServicUrl;
    		 if(obj.layerIds != undefined){
    			 mapServicUrl = obj.mapServicUrl + "/" + obj.layerIds;
    		 }
    		 var query= new esri.tasks.Query();
	         query.outFields = ["*"];
	         query.where =obj.searchFields+" like '%"+obj.searchText.toUpperCase()+"%' AND ENABLE_FLAG='1'";
	         query.returnGeometry = true;
	         var queryTask = new QueryTask(mapServicUrl); 
	         queryTask.execute(query,function(results){
	        	 resolve(results)
	         })
    	 })
     };
     //资产（淡水、咸水、原水）服务查询数据渲染(含树结构）
     function showAssetsList(result){
    	 var treeData = [];
    	 for (var i = 0; i < result.length; i++) {
    		var category = null;
    		var childData = [];
			for (var k = 0; k < result[i].length; k++) {
				category = result[i][k].feature.attributes.SYSTEM;
				var value = result[i][k].value;
				var coordinate = result[i][k].feature.geometry.x +","+ result[i][k].feature.geometry.y;
				childData.push({title:value,coordinate:coordinate});
			}
    		if(category != null){
    			treeData.push({title:category,children:childData});
    		}
		 }
   		 layui.use(['tree'], function() {
	  		 var tree = layui.tree;
	  		 tree.render({
         	    elem: '#search-list-tbody',
         	    data: treeData,
         	    accordion: true,
         	    click: function(obj){
         	    	var coordinate = obj.data.coordinate;
         	    	if(coordinate != undefined){
         	    		coordinate = coordinate.split(',');
             	    	drawPointGraphic(coordinate[0],coordinate[1],0,true,true);
         	    	}
         	   }
	  		 })
   		 })
	  	 $("#search-content").show();
     };
     //DMS图层服务查询数据渲染
     function showDMSLayerInfo(result){
    	 var html = "";
    	 var dataType = $('#select_type option:selected').val();//类别
    	 areaData = result[0].features;
    	 for (var i = 0; i < areaData.length; i++) {
			var name = "";
			if(dataType == "DMA/PMA"){
				name = areaData[i].attributes.NEW_NO;
			}else if(dataType == "freshSZ" || dataType == "flushingSZ"){
				name = areaData[i].attributes.SUP_CODE;
			}
			html += '<tr class="search-list-tr"><td>'
		     			+'<p class ="tr-name">'+name+'</p>'
		     		+'</td></tr>'
			
		}
    	 $("#search-list-tbody").empty();//清空历史元素
		 $('#search-list-tbody').append(html);
		 $("#search-content").show();
     };
     //坐标查询
     function getPoint(){
    	 var value = $("#search-input").val();
    	 var coordinate = value.split(',');
    	 if(coordinate.length == 2){
    		 drawPointGraphic(coordinate[0],coordinate[1],0,true,true);
    	 }
     };
     //监测点信息
     function getMoniLocation(dataSource){
    	 var value = $("#search-input").val();
    	 var param = {'dataSource':dataSource,'loggerId':value};
         var url = baseUrl + 'monitoringController/queryMoniLocation.htm';
         serverUtils.excutePostRequest(url,"moniLocation",param,true).then(function(data){
		    var dataInfo = data;
		    var html="";
   	         for(var i=0;i<dataInfo.length;i++){
   	        	html += '<tr class="search-list-tr"><td>'
		    	        		+'<p class ="tr-name">'+dataInfo[i].loggerId+'</p>'
		    	        		+'<span class="coor-x hide">'+dataInfo[i].x+'</span>'
		    	        		+'<span class="coor-y hide">'+dataInfo[i].y+'</span>'
	    	        		+'</td></tr>'
   	         }
   	         $("#search-list-tbody").empty();//清空历史元素
   			 $('#search-list-tbody').append(html);
   			 $("#search-content").show();
		})
     };
     //清除全部graphics
     function clearAllGrappics(){
    	 map.graphics.clear();
    	 map.setLevel(defaultLevel);
     };
      /**
	  	 * 绘制点
	  	 * @param x 点的x坐标
	  	 * @param y 点的y坐标
	  	 * @param type 图标类型,type=0,1,2,3,..
	  	 * @param isclear 是否清除
	  	 * @param iszoom 是否放大地图级别
  	 */
      function drawPointGraphic(x,y,type,isclear,iszoom){
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
      function drawPipelineGraphic(dataArr,type,isclear,iszoom){
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
  	function drawPolygonGraphic(dataArr,type,isclear,iszoom){
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
