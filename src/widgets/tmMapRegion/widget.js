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
	'krn/base/BaseWidget',
	'krn/utils/serverUtils',
	'esri/tasks/query',
	'esri/tasks/QueryTask',
	'esri/symbols/jsonUtils',
	'esri/graphic',
	'esri/layers/GraphicsLayer',
	'esri/geometry/Polygon',
	'esri/Color',
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
			 BaseWidget,
			 serverUtils,
			 Query,
			 QueryTask,
			 jsonUtils,
			 Graphic,
			 GraphicsLayer,
			 Polygon,
			 Color,
			 geometryUtils,
			 Legend) {
	return declare([BaseWidget], {
		baseClass: 'mapRegion-widget',
		// templateString: template,
		_serverType: "region",
		_form: null,
		_tree: null,
		_laydate: null,
		_allGraphic: null,
		_defaultData: null,
		_initParam: null,
		_indicatorDictionary: {},
		constructor () {
	
		},
		postCreate () {
			this._initDefaultSymbols();
			this._defaultData = this._getNowFormatDate();
			this.mrMonth.value = this._defaultData;

		},
		startup () {
			layui.use(['form','tree','laydate'], ()=>{
				this._form = layui.form;
				this._tree = layui.tree;
				this._laydate = layui.laydate;
				this._createGraLayer();
				this._initLayUI();
				this._initIndexOption();
				this._bindEvent();
				this._openLayer();
				this._initExportFun();
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
		//默认样式
		_initDefaultSymbols () {
            var polygonSys = {
                "style": "esriSFSSolid",
				// "color": [250, 219, 202, 0.5],
				"color": [255,200,200,0.4],
				
                "type": "esriSFS",
                "outline": {
                    "style": "esriSLSSolid",
                    "color": [110, 110, 110, 255],
                    "width": 1,
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
		//加载指标OPTION
		_initIndexOption(){
			const _this = this;
			// const url = window.serverUrl + 'commonController/queryLossDictionary?zoneType=REGION';
			// serverUtils.excuteAjaxRequest(url,null,{
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
			// 		  _this.indexTarget.value = "FWSSITDF";
			// 			// _this._form.render('select','target');
			// 			_this._form.val("mrForm");
			// 		} else {
			// 		  layer.msg(resp.description)
			// 		}
			// 	}
			// },'get')

// serviceSign,serviceName,data,isJson
			const url = window.serverUrl + 'commonController/queryLossDictionary';
			const data = {
				zoneType: "REGION"
			}
			serverUtils.excutePostRequest(url,"获取指标Select",data,true).then(function(resp){
					resp.forEach((item) => {
						_this._indicatorDictionary[item.itemCode] = item.itemNameEn;
						domCon.create('option',{
							innerHTML: item.itemNameEn,
							value: item.itemCode
						},_this.indexTarget)
					});
					_this.indexTarget.value = "FWSSITDF";
					  // _this._form.render('select','target');
					_this._form.val("mrForm");
			})
		},
		_openLayer(){
			// const _this = this;
			// setCheck();
			// function setCheck() {
			// 	try{
			// 		_this._tree.setChecked('demoId2', [_this.config[_this._serverType].topicID])
			// 	}
			// 	catch{
			// 		setTimeout(()=>{
			// 			setCheck();
			// 		},200)
			// 	}
			// }
			this._generalQueryTask(null,this.config.region.serviceUrl + '/0','1=1',null).then((result)=>{
				const _this = this;
				this._allGraphic = result;
				// result.forEach((gra)=>{
				// 	gra.setSymbol(this.polygonSymbol);
				// 	this._graLayer.add(gra.clone())

				// })
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
			this.own(
				on(this._graLayer,"click",(e)=>{
					geometryUtils.featureAction.zoomTo(this.map, [e.graphic], { 'extentFactor': 2 });
					geometryUtils.featureAction.flash([e.graphic], this._graLayer);
					window.parent.showManagementPop(e.graphic.attributes);
				})
			)
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
					itemCode: data.field.indexTarget,
					timeType: data.field.dataType,
					minDataTime: null,
					maxDataTime: null,
					region: ""
				}
				switch (data.field.dataType){
					case 'Y':
						[param.minDataTime,param.maxDataTime] = data.field.yearValue?split(data.field.yearValue):["",""];
						break;
					case 'M':
						[param.minDataTime,param.maxDataTime] = data.field.monthValue?split(data.field.monthValue):["",""];
						break;
					case 'D':
						[param.minDataTime,param.maxDataTime] = data.field.dateValue?split(data.field.dateValue):["",""];
						break;
				}
				function split(timeExtent){
					if(timeExtent){
						const timeArr = timeExtent.split(" - ");
						const startTime = timeArr[0].replace(/-/g,"");
						const overTime = timeArr[1].replace(/-/g,"");
						return [startTime,overTime]
					}
				}

				const url = window.serverUrl + 'regionController/getRegionInfos.htm';

				serverUtils.excutePostRequest(url,"获取region指标",param,true).then((result)=>{
						// this._createGraLayer();
						// let indicators = param.itemCode;
						// let weights = 0;
						// let max = 0;
						// let min = 0;
						// for(let key in result){
						// 	if(max == 0 && min ==0){
						// 		max = result[key][indicators];
						// 		min = result[key][indicators];
						// 	}
						// 	weights += result[key][indicators]
						// 	if(result[key][indicators] > max){
						// 		max = result[key][indicators];
						// 	}
						// 	if(result[key][indicators] < min){
						// 		min = result[key][indicators];
						// 	}
						// }
						// const mid = 0.6/(max - min);
						// for(let key in result){
						// 	if(indicators != ''){
						// 		result[key].alpha = 0.4 + (result[key][indicators]-min)*mid;
						// 	}else{
						// 		result[key].alpha = 0.4
						// 	}
							
						// }

						// this._allGraphic.forEach((gra)=>{
						// 	if(result[gra.attributes["N_REGION"]]){
						// 		this.polygonSymbol.color["a"]=result[gra.attributes["N_REGION"]].alpha;
						// 		gra.setSymbol(this.polygonSymbol);
						// 		this._graLayer.add(gra.clone());
						// 	}
						// })

						//颜色渐变方案
						this._createGraLayer()
						if(JSON.stringify(result) == "{}"){
							layer.msg('未查询到指标', {
								icon: 2
							})
							this._legendWidget.hide();
							return
						}
						let dealResult = []
						let numResult = []
						for(let key in result){
							dealResult.push({itemCode: param.itemCode,name:key})
							if(param.itemCode != ''){
								numResult.push(result[key][param.itemCode])
							}else{
								numResult.push([1])
							}
							
						}
						let colorArr = geometryUtils.getColorByData(numResult)
						dealResult.map((value,index)=>{
							value.color = colorArr[index].concat([0.4])
							return value
						})

						// 更新图例
						let max = Math.max.apply(null, numResult);
						let min = Math.min.apply(null, numResult);
						this._legendWidget.refresh(this._indicatorDictionary[param.itemCode],max,min);
						// 绘制↓
						this._allGraphic.forEach((gra)=>{
							dealResult.forEach((value,index)=>{
								if(value.name == gra.attributes["REGION"]){
									// this.polygonSymbol.color = value.color;
									gra.setAttributes({
										"timeType": param.timeType,
										"startTime": param.minDataTime,
										"overTime": param.maxDataTime,
										"REGION": value.name
									})
									gra.setSymbol(geometryUtils.getDefaultFillSymbol().setColor(new Color(value.color)));
									this._graLayer.add(gra.clone());
								}
							})
						})
					}
				)
			//	return false; //阻止表单跳转。如果需要表单跳转，去掉这段即可。
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
		 /**
         * 查询模板
         * @param geometry : String - null:where查询   point点查    polygon面查
         * @param url : String - 服务
         * @param where : String - 查询语句
         * @param queryfield : Array - 查询的字段
         */
        _generalQueryTask(geometry, url, where, queryfield) {
            const queryTask = new QueryTask(url);
            //定义查询参数对象
            const query = new Query();
            //返回的字段信息：*代表返回全部字段
            query.outFields = queryfield;
            //是否返回几何形状
            query.returnGeometry = true;
            if (geometry === null && where) {
                query.where = where; 
				//执行属性查询
				// queryTask.execute(query, lang.hitch(this, this._addDictionary, type));
				// queryTask.execute(query, lang.hitch(this, this._addDictionary, type));
            } else if (geometry && where === null) {
                query.geometry = geometry;
                query.outSpatialReference = this.map.spatialReference;
                query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
                // queryTask.execute(query, lang.hitch(this, this._generalIntersectTask, this.that.appConfig.geometryService, geometry));
            } else if (geometry && where) {
                query.where = where;
                query.geometry = geometry;
                query.outSpatialReference = this.map.spatialReference;
                query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
			}
			return new Promise((resolve,reject)=>{
				queryTask.execute(query, searchResult);
				function searchResult (result) {
					resolve(result.features);
				}
			})
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
			const data1 = this._form.val("mrForm",{
				dataType: "M",
				dateValue: "",
				indexTarget: "",
				monthValue: "",
				yearValue: ""
			});
			this.mrYear.style.display = "none";
			this.mrDate.style.display = "none";
			this.mrMonth.style.display = "block";
			window.parent.closeMapPop();
			this._legendWidget.hide();
		},
		setSelectChecked(selectId, checkValue){  
			const select = document.getElementById(selectId);  
			for(let i=0; i<select.options.length; i++){  
				if(select.options[i].innerHTML == checkValue){  
				select.options[i].selected = true;  
				break;  
				}  
			}  
		}
	});
});