import {CardName} from '../../../common/cards/CardName';
import {Player} from '../../Player';
import {CardType} from '../../../common/cards/CardType';
import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {CardRenderer} from '../render/CardRenderer';
import {MoonExpansion} from '../../moon/MoonExpansion';
import {Resources} from '../../../common/Resources';
import {Card} from '../Card';
import {CardRequirements} from '../CardRequirements';

export class RoverDriversUnion extends Card implements IProjectCard {
  constructor() {
    super({
      name: CardName.ROVER_DRIVERS_UNION,
      type: CardType.AUTOMATED,
      tags: [Tag.MOON],
      cost: 16,
      requirements: CardRequirements.builder((b) => b.logisticRate(2)),
      tr: {moonLogistics: 1},

      metadata: {
        description: 'Requires 2 logistic rate. Raise the logistic rate 1 step. Increase your M€ production 1 step per logistic rate.',
        cardNumber: 'M78',
        renderData: CardRenderer.builder((b) => {
          b.moonLogisticsRate().br;
          b.production((pb) => pb.megacredits(1)).slash().moonLogisticsRate();
        }),
      },
    });
  }

  public override bespokePlay(player: Player) {
    MoonExpansion.ifMoon(player.game, (moonData) => {
      MoonExpansion.raiseLogisticRate(player);
      player.production.add(Resources.MEGACREDITS, moonData.logisticRate, {log: true});
    });
    return undefined;
  }
}
