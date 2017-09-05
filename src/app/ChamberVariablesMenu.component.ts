/**
 * Created by szarecor on 6/8/17.
 */

import {Component} from '@angular/core';
import { ChamberDataService } from './data.service';

@Component({
  selector: 'chamber-environment-menu',
  // This was poorly documented and difficult to find:
  interpolation: ['[[', ']]'],
  templateUrl: './chamber_environment_menu_template.html'
})

export class ChamberVariablesMenuComponent  {
  private environment?: string = 'Lighting'; // new Observable<string>();
  private menuItems: string[] = ['Lighting', 'Temperature', 'Watering', 'Humidity', 'CO2'];
  private logging: boolean = false;

  constructor(private dataService: ChamberDataService) {
    let _this = this;

    this.dataService.getEnvironment().subscribe(function(env) {
        if (_this.logging) console.log("CHAMBER ENVIRONMENT COMPONENT RECEIVING", env);
        _this.environment = env;
    })
  }

  //ngOnInit(): void {}

  handleClick(newEnvironment: string) {
    this.dataService.setEnvironment(newEnvironment);
  }


}

