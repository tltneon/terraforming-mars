import {BaseMilestone} from './IMilestone';
import {Player} from '../Player';

export class Economizer extends BaseMilestone {
  constructor() {
    super(
      'Economizer',
      'Requires that you have 5 heat production',
      5);
  }
  public getScore(player: Player): number {
    return player.production.heat;
  }
}
