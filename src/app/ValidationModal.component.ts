/**
 * Created by szarecor on 8/7/17.
 */

import {Component, OnInit} from '@angular/core';
//import { BaseModal } from 'angular-basic-modal/base-modal.component';
import { BaseModalConfig, BaseModal, BasicModalService } from 'angular-basic-modal/index';

@Component({
  selector: 'validation-modal',
  templateUrl: './validation-modal.component.html'
})
export class ValidationModalComponent extends BaseModal implements OnInit {


  constructor(bmc:BaseModalConfig) {

    console.log("MODAL COMPONENT CALLED");
    console.log(bmc);
    super(bmc);

  }

  ngOnInit(): void {
    console.log("INIT CALLED!!!!")


  }

}
