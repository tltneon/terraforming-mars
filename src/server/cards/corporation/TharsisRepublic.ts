import {Card} from '../Card';
import {ICorporationCard} from './ICorporationCard';
import {Tag} from '../../../common/cards/Tag';
import {Player} from '../../Player';
import {SpaceType} from '../../../common/boards/SpaceType';
import {ISpace} from '../../boards/ISpace';
import {Resources} from '../../../common/Resources';
import {CardName} from '../../../common/cards/CardName';
import {Priority} from '../../deferredActions/DeferredAction';
import {GainResources} from '../../deferredActions/GainResources';
import {GainProduction} from '../../deferredActions/GainProduction';
import {Board} from '../../boards/Board';
import {CardType} from '../../../common/cards/CardType';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../../common/cards/render/Size';
import {all} from '../Options';

export class TharsisRepublic extends Card implements ICorporationCard {
  constructor() {
    super({
      type: CardType.CORPORATION,
      name: CardName.THARSIS_REPUBLIC,
      tags: [Tag.BUILDING],
      startingMegaCredits: 40,

      firstAction: {
        text: 'Place a city tile',
        city: {},
      },

      metadata: {
        cardNumber: 'R31',
        description: 'You start with 40 M€. As your first action in the game, place a city tile.',
        renderData: CardRenderer.builder((b) => {
          b.br.br;
          b.megacredits(40).nbsp.city();
          b.corpBox('effect', (ce) => {
            ce.effect('When any city tile is placed ON MARS, increase your M€ production 1 step. When you place a city tile, gain 3 M€.', (eb) => {
              eb.city({size: Size.SMALL, all}).asterix().colon();
              eb.production((pb) => pb.megacredits(1)).nbsp;
              eb.city({size: Size.SMALL}).startEffect.megacredits(3);
            });
          });
        }),
      },
    });
  }

  public onTilePlaced(cardOwner: Player, activePlayer: Player, space: ISpace) {
    if (Board.isCitySpace(space)) {
      if (cardOwner.id === activePlayer.id) {
        cardOwner.game.defer(new GainResources(cardOwner, Resources.MEGACREDITS, {count: 3}));
      }
      if (space.spaceType !== SpaceType.COLONY) {
        cardOwner.game.defer(
          new GainProduction(cardOwner, Resources.MEGACREDITS),
          cardOwner.id !== activePlayer.id ? Priority.OPPONENT_TRIGGER : undefined,
        );
      }
    }
    return;
  }

  public override bespokePlay(player: Player) {
    if (player.game.isSoloMode()) {
      // Get bonus for 2 neutral cities
      player.production.add(Resources.MEGACREDITS, 2);
    }
    return undefined;
  }
}
