
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
  'krn/base/BaseWidget'
], function (
      declare,
      Map, ArcGISTiledMapServiceLayer, FeatureLayer,InfoTemplate, ClassBreaksRenderer,UniqueValueRenderer,
      SimpleLineSymbol,Legend, Color,
      BaseWidget
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
    	var layer = null;
    	var diameterArry = ["[0,100)","[100,300)","[300,500)","[500,800)","[800,~)"];
    	var ageArry = ["[0,3)","[3,5)","[5,8)","[8,~)"];
    	var materialArry = ["AC","CI","CONC","COPP","DI","GI","GMS","GRP","GIL","HDPE","MS","NIL","PE","S","UPVC","MDPE","SS","PE100","PE80","PE100RC"];
    	var colorArry = ["#33b1ff","#f55e59","#ffa132","#49cc7b","#0075a9","#638c0b","#491266","#4772ff","#9a57ff","#ffd300","#5cdce6","#eb5ee1",
 	                 	"#a40000","#a6937c","#ffad8a","#b3d465","#920783","#0e807e","#1d2088","#4c4504"];//管线专题图配色
    	setFiledType();//初始化渲染字段类型
        var operationallayers = window.appInfo.userConfig.map.operationallayers;//获取服务
        var selectOption = $("#select-service").children('option:selected').val();//资产类型
        var selecttype = $(".legend-tab.active").attr('data-type');//需要查询的字段
        showPipeThematic(selectOption,selecttype);//初始化渲染管线专题图
        //图例显示/隐藏
        $("#legend-btn").click(function(){
        	$(".legend-box").toggle();
        });
        //图例切换
        $(".legend-tab").click(function() {
          $(this).addClass("active").siblings().removeClass("active");
          var _index = $(this).index();
          $(".tab-content .content").eq(_index).show().siblings().hide();
          var selectOption = $("#select-service").children('option:selected').val();//资产类型
          var selecttype = $(".legend-tab.active").attr('data-type');//需要查询的字段
          showPipeThematic(selectOption,selecttype);
        });
        //图例的change事件
        $("#select-service").change(function(){
          var selectOption = $(this).children('option:selected').val();//资产类型
          var selecttype = $(".legend-tab.active").attr('data-type');//需要查询的字段
          showPipeThematic(selectOption,selecttype);
        });
        //渲染管线专题图
        function showPipeThematic(selectOption,selecttype){
          _map.graphics.clear();//清除
          var layerUrl = null;  
          for(var i=0;i<operationallayers.length;i++){
            if(selectOption == operationallayers[i].guid){
              layerUrl = operationallayers[i].url + '/0';
              break;
            }
          }
          if(layer != null){
        	  _map.removeLayer(layer);//清除上一次渲染的数据
          }
          layer = new FeatureLayer(layerUrl, {
              mode: FeatureLayer.MODE_ONDEMAND,
              outFields: ["*"]
          });
         
          var renderer = null;
          var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 2);
          switch (selecttype) {
            case "NORM_DIAM":
                  renderer = new ClassBreaksRenderer(symbol, selecttype);
                  for (var i = 0; i < diameterArry.length; i++) {
                	var diam = diameterArry[i].match(/\d+(.\d+)?/g);
					var minDiam = diam[0].split(',')[0];
					var maxDiam = diam[0].split(',')[1];
					if(maxDiam == undefined){
						maxDiam = "Infinity";
					}
					renderer.addBreak(minDiam,maxDiam,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(colorArry[i]),2));
                  }
                  break;
            case "AGE":
            	 renderer = new ClassBreaksRenderer(symbol, selecttype);
        		 for (var j = 0; j < ageArry.length; j++) {
                	var age = ageArry[j].match(/\d+(.\d+)?/g);
					var minAge = age[0].split(',')[0];
					var maxAge = age[0].split(',')[1];
					if(maxAge == undefined){
						maxAge = "Infinity";
					}
					renderer.addBreak(minAge,maxAge,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(colorArry[j]),2));
        		 }
                 break;
            case "MATERIAL":
                  renderer = new UniqueValueRenderer(symbol, selecttype);
                  for (var k = 0; k < materialArry.length; k++) {
                	  renderer.addValue(materialArry[k], new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(colorArry[k]),2));
                  }
                  break;
          } 
          layer.setRenderer(renderer);
          _map.addLayer(layer);
        };
        //渲染分类字段
        function setFiledType(){
        	var diameterHtml="";
        	var ageHtml="";
        	var materialHtml="";
        	$("#diameterId,#ageId,#materialHtml").empty();
        	for (var i = 0; i < diameterArry.length; i++) {
        		diameterHtml +='<div class="item"><span class="color-block" style="background-color:'+colorArry[i]+'"></span><span>'+diameterArry[i]+'</span></div>'
			}
        	for (var j = 0; j < ageArry.length; j++) {
        		ageHtml +='<div class="item"><span class="color-block" style="background-color:'+colorArry[j]+'"></span><span>'+ageArry[j]+'</span></div>'
			}
        	for (var k = 0; k < materialArry.length; k++) {
        		materialHtml +='<div class="item"><span class="color-block" style="background-color:'+colorArry[k]+'"></span><span>'+materialArry[k]+'</span></div>'
			}
        	$("#diameterId").append(diameterHtml);
        	$("#ageId").append(ageHtml);
        	$("#materialId").append(materialHtml);
        };
      })
    }
      
	});
});
