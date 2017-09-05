/**
 * Created by szarecor on 6/7/17.
 */

import {Component, Input, OnInit} from '@angular/core';
import { ChamberDataService } from './data.service';
import { Chamber } from './chamber.interface';

@Component({
    selector: 'chamber-buttons',
    // This was poorly documented and difficult to find:
    interpolation: ['[[', ']]'],
    templateUrl: './chamber_buttons_template.html'
})


export class ChamberButtonsComponent implements OnInit {

    private chambers: Chamber[] = [];
    private chamberCount = 8;


  constructor(private dataService: ChamberDataService) {

    let chambers: Chamber[] = [];

    // Populate the chambers array:
    for (let i:number=1,l:number=this.chamberCount; i<=l; i++) {

      chambers.push({
        id: i
        , isChecked: i === 1 ? true : false
      })

    }
    this.dataService.setChambers(chambers);
    this.chambers = chambers;


  }


  ngOnDestroy() {}
  ngOnInit(): void {}


    chamberButtonClick() {
      let _this = this;

      // TODO: figure out why not wrapping the setChambers() call in a setTimeout is causing problems
      // without it, the Svg Component seems to be one click behind in state at all times.
      window.setTimeout(
       function() { _this.dataService.setChambers(_this.chambers); }
       , 10
      );
    }

    allChambersButtonClick(ev:MouseEvent) {

        // Using type any for srcElement b/c I'm not sure what the proper type for a checkbox is...
        let srcEl:any = ev.srcElement
          , newVal:boolean = srcEl.checked ? true : false;

        this.chambers.forEach(function(chamber:Chamber) {
          chamber.isChecked = newVal;
        });

        this.dataService.setChambers(this.chambers);
    }



}
