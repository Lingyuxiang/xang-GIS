define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/topic',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'krn/utils/dgpUtils'
], function(declare, lang, array, html, topic, _WidgetBase, _TemplatedMixin,
  utils){
  var clazz = declare([_WidgetBase, _TemplatedMixin], {
    //type: String
    //    the value shoulb be widget
    type: 'widget',

    /****these properties can be configured (be overrided) in app's config.json*****/
    //id: String
    //    the unique id of the widget, if not set in the config file,
    //    ConfigManager will generate one
    id: undefined,

    //label: String
    //    the display name of the widget
    label: undefined,

    //icon: String
    //    the uri of the icon, use images/icon.png if not set
    icon: undefined,

    //uir: String
    //    used in the config.json to locate where the widget is
    uri: undefined,

    /*======
      //left: int
      //top: int
      //right: int
      //bottom: int
      //width: int
      //height: int
    ======*/
    //    preload widget should config position property if it's not in group.
    //    the meaning of the property is the same as of the CSS
    position: {},

    //config: Object|String
    //    config info in config.json, url or json object
    //    if url is configured in the config.json, json file is parsed and stored in this property
    config: undefined,

    //defaultState: Boolean
    openAtStart: false,

    /***************************************************************/

    /*********these properties is set by the framework**************/
    //map: esri/Map|esri3d/Map
    map: null,

    //appConfig: Object
    //    the app's config.json
    appConfig: null,

    //folderUrl: String
    //    the folder url of the widget
    folderUrl: null,

    //state: String
    //    the current state of the widget, the available states are:
    //    opened, closed, active
    state: 'closed',

    //windowState: String
    //    the available states are normal, minimized, maximized
    windowState: 'normal',

    //started: boolean
    //    whether the widget has started
    started: false,

    //name: String
    //    the name is used to identify the widget. The name is the same as the widget folder name
    name: '',
    /***************************************************************/

    /*********these properties is set by the developer**************/

    //baseClass: String
    //    HTML CSS class name
    baseClass: null,

    //templateString: String
    //    widget UI part, the content of the file widget.html will be set to this property
    templateString: '<div></div>',

    moveTopOnActive: true,

    /***************************************************************/

    constructor: function(){
      //listenWidgetNames: String[]
      //    builder uses this property to filter widgets. App will not use this property to
      //    filter messages.
      this.listenWidgetNames = [];

      //listenWidgetIds: String[]
      //    app use this property to filter data message, if not set, all message will be received.
      //    this property can be set in config.json
      this.listenWidgetIds = [];


      this.own(topic.subscribe('publishData', lang.hitch(this, this._onReceiveData)));
      this.own(topic.subscribe('dataFetched', lang.hitch(this, this._onReceiveData)));
      this.own(topic.subscribe('noData', lang.hitch(this, this._onNoData)));
    },

    startup: function(){
      // this.inherited(arguments);
      this.started = true;
    },

    onOpen: function(){
      // summary:
      //    this function will be called when widget is opened everytime.
      // description:
      //    state has been changed to "opened" when call this method.
      //    this function will be called in two cases:
      //      1. after widget's startup
      //      2. if widget is closed, use re-open the widget
    },

    onClose: function(){
      // summary:
      //    this function will be called when widget is closed.
      // description:
      //    state has been changed to "closed" when call this method.
    },

    onNormalize: function(){
      // summary:
      //    this function will be called when widget window is normalized.
      // description:
      //    windowState has been changed to "normal" when call this method.
    },

    onMinimize: function(){
      // summary:
      //    this function will be called when widget window is minimized.
      // description:
      //    windowState has been changed to "minimized" when call this method.
    },

    onMaximize: function(){
      // summary:
      //    this function will be called when widget window is maximized.
      // description:
      //    windowState has been changed to "maximized" when call this method.
    },

    onActive: function(){
      // summary:
      //    this function will be called when widget is clicked.
    },

    onDeActive: function(){
      // summary:
      //    this function will be called when another widget is clicked.
    },

    onSignIn: function(credential){
      // summary:
      //    this function will be called after user sign in.

      /*jshint unused: false*/
    },

    onSignOut: function(){
      // summary:
      //    this function will be called after user sign in.
    },

    onPositionChange: function(position){
      //summary:
      //  this function will be called when position change,
      //  widget's position will be changed when layout change
      //  the position object may contain w/h/t/l/b/r

      this.setPosition(position);
    },

    setPosition: function(position, containerNode){
      //For on-screen off-panel widget, layout manager will call this function
      //to set widget's position after load widget. If your widget will position by itself,
      //please override this function.
      this.position = position;

      var style = utils.getPositionStyle(this.position);
      style.position = 'absolute';

      if(!containerNode){
        if(position.relativeTo === 'map'){
          containerNode = this.map.id;
        }else{
          containerNode = window.dgpConfig.layoutId;
        }
      }

      html.place(this.domNode, containerNode);
      html.setStyle(this.domNode, style);
      if(this.started){
        this.resize();
      }
    },

    getPosition: function(){
      return this.position;
    },

    getMarginBox: function() {
      var box = html.getMarginBox(this.domNode);
      return box;
    },

    setMap: function( /*esri.Map*/ map){
      this.map = map;
    },

    setState: function(state){
      this.state = state;
    },

    setWindowState: function(state){
      this.windowState = state;
    },

    resize: function(){
    },

    //these three methods are used by builder.
    onConfigChanged: function(config){
      /*jshint unused: false*/
    },

    onAppConfigChanged: function(appConfig, reason, changedData){
      /*jshint unused: false*/
    },

    onAction: function(action, data){
      /*jshint unused: false*/
    },

    getPanel: function(){
      //get panel of the widget. return null for off-panel widget.
      if(this.inPanel === false){
        return null;
      }
      if(this.gid === 'widgetOnScreen' || this.gid === 'widgetPool'){
        return PanelManager.getInstance().getPanelById(this.id + '_panel');
      }else{
        //it's in group
        var panel = PanelManager.getInstance().getPanelById(this.gid + '_panel');
        if(panel){
          //open all widgets in group together
          return panel;
        }else{
          return PanelManager.getInstance().getPanelById(this.id + '_panel');
        }
      }
    },

    publishData: function(data, keepHistory){
      //if set keepHistory = true, all published data will be stored in datamanager,
      //this may cause memory problem.
      if(typeof keepHistory === 'undefined'){
        //by default, we don't keep the history of the data.
        keepHistory = false;
      }
      topic.publish('publishData', this.name, this.id, data, keepHistory);
    },

    fetchData: function(widgetId){
      //widgetId, the widget id that you want to read data. it is optional.
      if(widgetId){
        topic.publish('fetchData', widgetId);
      }else{
        if(this.listenWidgetIds.length !== 0){
          array.forEach(this.listenWidgetIds, function(widgetId){
            topic.publish('fetchData', widgetId);
          }, this);
        }else{
          topic.publish('fetchData');
        }
      }
    },

    fetchDataByName: function(widgetName){
      //widgetId, the widget name that you want to read data. it is required.
      var widgets = this.widgetManager.getWidgetsByName(widgetName);

      array.forEach(widgets, function(widget){
        this.fetchData(widget.id);
      }, this);
    },

    openWidgetById: function(widgetId){
      return this.widgetManager.triggerWidgetOpen(widgetId);
    },

    _onReceiveData: function(name, widgetId, data, historyData){
      //the data is what I published
      if(widgetId === this.id){
        return;
      }
      //I am not interested in the the widget id
      if(this.listenWidgetIds.length !== 0 && this.listenWidgetIds.indexOf(widgetId) < 0){
        return;
      }
      this.onReceiveData(name, widgetId, data, historyData);
    },

    onReceiveData: function(name, widgetId, data, historyData){
      /* jshint unused: false */
      // console.log('onReceiveData: ' + name + ',' + widgetId + ',data:' + data);

      /****************About historyData:
      The historyData maybe: undefined, true, object(data)
        undefined: means data published without history
        true: means data published with history. If this widget want to fetch history data,
            Please call fetch data.
        object: the history data.
      *********************************/
    },

    _onNoData: function(name, widgetId){
      /*jshint unused: false*/
      if(this.listenWidgetIds.length !== 0 && this.listenWidgetIds.indexOf(widgetId) < 0){
        return;
      }
      this.onNoData(name, widgetId);
    },

    onNoData: function(name, widgetId){
      /*jshint unused: false*/
    }
  });
  return clazz;
});