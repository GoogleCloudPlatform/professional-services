export class VisGraph {
  network = null;
  options = {
    autoResize: true,
    height: '800px',
    width: '100%',
    edges: {
      arrows: {to: {enabled: true, scaleFactor: 1, type: 'arrow'}},
      selectionWidth: 5,
      color: {color: '#A0A0FF', highlight: '#8080FF'},
      smooth: true
    },
    nodes: {},
    physics: {
      enabled: true,
      barnesHut: {avoidOverlap: 1, gravitationalConstant: -200},
      hierarchicalRepulsion: {nodeDistance: 150}
    },
    layout: {
      hierarchical: {
        enabled: true,
        levelSeparation: 150,
        nodeSpacing: 300,
        treeSpacing: 200,
        blockShifting: true,
        edgeMinimization: true,
        parentCentralization: false,
        direction: 'UD',        // layout directin. options are UD, DU, LR, RL
        sortMethod: 'directed'  // hubsize if you like concentric layout. But
                                // directed seems better
      }
    }
  };

  setHierarchical(b): void {
    this.options.layout.hierarchical.enabled = b;
    if (this.network) {
      this.network.setOptions(this.options);
    }
  }

  setHierchicalSort(s): void {
    this.options.layout.hierarchical.sortMethod = s;
    if (this.network) {
      this.network.setOptions(this.options);
    }
  }
}
