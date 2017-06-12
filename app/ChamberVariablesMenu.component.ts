/**
 * Created by szarecor on 6/8/17.
 */

/**
 * Created by szarecor on 6/7/17.
 */
import {Component, Input, Output, EventEmitter} from '@angular/core';



@Component({
  selector: 'chamber-variables-menu',
  // This was poorly documented and difficult to find:
  interpolation: ['[[', ']]'],
  templateUrl: './chamber_variables_menu_template.html'
})

export class ChamberVariablesMenuComponent  {
  @Input() currentState: any = "Lighting";
  @Input() foobar: any;
  // Emit an event for the parent to handle when there is a change on the days <select> list:
  @Output() onStateChange: EventEmitter<any> = new EventEmitter<any>();
  menuItems: string[] = ['Lighting', 'Temperature', 'Watering', 'Humidity', 'CO2'];

  handleClick(newState: string) {
    this.currentState = newState;
    // emit the the new value to the parent component:
    this.onStateChange.emit(this.currentState);
  }


}

