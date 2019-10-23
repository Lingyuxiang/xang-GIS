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
	'dojo/dom-class',
	'dojo/dom-construct',
	'krn/base/BaseWidget'
], function (declare,
             lang,
             array,
             JSON,
             on,
             topic,
             query,
             Deferred,
             domStyle,
             domClass,
			 domCon,
             BaseWidget) {
	return declare([BaseWidget], {
		baseClass: 'toolBar-widget',
		// templateString: template,
	
		constructor: function () {
			// this.inherited(arguments);
		},
		postCreate: function () {
			// this.inherited(arguments);
			
		},
		startup: function () {
			// this.inherited(arguments);
			// this._startMeasurement();
		},
		_startMeasurement: function(){
			var activeWidget = null;
			        // add the toolbar for the measurement widgets
					// view.ui.add("topbar", "top-right");

					document.getElementById("distanceButton").addEventListener("click", function() {
						setActiveWidget(null);
						if (!this.classList.contains("active")) {
						  setActiveWidget("distance");
						} else {
						  setActiveButton(null);
						}
					  });
			
					document.getElementById("areaButton").addEventListener("click", function() {
						setActiveWidget(null);
						if (!this.classList.contains("active")) {
						  setActiveWidget("area");
						} else {
						  setActiveButton(null);
						}
					  });
			
					function setActiveWidget(type) {
					  switch (type) {
						case "distance":
						  activeWidget = new DistanceMeasurement2D({
							view: view
						  });
			
						  // skip the initial 'new measurement' button
						  activeWidget.viewModel.newMeasurement();
			
						  view.ui.add(activeWidget, "top-right");
						  setActiveButton(document.getElementById("distanceButton"));
						  break;
						case "area":
						  activeWidget = new AreaMeasurement2D({
							view: view
						  });
			
						  // skip the initial 'new measurement' button
						  activeWidget.viewModel.newMeasurement();
			
						  view.ui.add(activeWidget, "top-right");
						  setActiveButton(document.getElementById("areaButton"));
						  break;
						case null:
						  if (activeWidget) {
							view.ui.remove(activeWidget);
							activeWidget.destroy();
							activeWidget = null;
						  }
						  break;
					  }
					}
			
					function setActiveButton(selectedButton) {
					  // focus the view to activate keyboard shortcuts for sketching
					  view.focus();
					  var elements = document.getElementsByClassName("active");
					  for (var i = 0; i < elements.length; i++) {
						elements[i].classList.remove("active");
					  }
					  if (selectedButton) {
						selectedButton.classList.add("active");
					  }
					}
		}
	});
});