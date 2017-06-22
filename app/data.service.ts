/**
 * Created by szarecor on 6/22/17.
 */

import { Injectable } from '@angular/core';

@Injectable()
export class ChamberDataService {

  getChambers(): any[] {

    return ['chamber 1', 'chamber 2', 'chamber 3'] //, 'chamber 4', 'chamber 5', 'chamber 6', 'chamber 7', 'chamber 8'];

  }

  getDayCount(): number {

    return 12;
  }


}
