import { Component, OnInit, EventEmitter, Output, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import {SearchService} from './../../../shared/services/search-service/search.service';
import * as _ from 'lodash';
import { GraphDataService } from 'src/app/modules/core/services/graph-data-service/graph-data.service';

declare var $:any;

@Component({
  selector: 'app-create-nodes',
  templateUrl: './create-nodes.component.html',
  styleUrls: ['./create-nodes.component.scss']
})

export class CreateNodesComponent implements OnInit, OnChanges {

  @Output() nodeBtnEvent = new EventEmitter<any>();
  @Output() edgeBtnEvent = new EventEmitter<any>();

  @Input() nodeTypes: Array<any> = [];
  public nodeTypes2: Array<any> = [];
  public selectedType: any;
  public typeOptions: Array<any> = [];
  public toolTipText = '';
  public processedData;
  public labelProperties = [];
  public relationTypeOptions: Array<any> = [];
  public typeProperties: any[] = [];
  public relationsData: any;

  constructor(private SharedSrvc: SearchService, private graphSrvc: GraphDataService, private cdr: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.toolTipText = 'The Properties section can be left blank to set a default Node';
    $('.toolTipText').tooltip();
  }

  createNode() {
    let queryObj = {
      raw: true,
      query: `MATCH (p) WITH DISTINCT keys(p) AS keys,p
       with DISTINCT labels(p) as label,keys 
       UNWIND keys AS keyslisting WITH DISTINCT keyslisting AS allfields,label
       RETURN collect(allfields),label`
    }
    this.SharedSrvc.runQuery(queryObj).subscribe(data => {
      console.log('recieved label data from service ', data);
      this.processedData = this.processData(data);
      // extract types from the array
      this.extractLabels(this.processedData);
      this.typeOptions = _.cloneDeep(this.nodeTypes2);
    }, err => {
      console.log('An error occured while reading label data from the database');
    });
  }
  editNode() {
    this.nodeBtnEvent.emit({ type: 'click', action: 'edit' });
  }
  deleteNode() {
    this.nodeBtnEvent.emit({ type: 'click', action: 'delete' });
  }
  createRelation() {
      this.graphSrvc.getGraphRelations().subscribe(response => {
        console.log('response recieved is ', response);
        this.relationsData = response;
        const extractedTypes = this.extractTypes(response);
        // pass it into the options for dropdown
        this.relationTypeOptions = _.cloneDeep(extractedTypes);
      }, err => {
        console.error('An error occured while fetching relations ', err);
      });
  }
  editRelation() {
    this.edgeBtnEvent.emit({ type: 'click', action: 'edit' });
  }
  deleteRelation() {
    this.edgeBtnEvent.emit({ type: 'click', action: 'delete' });
  }

  ngOnChanges(changes: SimpleChanges) {
    // console.log('Types recieved in create Nodes ', this.nodeTypes);
    // this.typeOptions = this.nodeTypes2;
  }

  submitModal() {
    let nodeData = {
      id: null,
      properties: {},
      type: null
    };
    nodeData.type = this.selectedType;
    $('#createNodeModal :text').each(function() {
      let key = $(this).attr('id') || null;
      let value = $(this).val() || null;
      nodeData.properties[key] = value;
        });

    console.log(nodeData);
    try {
      nodeData = this.validateNodeData(nodeData);
      console.log('node created is ', nodeData);
      this.nodeBtnEvent.emit({ type: 'click', action: 'create', data : nodeData });
      // hide the modal once the data is created properly
      $('#createNodeModal').modal('hide');
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
    data.forEach(label => {
      this.nodeTypes2.push(label.type[0]);
    });
    // console.log('types are ', this.nodeTypes2);
  }

  updateProperties(event) {
    // fetch the properties of selected label and display it in the dropdown
    this.labelProperties =  this.getProperties(event);
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

  cleanNodeData(nodeObj) {
    let newPropertyObject = {};
    // remove any null properties
    Object.keys(nodeObj.properties).forEach(property => {
      if (property !== null && nodeObj.properties[property] !== null) {
        // remove the id_ prefix in the key
        property = property.split('id_')[1];
        newPropertyObject[property] = nodeObj.properties['id_' + property];
      }
    });
    // assign it back to the original data
    nodeObj.properties = newPropertyObject;
    console.log('new properties are ', nodeObj);
    // assign a unique id to the node
    nodeObj['id'] = this.generateID();
    // get the type array removed
    nodeObj['type'] = nodeObj['type'][0];
    return nodeObj;
  }

  extractTypes(ObjectArray: any): any {
    let typesArray = [];
    ObjectArray.forEach(obj => {
      typesArray.push(obj['type']);
    });
    return typesArray;
  }

  updateRelProperties(event) {
    console.log('type is ', event)
 // fetch the properties of selected type and display it in the dropdown
    this.typeProperties =  this.getRelProperties(event);
  }
  getRelProperties(relType: Array<string>): any {
    if (relType.length > 0) {
      let fetchedProperties = [];
      this.relationsData.forEach(Obj => {
        if (Obj.type === relType[0]) {
          fetchedProperties = Obj['properties'];
        }
      });
      return fetchedProperties;
    } else {
      return [];
    }
  }
}
