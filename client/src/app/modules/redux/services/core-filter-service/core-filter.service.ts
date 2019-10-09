import { Injectable } from '@angular/core';

import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../../store';

import {AppliedFiltersActions} from './../../actions/actions';



@Injectable({
  providedIn: 'root'
})
export class CoreFilterService {

  constructor(private ngRedux: NgRedux<IAppState>) { }

  updateAppliedFiltersData(newData) {
    // store the response data in the redux store
    let reduxObject = {
      type: AppliedFiltersActions.ADD_APPLIED_FILTERS_DATA,
      payload: {
        requestBody: {},
        filteredData: {}
      }
    };

    if (newData.hasOwnProperty('request')) {
      reduxObject.payload.requestBody = newData.request;
    }

    if (newData.hasOwnProperty('data')) {
      reduxObject.payload.filteredData = newData.data;
    }

    this.ngRedux.dispatch(reduxObject);
  }
}
