/**
 * Created by lingyx on 2019/9/06
 */
define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/_base/html',
	'dojo/json',
	'dojo/on',
	'dojo/topic',
	'dojo/query',
	'dojo/Deferred',
	'dojo/dom-style',
	'dojo/dom-class',
	'dojo/dom-construct',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dojo/text!./tableWidget.html',
	'dojo/text!./config.json'
], function (declare,
             lang,
             array,
             html,
             JSON,
             on,
             topic,
             query,
             Deferred,
             domStyle,
             domClass,
             domCon,
             _WidgetBase,
             _TemplatedMixin,
             template,
             _config) {
	return declare([_WidgetBase, _TemplatedMixin], {
		baseClass: 'common-tableWidget',
		templateString: template,
		_config: JSON.parse(_config),
		_layerUIclass: {},
		_data: null,
		constructor () {
		},
		postCreate () {
			this._initLayerUIclass();
	
		},
		_initLayerUIclass(){
			layui.use(['table'], ()=>{
				this._layerUIclass.table = layui.table;
				this._renderTable([{'id':'999'}]);
			})
		},
		startup() {
			
		},
		_reloadTable(data){
			_layerUIclass.table.reload('idTest', {
				data: null,
				where: {} //设定异步数据接口的额外参数
				//,height: 300
			});
		},
		_renderTable(data){
			// var $ = layui.$,
			// table = layui.table;
			this._data = data;
			//第一个实例
			this._layerUIclass.table.render({
				elem: '#demo',
				height: 900,
				// ,width: "8.5rem"
				// ,url: './widgets/searchBar/table.json' //数据接口
				data: data,
				page: false, //开启分页
				cols: [[ //表头
				{field: 'id', hide: false}
				]]
			});
		}
	});
});