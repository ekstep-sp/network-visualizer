import { Component, OnInit, EventEmitter, Output, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import {SearchService} from './../../../shared/services/search-service/search.service';
import * as _ from 'lodash';
import { GraphDataService } from 'src/app/modules/core/services/graph-data-service/graph-data.service';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

import {SharedGraphService} from './../../../core/services/shared-graph.service';

declare var $:any;

@Component({
  selector: 'app-create-nodes',
  templateUrl: './create-nodes.component.html',
  styleUrls: ['./create-nodes.component.scss']
})

export class CreateNodesComponent implements OnInit, OnChanges {

  @Output() nodeBtnEvent = new EventEmitter<any>();
  public disabledBox = false;
  public deleteContext = 'Node';
  public disabledFromBox = false;
  public disabledToBox = false;
  public relationSourceNode = null;
  public relationTargetNode = null;
  @Output() edgeBtnEvent = new EventEmitter<any>();

  @Input() nodeTypes: Array<any> = [];
  public nodeTypes2: Array<any> = [];
  public selectedType: any = [];
  public typeOptions: Array<any> = [];
  public toolTipText = '';
  public processedData;
  public labelProperties = [];
  public relationTypeOptions: Array<any> = [];
  public typeProperties: any[] = [];
  public relationsData: any;
  public toNames: any[] = [];
  public fromNames: any[] = [];
  public selectedNodeNameSource: any;
  public selectedNodeNameTarget: any;
  public editNodeConfig = {};
  public deleteNodeConfig = {};
  public queryObj = {
    raw: true,
    query: `MATCH (p) WITH DISTINCT keys(p) AS keys,p
     with DISTINCT labels(p) as label,keys 
     UNWIND keys AS keyslisting WITH DISTINCT keyslisting AS allfields,label
     RETURN collect(allfields),label`
  };
  public popupConfig = {
    createNodePopup : false,
    editNodePopup : false,
    deleteNodePopup : false,
    createRelationPopup : false,
    editRelationPopup : false,
    deleteRelationPopup : false
  };
  @Input() editData: any;
  @Input() editRelData: any;

  constructor(private SharedSrvc: SearchService, private graphSrvc: GraphDataService, private sharedGraphSrvc: SharedGraphService) {
  }

  ngOnInit() {
    this.toolTipText = 'The Properties section can be left blank to set a default Node';
    $('.toolTipText').tooltip();
  }

  createNode() {
    this.popupConfig.createNodePopup = true;
    this.disabledBox = false;
    /* this.SharedSrvc.runQuery(this.queryObj).subscribe(data => {
      console.log('recieved label data from service ', data);
      this.processedData = this.processData(data);
      // extract types from the array
      this.extractLabels(this.processedData);
      this.typeOptions = _.cloneDeep(this.nodeTypes2);
    }, err => {
      console.log('An error occured while reading label data from the database');
    }); */
    this.getNodeTypes().subscribe(data => {
      this.typeOptions = _.cloneDeep(data);
    }, err => {
      console.log('An error occured while reading label data from the database', err);
      this.typeOptions = _.cloneDeep([]);
    });
  }
  editNode() {
    this.disabledBox = true;
    // this will send the edit event and then the app will wait for the node click event sent back to this component
    this.nodeBtnEvent.emit({ type: 'click', action: 'edit' });
  }
  deleteNode() {
    this.nodeBtnEvent.emit({ type: 'click', action: 'delete' });
  }
  createRelation() {
    this.popupConfig.createRelationPopup = true;
    this.disabledBox = false;
    this.getRelationTypes().subscribe(data => {});
  }

  editRelation() {
    this.edgeBtnEvent.emit({ type: 'click', action: 'edit' });
  }
  deleteRelation() {
    this.edgeBtnEvent.emit({ type: 'click', action: 'delete' });
  }

  getNodeTypes() {
    return this.SharedSrvc.runQuery(this.queryObj).pipe(map(data => {
      console.log('recieved label data from service ', data);
      this.processedData = this.processData(data);
      // extract types from the array
      this.extractLabels(this.processedData);
      // this.typeOptions = _.cloneDeep(this.nodeTypes2);
      return this.nodeTypes2;
    }));
  }

  getRelationTypes() {
    return this.graphSrvc.getGraphRelations().pipe(map(response => {
      this.relationsData = response;
      const extractedTypes = this.extractTypes(response);
      // pass it into the options for dropdown
      this.relationTypeOptions = _.cloneDeep(extractedTypes);
      return true;
    }, err => {
      console.error('An error occured while fetching relations ', err);
      throw Error();
    }));
  }

  ngOnChanges(changes: SimpleChanges) {
    $('#createNodeModal').on('hidden.bs.modal', (e) => {
      // this event will reset the popupConfig object so that everytime correct data is accessed
      this.setAllToFalse();
      this.disabledBox = false;
    });
    $('#createRelationModal').on('hidden.bs.modal', (e) => {
      // this event will reset the popupConfig object so that everytime correct data is accessed
      this.setAllToFalse();
      this.disabledBox = false;
      this.disabledFromBox = false;
      this.disabledToBox = false;
    });

    if ((!!this.editData && !!this.editData.length) || (!!this.editData && !!Object.keys(this.editData).length)) {
      this.disabledBox = true;
      // console.log('edit data recieved is ', this.editData);
      this.editNodeConfig = _.cloneDeep({
        properties : this.editData['properties'],
        type : this.editData['type'][0],
        id: this.editData['id']
      });
      // console.log('editNodeConfig is ', this.editNodeConfig);
      this.selectedType = null;
      this.getNodeTypes().subscribe(data => {
        this.typeOptions = _.cloneDeep(data);
        this.selectedType = this.editNodeConfig['type'];
        // trigger update properties to show data before hand
        this.updateProperties(this.selectedType);
        const prefilledInfo = this.recreatePrefilledData(this.editData['properties']);
        if (!!prefilledInfo) {
          // console.log('recieved some prefilled info ', prefilledInfo);
          // set the data into the modal
          this.prefillData('createNodeModal', prefilledInfo, this.editNodeConfig['id']);
        } else {
          // will allow the modal to be visible anyway
          console.error('An error occured while prefilling the data, did not recieve anyhting');
        }
      }, err => {
        console.log('An error occured while reading label data from the database');
        this.typeOptions = [];
      });
    } else if ((!!this.editRelData && !!this.editRelData.length) || (!!this.editRelData && !!Object.keys(this.editRelData).length)) {
      // execute this portion if edit relationship is triggred
      this.popupConfig.editRelationPopup = true;
      console.log('recieved edit relation data is ', this.editRelData);
      this.disabledBox = true;
      let editRelConfig = {
        id : this.editRelData['id'],
        type : this.editRelData['type'],
        properties : this.editRelData['properties'],
        from : this.editRelData['from'],
        to : this.editRelData['to']
      };

      this.getRelationTypes().subscribe(response => {
      console.log('fetched relationship types successfully');
      // once types are loaded, set a default type which is the type of selected relation
      // relationTypeOptions are already set
      this.selectedType = editRelConfig['type'];
      this.updateRelProperties(this.selectedType);
      const prefilledRelInfo = this.recreatePrefilledData(editRelConfig['properties']);

      // disable the from and to boxes
      this.disabledFromBox = true;
      this.disabledToBox = true;

      if (!!prefilledRelInfo) {
        // console.log('recieved some prefilled info ', prefilledRelInfo);
        // set the data into the modal
        this.prefillData('createRelationModal', prefilledRelInfo, editRelConfig['id'], 'relation');
      } else {
        // will allow the modal to be visible anyway
        console.error('An error occured while prefilling the relation data, did not recieve anyhting');
      }

      // prefill the connected nodes names for the selected relationship modal
      this.prefillConnectedNodes(editRelConfig);
      this.sharedGraphSrvc.nodeDetails.subscribe(nodeDetailsArray => {
        // this variable will have arrays of nodes in same sequesnce the ids were sent
        console.log('recieved connected node information', nodeDetailsArray);
        this.selectedNodeNameSource = nodeDetailsArray[0]['label'] || '';
        this.selectedNodeNameTarget = nodeDetailsArray[1]['label'] || '';
      });

    }, err => {
      console.warn('An error occured while setting the types in the dropdown');
    });
      // open the edit modal
      this.disabledBox = true;
      this.showModal('createRelationModal');
    }
  }

  prefillConnectedNodes(RelationData) {
    if (RelationData.hasOwnProperty('from') && RelationData.hasOwnProperty('to')) {
      let nodeIDs = _.cloneDeep([RelationData['from'], RelationData['to']]);
      this.fetchNodeNameFromID(nodeIDs);
    }
  }

  fetchNodeNameFromID(nodeIDArray) {
    // this function will send the node id to the graph visualilzer which has all the information of the nodes
    // the graph visualizer will fetch the node details using the provided node id and send the details back here
    if (!!nodeIDArray.length) {
      console.log('asking for details of ', nodeIDArray);
      this.sharedGraphSrvc.getNodeDetails(nodeIDArray);
    } else {
      console.warn('nodeID was not valid while sending event to read node details');
    }
  }

  prefillData(modalID, dataToFill, IDToSupply, type = 'node') {
    if (!modalID) {
      console.warn('cannot prefill data as modal id is not supplied');
    } else if (!Object.keys(dataToFill).length) {
      console.warn('Did not recieve any data to prefill');
    } else {
      // both are supplied, time to prefill the modal
      if ($(`#${modalID}`).length) {
        this.popupConfig.editNodePopup = true;
        this.showModal(modalID);
        // found the modal
        $(`#${modalID}`).on('shown.bs.modal', (event) => {
          // capture the modal text boxes once it is visible
          $(`#${modalID} :text`).each(function() {
            let key = $(this).attr('id') || null;
            if (Object.keys(dataToFill).indexOf(key) > -1) {
              // assign this text box a prefilled value from dataToFill
              $(`[id='${key}']`).val(dataToFill[key]);
              // disable the Name box since it is unique fot the database
              /* if (key === 'id_Name') {
                $(`[id='${key}']`).attr('disabled', 'disabled');
              } */
            }
          });
          // add id of the node to the modal
          this.addAttribute('edit_btn', `${type}_id`, IDToSupply);
        });
      } else {
        console.warn('did not find any element with provided ID');
      }
    }
  }

  addAttribute(elementID, attributeKey, attributeValue) {
    $(`[id='${elementID}']`).attr(attributeKey, attributeValue);

  }

  recreatePrefilledData(prefilledData) {
    // main purpose is to attach id_ to the object keys so that it can be used to find elements in the modal
    if (Object.keys(prefilledData).length > 0) {
      // iterate on the keys and rename them
      let prefilledObj = {};
      Object.keys(prefilledData).forEach(key => {
        let newKey = `id_${key}`;
        prefilledObj[newKey] = prefilledData[key];
      });
      return prefilledObj;
    }
    else {return null}
  }

  showModal(modalID) {
    $(`#${modalID}`).modal('show');
  }

  setAllToFalse() {
    Object.keys(this.popupConfig).forEach(key => {
      if (this.popupConfig[key]) {
        this.popupConfig[key] = false;
      }
    });
    this.selectedType = _.cloneDeep([]);
  }

  submitModal(type = 'create') {
    console.log(type);
    let nodeData = {
      id: null,
      properties: {},
      type: null
    };
    nodeData.type = [this.selectedType];
    $('#createNodeModal :text').each(function () {
      let key = $(this).attr('id') || null;
      let value = $(this).val() || null;
      nodeData.properties[key] = value;
    });
    try {
      nodeData = this.validateNodeData(nodeData);
      // hide the modal once the data is created properly
      $('#createNodeModal').modal('hide');
      if (type === 'create') {
        console.log('node created is ', nodeData);
        this.nodeBtnEvent.emit({ type: 'click', action: 'create', data: nodeData });
        this.popupConfig.createNodePopup = false;
      } else if (type === 'edit') {
        this.nodeBtnEvent.emit({ type: 'click', action: 'edit', data: nodeData, process : 'complete' });
        this.popupConfig.editNodePopup = false;
      }
    }
    catch (e) {
      console.log(e);
    }
  }

  validateNodeData(nodeObj) {

    if (Object.keys(nodeObj).length > 0) {
      if (nodeObj.hasOwnProperty('type') && nodeObj.type.length > 0) {
        if (nodeObj.hasOwnProperty('properties') && Object.keys(nodeObj.properties).length > 0) {
          return this.cleanNodeData(nodeObj);
        } else {
          throw new Error('Cannot create a node with no Name');
        }
      } else {
        throw new Error('Cannot create a node with no Type');
      }
      } else {
        throw new Error('Cannot create a node with no details');
      }
  }
  validateRelationData(relationObj) {
    if (Object.keys(relationObj).length > 0) {
      if (relationObj.hasOwnProperty('type') && relationObj.type.length > 0) {
        if (relationObj.hasOwnProperty('properties') && Object.keys(relationObj.properties).length > 0) {
          return this.cleanRelationshipData(relationObj);
        }
        else {
          // user did not specify any properties, its okay
        }

      }
      else {
        throw new Error('Cannot create a relation with no Type');
      }
    }
    else {
      throw new Error ('cannot create a relation with no details');
    }
  }

  generateID() {
    // this function generates a new id for a the node which will be unique
    return Math.floor(Date.now() + Math.random());
  }

  processData(data) {
    if (data.length > 0) {
      let tempData = [];
      data.forEach(label => {
        tempData.push({type: label._fields[1], properties : label._fields[0]});
      });
      return tempData;
    } else return [];
  }

  extractLabels(data) {
    this.nodeTypes2 = [];
    data.forEach(label => {
      this.nodeTypes2.push(label.type[0]);
    });
    // console.log('types are ', this.nodeTypes2);
  }

  updateProperties(event) {
    // fetch the properties of selected label and display it in the dropdown
    // console.log(event)
    this.labelProperties =  this.getProperties([event]);
  }

  getProperties(labelName) {
    if (labelName.length > 0) {
      let fetchedProperties = [];
      this.processedData.forEach(labelObj => {
        if (labelObj.type[0] === labelName[0]) {
          fetchedProperties = labelObj.properties;
        }
      });
      return fetchedProperties;
    }
    else {
      return [];
    }
  }

  removeDirtyData(dataObj) {
    let newPropertyObject = {};
    Object.keys(dataObj.properties).forEach(property => {
      if (property !== null && dataObj.properties[property] !== null) {
        // remove the id_ prefix in the key
        property = property.split('id_')[1];
        newPropertyObject[property] = dataObj.properties['id_' + property];
      }
    });
    return newPropertyObject;
  }

  cleanNodeData(nodeObj) {
    let newPropertyObject = {};
    // remove any null properties
    newPropertyObject = this.removeDirtyData(nodeObj);
    // assign it back to the original data
    nodeObj.properties = _.cloneDeep(newPropertyObject);
    console.log('new properties are ', nodeObj);
    // assign a unique id to the node
    nodeObj['id'] = this.generateID();
    if (this.popupConfig.editNodePopup === true) {
      // assign the node id
      this.disabledBox = true;
      let nodeID = !isNaN($(`#edit_btn`).attr('node_id')) ? $(`#edit_btn`).attr('node_id') : null;
      console.log('node id is ', nodeID);
      nodeObj['id'] = nodeID;
    }
    // get the type array removed
    nodeObj['type'] = nodeObj['type'][0];
    return nodeObj;
  }

  cleanRelationshipData(relation) {
    let relationshipProperties = {};
    // remove any null properties
    relationshipProperties = this.removeDirtyData(relation);
    relation.properties = _.cloneDeep(relationshipProperties);
    relation['type'] = relation['type'][0];
    return relation;
  }

  extractTypes(ObjectArray: any): any {
    let typesArray = [];
    ObjectArray.forEach(obj => {
      typesArray.push(obj['type']);
    });
    return typesArray;
  }

  updateRelProperties(event) {
 // fetch the properties of selected type and display it in the dropdown
    this.typeProperties =  this.getRelProperties([event]);
    // trigger an api to get all the names of the nodes in the graph
    this.graphSrvc.getNodeNames().subscribe(response => {
      this.fromNames = _.cloneDeep(response);
      this.toNames = _.cloneDeep(response);
    }, error => {
      console.log(error);
      this.fromNames = [];
      this.toNames = [];
    });
  }
  getRelProperties(relType: Array<string>): any {
    if (relType.length > 0) {
      let fetchedProperties = [];
      this.relationsData.forEach(Obj => {
        if (Obj.type === relType[0]) {
          fetchedProperties = Obj['properties'];
          return fetchedProperties;
        }
      });
      return fetchedProperties;
    } else {
      return [];
    }
  }

  submitRelModal(type = 'create') {
    let nodeData = null;
    let relationData = null;
    let sourceNode = null;
    let targetNode = null;

    if (type === 'create') {
      nodeData = {
        Name: null
      };
      sourceNode = _.cloneDeep(nodeData);
      targetNode = _.cloneDeep(nodeData);
      sourceNode.Name = this.selectedNodeNameSource;
      targetNode.Name = this.selectedNodeNameTarget;
    }

    relationData = {
      type: null,
      properties: {}
    };

    relationData.type = [this.selectedType];


    // extract properties from modal if entered
    $('#createRelationModal :text').each(function() {
      let key = $(this).attr('id') || null;
      let value = $(this).val() || null;
      relationData.properties[key] = value;
      });
      console.log(relationData);

    try {
      relationData = this.validateRelationData(relationData);
      console.log('relationship created is ', relationData);
      // add the source and target nodes of this relation
      if (type === 'create') {
        relationData['from'] = sourceNode.Name;
        relationData['to'] = targetNode.Name;
      }
      const relationID = !isNaN($(`#edit_btn`).attr('relation_id')) ? $(`#edit_btn`).attr('relation_id') : null;
      relationData['id'] = relationID;
      this.edgeBtnEvent.emit({ type: 'click', action: `${type}`, data: relationData });
      // hide the modal once the data is created properly
      $('#createRelationModal').modal('hide');
    }
    catch (e) {
      console.log(e);
    }
  }

  updateList(key,name) {
    if (name.length > 0) {
      let ans = '';
      // if name is selected from source, remove it from target and vice versa
      if (key == 'from') {
        ans = _.remove(this.fromNames, (val) => {
          return val === name[0];
        });
        if (ans) {
          this.fromNames = _.cloneDeep(this.fromNames);
        }
      }
      else if (key == 'to') {
        ans = _.remove(this.toNames, (val) => {
          return val === name[0];
        });
        if (ans) {
          this.toNames = _.cloneDeep(this.toNames);
        }
      }
      else {
        // nothing
      }
    }
  }

  activateDelete(deleteModalID, triggeredBy) {
    // first get the information of the modal which is trying to trigger the delete modal, then show the delete modal
    this.deleteContext = triggeredBy;
    $(`#${deleteModalID}`).modal('show');
  }
}
