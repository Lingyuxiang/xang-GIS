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
	'esri/Color',
    'esri/symbols/TextSymbol',
    'esri/symbols/PictureMarkerSymbol',
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
			 Color,
             TextSymbol,
             PictureMarkerSymbol,
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
		_serverType: "SZ",
		_form: null,
		_tree: null,
		_laydate: null,
		_graLayer: null,
		_allGraphic: [],
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
					geometryUtils.featureAction.zoomTo(this.map, [e.graphic], { 'extentFactor': 1.2 });
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
			const url = window.serverUrl + 'szController/querySzPosition';

			serverUtils.excutePostRequest(url,"获取sz边界",{}).then((res)=>{
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
			// },' ')
		},
		_initIndexOption(){
			const _this = this;
			// const url = window.serverUrl + 'commonController/queryLossDictionary?zoneType=SZ';

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

			// 		  _this.indexTarget.value = "UFWCPL";
			// 			// _this._form.render('select','target');
			// 			_this._form.val("mrForm");
			// 		} else {
			// 		  layer.msg(resp.description)
			// 		}
			// 	}
			// },'get')

			const url = window.serverUrl + 'commonController/queryLossDictionary';
			const data = {
				zoneType: "SZ"
			}
			serverUtils.excutePostRequest(url,"获取指标Select",data,true).then(function(resp){
					resp.forEach((item) => {
						_this._indicatorDictionary[item.itemCode] = item.itemNameEn;
						domCon.create('option',{
							innerHTML: item.itemNameEn,
							value: item.itemCode
						},_this.indexTarget)
					});
					_this.indexTarget.value = "UFWCPL";
					  // _this._form.render('select','target');
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
				this.mrDate.style.display = "none";
				this.mrMonth.style.display = "none";
				switch(data.value) {
					case "Y":
						this.mrYear.style.display = "block";
						break;
					case "D":
						this.mrDate.style.display = "block";
						break;
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
					case 'D':
						[param.startDate,param.endDate] = data.field.dateValue?split(data.field.dateValue):["",""];
						break;
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
				const url = window.serverUrl + 'szController/querySzThematicValue';

				serverUtils.excutePostRequest(url,"获取SZ指标",param,true).then((result)=>{
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
							dealResult.push({itemCode: param.indicator,name:i.szNo})
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
				dataObj[item.szNo]&&dataObj[item.szNo].push(JSON.parse(item.position));
				if(dataObj[item.szNo] == undefined){
					console.log(index);
					dataObj[item.szNo] = [];
					dataObj[item.szNo].push(JSON.parse(item.position));
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
			// 	graphic.setSymbol(new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0]), 1),new Color([234, 207, 250, 1])))

			// 	currentGra.push(graphic);
			// 	this._graLayer.add(graphic);
			// }
			// geometryUtils.featureAction.zoomTo(this.map, [currentGra], { 'extentFactor': '3' });

			// geometryUtils.featureAction.zoomTo(this.map, currentGra, { 'extentFactor': '3' });
			// let str = "[[856269.15880000, 831018.81450000], [856266.91110000, 831017.97510000], [856265.50690000, 831014.29060000], [856264.45260000, 831009.77580000], [856263.22390000, 831003.72270000], [856263.22390000, 830996.96790000], [856265.85660000, 830988.80950000], [856269.80570000, 830980.47560000], [856273.75480000, 830973.01890000], [856275.59770000, 830966.00090000], [856275.77160000, 830956.12440000], [856275.50830000, 830949.89580000], [856276.73690000, 830944.36920000], [856280.33490000, 830937.52660000], [856288.23310000, 830924.45550000], [856295.62500000, 830909.39220000], [856298.17000000, 830902.98820000], [856299.04760000, 830895.00520000], [856297.73120000, 830882.02190000], [856292.98720000, 830863.38510000], [856289.20120000, 830842.20070000], [856287.44600000, 830829.04190000], [856287.35820000, 830813.77770000], [856290.69300000, 830802.98750000], [856294.38440000, 830791.62350000], [856296.40280000, 830786.00910000], [856299.38650000, 830783.90370000], [856313.07660000, 830784.25460000], [856323.66050000, 830784.33780000], [856334.19130000, 830785.82910000], [856338.31590000, 830786.00460000], [856347.09160000, 830781.79380000], [856354.98980000, 830774.68810000], [856361.39610000, 830769.86310000], [856371.31260000, 830766.17870000], [856381.84340000, 830766.00320000], [856388.24970000, 830768.45960000], [856394.48730000, 830773.68080000], [856396.24250000, 830778.76890000], [856399.05070000, 830788.33090000], [856399.31400000, 830791.83990000], [856398.52420000, 830794.12080000], [856395.62820000, 830802.27920000], [856393.08320000, 830813.42030000], [856391.41720000, 830825.05330000], [856391.15400000, 830833.47500000], [856389.92530000, 830845.14240000], [856390.53970000, 830854.52910000], [856392.03120000, 830870.19530000], [856392.20670000, 830874.84480000], [856390.53940000, 830880.19600000], [856387.73120000, 830885.81050000], [856380.71060000, 830896.77610000], [856369.65760000, 830918.57490000], [856364.65540000, 830929.54060000], [856358.60010000, 830939.97990000], [856352.23290000, 830945.73620000], [856345.65110000, 830949.24520000], [856337.05090000, 830952.31560000], [856328.62620000, 830953.10510000], [856317.56670000, 830954.88930000], [856307.38490000, 830958.63910000], [856297.56050000, 830970.42420000], [856283.44890000, 830993.81580000], [856269.15880000, 831018.81450000]]"
			// let graphicJSON = {geometry:{"rings":[JSON.parse(str)],spatialReference:this.map.spatialReference}};
			// const graphic = new Graphic(graphicJSON);
			// graphic.setSymbol(this.polygonSymbol);
			// this._graLayer.add(graphic);
			// geometryUtils.featureAction.zoomTo(this.map, [graphic], { 'extentFactor': '3' });
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
			this._laydate.render({
				elem: this.mrDate
				,type: 'date'
				,range: true
			});
		},
		_reRender(){
			this._createGraLayer();
			var data1 = this._form.val("mrForm");
			var data1 = this._form.val("mrForm",{
				dataType: "M",
				dateValue: "",
				indexTarget: "",
				monthValue: "",
				yearValue: "",
				region: "all"
			});
			this.mrYear.style.display = "none";
			this.mrDate.style.display = "none";
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