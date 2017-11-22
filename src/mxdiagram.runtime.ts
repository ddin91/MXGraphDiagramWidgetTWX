TW.Runtime.Widgets.mxdiagram = function () {
    let mxGraphNamespace, valueProcessDiagramLoader, mxGraphUtils, xmlDiagramLoader;
    // a list of resources that are hold by the current graph
    let currentGraphResources = [];
    // the html is really simple. just a div acting as the container
    this.renderHtml = function () {
        return '<div class="widget-content widget-mxgraph"></div>';
    };

    this.runtimeProperties  =  function  () {
        return  {
            needsDataLoadingAndError: true,
        };
    }

    this.afterRender = async function () {   
        mxGraphNamespace = await import("./generic/mxGraphImport");
        mxGraphUtils = await import('./generic/mxGraphUtils');
    }

    this.updateProperty = async function (updatePropertyInfo) {
        this.setProperty(updatePropertyInfo.TargetProperty, updatePropertyInfo.RawDataFromInvoke);
        switch (updatePropertyInfo.TargetProperty) {
            case 'ValueDiagram':
                if(!valueProcessDiagramLoader) {
                    valueProcessDiagramLoader = await import('./value_process/mxValueProcessDiagram');                    
                }
                this.resetCurrentGraph();
                let container = this.jqElement[0];
                let currentGraph = valueProcessDiagramLoader.createValueProcessDiagram(container, updatePropertyInfo.RawDataFromInvoke);
                this.setNewActiveGraph(currentGraph);
                break;
            case 'XMLDiagram': {
                if(!xmlDiagramLoader) {
                    xmlDiagramLoader = await import('./xml_codec/mxGraphXmlDiagram');                    
                }
                this.resetCurrentGraph();
                let container = this.jqElement[0];
                let currentGraph = xmlDiagramLoader.createGraphFromXML(container, updatePropertyInfo.SinglePropertyValue);
                this.setNewActiveGraph(currentGraph);
                break;
            }
        }
    }

    this.setNewActiveGraph = function (newGraph) {
        this.initializeEventListener(newGraph);
        currentGraphResources.push(newGraph);              
        if (mxGraphUtils && this.getProperty('ShowTools')) {
            currentGraphResources.push(mxGraphUtils.CreateGraphToolbar(newGraph));
        }
        if (mxGraphUtils && this.getProperty('ShowOutline')) {
            currentGraphResources.push(mxGraphUtils.CreateGraphOutline(newGraph));
        }
    };

    this.initializeEventListener = function (graph) {
        let thisWidget = this;
        graph.addListener('labelChanged', function(sender, evt)
        {
            let cell = evt.getProperty('cell');
            
            if (cell != null)
            {
                if(cell.value.id) {
                    thisWidget.setProperty("EditedCellId", cell.value.id + "-" + cell.value.key);
                } else {
                    thisWidget.setProperty("EditedCellId", cell.parent.value.id + "-" + cell.value.key);
                }
                thisWidget.setProperty("EditedCellNewLabel", cell.value.value);
                thisWidget.jqElement.triggerHandler('CellLabelChanged');
            }
        });
    }
    
    this.resetCurrentGraph = function () {
        for (const object of currentGraphResources) {
            object.destroy();
        }
    }

    this.beforeDestroy = function() {
        this.resetCurrentGraph();
    }
}