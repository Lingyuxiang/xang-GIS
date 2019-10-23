var exportFun = {};
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
	'dojo/dom',
	'dojo/dom-class',
	'dojo/dom-construct',
	'esri/graphic',
    'esri/layers/GraphicsLayer',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/TextSymbol',
	'esri/symbols/PictureMarkerSymbol',
	'esri/Color',
    'esri/geometry/Extent',
    'esri/geometry/Point',
    'esri/geometry/Polyline',
	'esri/geometry/Polygon',
	'esri/symbols/jsonUtils',
	'krn/base/BaseWidget',
	'krn/utils/serverUtils',
	'krn/utils/geometryUtils',
	'./legend/Legend'
], function (declare,
             lang,
             array,
             JSON,
             on,
             topic,
             query,
             Deferred,
			 domStyle,
			 dom,
             domClass,
			 domCon,
			 Graphic,
             GraphicsLayer,
             SimpleFillSymbol,
             SimpleLineSymbol,
             SimpleMarkerSymbol,
             TextSymbol,
			 PictureMarkerSymbol,
			 Color,
             Extent,
             Point,
             Polyline,
			 Polygon,
			 jsonUtils,
			 BaseWidget,
			 serverUtils,
			 geometryUtils,
			 Legend) {
	return declare([BaseWidget], {
		baseClass: 'mapSZ-widget',
		// templateString: template,
		_serverType: "DMA",
		_form: null,
		_tree: null,
		_laydate: null,
		_graLayer: null,
		_defaultData: null,
		_indicatorDictionary: {},
		constructor () {
			this._getAllRegion();
		},
		postCreate () {
			this._createGraLayer();
			this._initDefaultSymbols();
			this._defaultData = this._getNowFormatDate();
			this.mrMonth.value = this._defaultData;
			this.own(
				on(this._graLayer,"click",(e)=>{
					console.log(e.graphic.attributes);
					geometryUtils.featureAction.zoomTo(this.map, [e.graphic], { 'extentFactor': 3 });
					geometryUtils.featureAction.flash([e.graphic], this._graLayer);
					window.parent.showManagementPop(e.graphic.attributes);
				})
			)
		},
		startup () {
			layui.use(['form','tree','laydate'], ()=>{
				this._form = layui.form;
				this._tree = layui.tree;
				this._laydate = layui.laydate;
				this._initLayUI();
				this._initIndexOption();
				this._bindEvent();
				this._initExportFun();
				// this._openSZLayer();
			})
		},
		// 注册导出方法
		_initExportFun(){
			let _this = this;
			exportFun.getParam = function(){
				return _this._form.val("mrForm");
			}
		},
		//获取当前月时间↓
		_getNowFormatDate() {
			var date = new Date();
			var seperator1 = "-";
			var year = date.getFullYear();
			var startYear = year;
			var month = date.getMonth() + 1;
			var strDate = date.getDate();
			var startMonth = month-1
			if (startMonth >= 1 && startMonth <= 9) {
				startMonth = "0" + startMonth;
			}
			if (month >= 1 && month <= 9) {
				month = "0" + month;
			}
			if (strDate >= 0 && strDate <= 9) {
				strDate = "0" + strDate;
			}
			if(month == "01"){
				startYear = startYear -1;
				startMonth = "12"
			}
			var currentdate = startYear + seperator1 + startMonth + " - " + year + seperator1 + month;
			return currentdate;
		},
		_getAllRegion(){
			const _this = this;
			const url = window.serverUrl + 'dmaController/queryDmaPosition';

			serverUtils.excutePostRequest(url,"获取dma边界",{}).then((res)=>{
				domClass.remove(this.submitBtn,'layui-btn-disabled')
		
				this._createGraphic(res);
				this._addLegend();
				click();
				function click (){
					if($("[name='indexTarget'] > option").length > 1){
						_this.submitBtn.click();
					}else{
						setTimeout(() => {
							click();
						}, 2000);
					}
				}
			})

			// serverUtils.excuteGetRequest(url,"获取dma边界").then((res)=>{
			// 	domClass.remove(this.subBtn,'layui-btn-disabled')
			// 	const data = res.data

			// 	this._createGraphic(data);
			// })
			// serverUtils.excuteAjaxRequest(url,"获取指标",{
			// 	success (resp) {
			// 		if (resp.code == 0) {
			// 		  console.log(resp.data)
			// 		  resp.data.forEach((item) => {
			// 			  domCon.create('option',{
			// 				  innerHTML: item.itemCode,
			// 				  value: item.itemCode
			// 			  },_this.indexTarget)
			// 		  });
			// 			// _this._form.render('select','target');
			// 			_this._form.val("mrForm");
			// 		} else {
			// 		  layer.msg(resp.description)
			// 		}
			// 	}
			// },'get')
		},
		_initIndexOption(){
			const _this = this;
			// const url = window.serverUrl + 'commonController/queryLossDictionary?zoneType=DMA';
			// serverUtils.excuteAjaxRequest(url,"获取指标",{
			// 	success (resp) {
			// 		if (resp.code == 0) {
			// 		  console.log(resp.data)
			// 		  resp.data.forEach((item) => {
			// 			  _this._indicatorDictionary[item.itemCode] = item.itemNameEn;
			// 			  domCon.create('option',{
			// 				  innerHTML: item.itemNameEn,
			// 				  value: item.itemCode
			// 			  },_this.indexTarget)
			// 		  });
			// 			// _this._form.render('select','target');
			// 			_this.indexTarget.value = "DR";
			// 			_this._form.val("mrForm");
			// 		} else {
			// 		  layer.msg(resp.description)
			// 		}
			// 	}
			// },'get')

			const url = window.serverUrl + 'commonController/queryLossDictionary';
			const data = {
				zoneType: "DMA"
			}
			serverUtils.excutePostRequest(url,"获取指标Select",data,true).then(function(resp){
					resp.forEach((item) => {
						_this._indicatorDictionary[item.itemCode] = item.itemNameEn;
						domCon.create('option',{
							innerHTML: item.itemNameEn,
							value: item.itemCode
						},_this.indexTarget)
					});
					_this.indexTarget.value = "DR";
					_this._form.val("mrForm");
			})
		},
		_openSZLayer(){
			var _this = this;
			setCheck();
			function setCheck() {
				try{
					_this._tree.setChecked('demoId2', [_this.config[_this._serverType].topicID])
				}
				catch{
					setTimeout(()=>{
						setCheck();
					},200)
				}
			}
		},
		_addLegend(){
			this._legendWidget = new Legend({data:[
				{color:"rgb(255,0,0,1)",text:"[100,80)"},
				{color:"rgb(255,0,0,0.75)",text:"[80,70)"},
				{color:"rgb(255,0,0,0.6)",text:"[70,50)"},
				{color:"rgb(255,0,0,0.45)",text:"[50,20)"},
				{color:"rgb(255,0,0,0.3)",text:"[20,0)"}
			],legendName:"咸水指标"});
			this._legendWidget.placeAt(dom.byId("mapDiv"));
			this._legendWidget.startup();
		},
		_bindEvent(){
			
			this._form.on('select(Period)', (data)=>{
				console.log(data.elem); //得到select原始DOM对象
				console.log(data.value); //得到被选中的值
				console.log(data.othis); //得到美化后的DOM对象

				this.mrYear.style.display = "none";
				// this.mrDate.style.display = "none";
				this.mrMonth.style.display = "none";
				switch(data.value) {
					case "Y":
						this.mrYear.style.display = "block";
						break;
					// case "D":
					// 	this.mrDate.style.display = "block";
					// 	break;
					case "M":
						this.mrMonth.style.display = "block";
						break;
				}
			});   
			this._form.on('select(target)', (data)=>{
				console.log(data.elem); //得到select原始DOM对象
				console.log(data.value); //得到被选中的值
				console.log(data.othis); //得到美化后的DOM对象
			});   
			this._form.on('submit(subm)', (data)=>{
				console.log(data.elem) //被执行事件的元素DOM对象，一般为button对象
				console.log(data.form) //被执行提交的form对象，一般在存在form标签时才会返回
				console.log(data.field) //当前容器的全部表单字段，名值对形式：{name: value}

				const param = {
					region : data.field.region,
					indicator :  data.field.indexTarget,
					startDate: null,
					endDate: null,
					periodType  : data.field.dataType
				}
				switch (data.field.dataType){
					case 'Y':
						[param.startDate,param.endDate] = data.field.yearValue?split(data.field.yearValue):["",""];
						break;
					case 'M':
						[param.startDate,param.endDate] = data.field.monthValue?split(data.field.monthValue):["",""];
						break;
					// case 'D':
					// 	[param.startDate,param.endDate] = data.field.dateValue?split(data.field.dateValue):["",""];
					// 	break;
				}
				// [param.startDate,param.endDate] = [2016,2010];
				function split(timeExtent){
					if(timeExtent){
						const timeArr = timeExtent.split(" - ");
						const startTime = timeArr[0].replace(/-/g,"");
						const overTime = timeArr[1].replace(/-/g,"");
						return [startTime,overTime]
					}
				}
				const url = window.serverUrl + 'dmaController/queryDmaThematicValue';

				serverUtils.excutePostRequest(url,"获取dma指标",param,true).then((result)=>{
						// domClass.remove(this.subBtn,'layui-btn-disabled')
						this._createGraLayer();
						if(result.length == 0){
							layer.msg('未查询到指标', {
								icon: 2
							})
							this._legendWidget.hide();
							return
						}
						let dealResult = []
						let numResult = []
						for(let i of result){
							dealResult.push({itemCode: param.indicator,name:i.dmaNo})
							numResult.push(i.itemValue)
							// if(param.indicator != ''){
							// 	numResult.push(result[key][param.itemValue])
							// }else{
							// 	numResult.push([1])
							// }
						}
						let colorArr = geometryUtils.getColorByData(numResult)
						dealResult.map((value,index)=>{
							value.color = colorArr[index].concat([0.7])
							return value
						})
						let currentGra = []

						// 更新图例
						let max = Math.max.apply(null, numResult);
						let min = Math.min.apply(null, numResult);

						this._legendWidget.refresh(this._indicatorDictionary[param.indicator],max,min);

						this._allGraphic.forEach((gra)=>{
							dealResult.forEach((value,index)=>{
								if(value.name == gra.attributes["no"]){
									// this.polygonSymbol.color = value.color;
									gra.setAttributes({
										"dateType" : param.periodType,
										"startDate": param.startDate,
										"endDate": param.endDate,
										"no": value.name
									})
									gra.setSymbol(geometryUtils.getDefaultFillSymbol().setColor(new Color(value.color)));
									currentGra.push(gra.clone())
									this._graLayer.add(gra.clone());
									return
								}
							})
						})

						// geometryUtils.featureAction.zoomTo(this.map, currentGra, { 'extentFactor': 1.3 });
					}
				)

			});
		},
		 /**
         * 创建或清空GraphicLayer
         * @private
         */
        _createGraLayer () {
			// this.map.infoWindow.hide();
            if (!this._graLayer) {
                this._graLayer = new GraphicsLayer();
                this.map.addLayer(this._graLayer);
            } else {
                this._graLayer.clear();
            }
		},
		_initDefaultSymbols () {
            var polygonSys = {
                "style": "esriSFSSolid",
				"color": [255,200,200,0.4],
                "type": "esriSFS",
                "outline": {
                    "style": "esriSLSSolid",
                    "color": [0, 191, 255, 125],
                    "width": 1.5,
                    "type": "esriSLS"
                }
            };
            var pointSys = {
                "style": "esriSMSCircle",
                "color": [0, 0, 128, 128],
                "name": "Circle",
                "outline": {
                    "color": [0, 0, 128, 255],
                    "width": 1
                },
                "type": "esriSMS",
                "size": 18
            };
            var lineSys = {
                "style": "esriSLSSolid",
                "color": [79, 129, 189, 255],
                "width": 3,
                "name": "Blue 1",
                "type": "esriSLS"
            };
            if (!this.pointSymbol) {
                this.pointSymbol = jsonUtils.fromJson(pointSys);
            }
            if (!this.polylineSymbol) {
                this.polylineSymbol = jsonUtils.fromJson(lineSys);
            }
            if (!this.polygonSymbol) {
                this.polygonSymbol = geometryUtils.getDefaultFillSymbol().setColor(new Color(polygonSys.color))
            }
        },
		_createGraphic(data){
			const dataObj = {};
			data.forEach((item,index)=>{
				dataObj[item.dmaNo]&&dataObj[item.dmaNo].push(JSON.parse(item.position));
				if(dataObj[item.dmaNo] == undefined){
					dataObj[item.dmaNo] = [];
					console.log(index)
					dataObj[item.dmaNo].push(JSON.parse(item.position));
				}
			})
			let currentGra = [];
			for(let key in dataObj){
				let graphicJSON = {
					attributes:{"no":key},
					geometry: {"rings":dataObj[key],
					spatialReference:this.map.spatialReference}
				};
				const graphic = new Graphic(graphicJSON);
				graphic.setSymbol(this.polygonSymbol);
				currentGra.push(graphic.clone());
				this._graLayer.add(graphic.clone());
			}
			this._allGraphic = currentGra
			geometryUtils.featureAction.zoomTo(this.map, [currentGra], { 'extentFactor': 1.3 });
		},
		_initLayUI (){
			this._laydate.render({
				elem: this.mrYear
				,type: 'year'
				,range: true
			});
			this._laydate.render({
				elem: this.mrMonth
				,type: 'month'
				,range: true
			});
			// this._laydate.render({
			// 	elem: this.mrDate
			// 	,type: 'date'
			// 	,range: true
			// });
		},
		_reRender(){
			this._createGraLayer();
			var data1 = this._form.val("mrForm",{
				dataType: "M",
				// dateValue: "",
				indexTarget: "",
				monthValue: "",
				yearValue: "",
				region: "all"
			});
			this.mrYear.style.display = "none";
			// this.mrDate.style.display = "none";
			this.mrMonth.style.display = "block";
			window.parent.closeMapPop();
			this._legendWidget.hide();
		},
		setSelectChecked(selectId, checkValue){  
			var select = document.getElementById(selectId);  
			for(var i=0; i<select.options.length; i++){  
				if(select.options[i].innerHTML == checkValue){  
				select.options[i].selected = true;  
				break;  
				}  
			}  
		}
	});
});