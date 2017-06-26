/**
 * Created by szarecor on 6/21/17.
 */

import {Component, Input, Output, EventEmitter} from '@angular/core';



@Component({
  selector: 'enviratron-chamber-submit-button',
  // This was poorly documented and difficult to find:
  interpolation: ['[[', ']]'],
  template: `<button (click)="saveHandler()" type="button">submit</button>`
})


export class SubmitButtonComponent  {

  // Emit an event for the parent to handle when there is a change on the days <select> list:
  @Output() onDaysChange: EventEmitter<any> = new EventEmitter<any>();

  // This is fired when there is a change on the days <select> list, see the template for (ngModelChange)
  selectedDaysChangeHandler(selectedDays: string[]) {
    this.onDaysChange.emit(selectedDays);
  }

  saveHandler() {
    console.log(this);

  }

}

