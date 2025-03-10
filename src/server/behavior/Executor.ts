import {Units} from '../../common/Units';
import {ICard} from '../cards/ICard';
import {TRSource} from '../../common/cards/TRSource';
import {AddResourcesToCard} from '../deferredActions/AddResourcesToCard';
import {BuildColony} from '../deferredActions/BuildColony';
import {DecreaseAnyProduction} from '../deferredActions/DecreaseAnyProduction';
import {Priority, SimpleDeferredAction} from '../deferredActions/DeferredAction';
import {PlaceCityTile} from '../deferredActions/PlaceCityTile';
import {PlaceGreeneryTile} from '../deferredActions/PlaceGreeneryTile';
import {PlaceOceanTile} from '../deferredActions/PlaceOceanTile';
import {RemoveAnyPlants} from '../deferredActions/RemoveAnyPlants';
import {MoonExpansion} from '../moon/MoonExpansion';
import {PlaceMoonHabitatTile} from '../moon/PlaceMoonHabitatTile';
import {PlaceMoonMineTile} from '../moon/PlaceMoonMineTile';
import {PlaceMoonRoadTile} from '../moon/PlaceMoonRoadTile';
import {PlaceSpecialMoonTile} from '../moon/PlaceSpecialMoonTile';
import {Player} from '../Player';
import {Behavior} from './Behavior';
import {Counter} from './Counter';
import {Turmoil} from '../turmoil/Turmoil';
import {SendDelegateToArea} from '../deferredActions/SendDelegateToArea';
import {BehaviorExecutor} from './BehaviorExecutor';
import {PlaceTile} from '../deferredActions/PlaceTile';
import {Resources} from '../../common/Resources';
import {SelectPaymentDeferred} from '../deferredActions/SelectPaymentDeferred';
import {OrOptions} from '../inputs/OrOptions';
import {SelectOption} from '../inputs/SelectOption';

export class Executor implements BehaviorExecutor {
  public canExecute(behavior: Behavior, player: Player, card: ICard) {
    const ctx = new Counter(player, card);

    if (behavior.production && !player.production.canAdjust(ctx.countUnits(behavior.production))) {
      return false;
    }

    if (behavior.or) {
      if (!behavior.or.behaviors.some((behavior) => this.canExecute(behavior, player, card))) {
        return false;
      }
    }

    if (behavior.stock !== undefined) {
      const stock = behavior.stock;
      // Only supporting positive values for now.
      // (Also supporting Countable because it's a pain.)
      if (Units.keys.some((key) => {
        const v = stock[key];
        return (typeof v === 'number') ? v < 0 : false;
      })) {
        throw new Error('Not supporting negative units for now: ' + card.name);
      }

      // if (!player.hasUnits(behavior.stock)) {
      //   return false;
      // }
    }

    if (behavior.spend !== undefined) {
      const spend = behavior.spend;
      if (spend.megacredits && !player.canAfford(spend.megacredits)) {
        return false;
      }
      if (spend.steel && player.steel < spend.steel) {
        return false;
      }
      if (spend.titanium && player.titanium < spend.titanium) {
        return false;
      }
      if (spend.plants && player.plants < spend.plants) {
        return false;
      }
      if (spend.energy && player.energy < spend.energy) {
        return false;
      }
      if (spend.resourcesHere && card.resourceCount < spend.resourcesHere) {
        return false;
      }
      if (spend.heat) {
        throw new Error('spending heat not yet supported.');
      }
    }

    if (behavior.decreaseAnyProduction !== undefined) {
      if (!player.canReduceAnyProduction(behavior.decreaseAnyProduction.type, behavior.decreaseAnyProduction.count)) {
        return false;
      }
    }

    if (behavior.colonies?.buildColony !== undefined) {
      if (player.colonies.getPlayableColonies(behavior.colonies.buildColony.allowDuplicates).length === 0) {
        return false;
      }
    }

    if (behavior.city !== undefined) {
      if (behavior.city.space === undefined) {
        if (player.game.board.getAvailableSpacesForType(player, behavior.city.on ?? 'city').length === 0) {
          return false;
        }
      }
    }

    if (behavior.greenery !== undefined) {
      if (player.game.board.getAvailableSpacesForType(player, behavior.greenery.on ?? 'greenery').length === 0) {
        return false;
      }
    }

    if (behavior.tile !== undefined) {
      if (player.game.board.getAvailableSpacesForType(player, behavior.tile.on).length === 0) {
        return false;
      }
    }

    if (behavior.addResourcesToAnyCard !== undefined) {
      const arctac = behavior.addResourcesToAnyCard;
      if (!Array.isArray(arctac) && arctac.mustHaveCard === true) {
        const action = new AddResourcesToCard(player, arctac.type, {count: ctx.count(arctac.count), restrictedTag: arctac.tag});
        if (action.getCards().length === 0) {
          return false;
        }
      }
    }

    // if (behavior.removeResourcesFromAnyCard !== undefined) {
    //   const rrfac = behavior.removeResourcesFromAnyCard;
    //   if (rrfac.tag !== undefined || rrfac.count !== 1) {
    //     throw new Error('Tag and sophisticated counts are not yet implemented.');
    //   }
    //   if (player.getCardsWithResources(behavior.removeResourcesFromAnyCard.type).length === 0) {
    //     return false;
    //   }
    // }

    if (behavior.turmoil) {
      if (behavior.turmoil.sendDelegates) {
        if (Turmoil.getTurmoil(player.game).getAvailableDelegateCount(player.id) < behavior.turmoil.sendDelegates.count) {
          return false;
        }
      }
    }

    if (behavior.moon !== undefined) {
      const moon = behavior.moon;
      const moonData = MoonExpansion.moonData(player.game);
      if (moon.habitatTile !== undefined && moon.habitatTile.space === undefined) {
        if (moonData.moon.getAvailableSpacesOnLand(player).length === 0) {
          return false;
        }
      }
      if (moon.mineTile !== undefined && moon.mineTile.space === undefined) {
        if (moonData.moon.getAvailableSpacesForMine(player).length === 0) {
          return false;
        }
      }
      if (moon.roadTile !== undefined && moon.roadTile.space === undefined) {
        if (moonData.moon.getAvailableSpacesOnLand(player).length === 0) {
          return false;
        }
      }
    }

    return true;
  }

  public execute(behavior: Behavior, player: Player, card: ICard) {
    const ctx = new Counter(player, card);

    if (behavior.or !== undefined) {
      const options = behavior.or.behaviors
        .filter((behavior) => this.canExecute(behavior, player, card))
        .map((behavior) => {
          return new SelectOption(behavior.title, undefined, () => {
            this.execute(behavior, player, card);
            return undefined;
          });
        });

      // TODO(kberg): move this behavior to OrOptions?
      if (options.length === 1 && behavior.or.autoSelect === true) {
        options[0].cb();
      } else {
        player.defer(new OrOptions(...options));
      }
    }

    if (behavior.spend !== undefined) {
      const spend = behavior.spend;
      if (spend.megacredits) {
        player.game.defer(new SelectPaymentDeferred(player, spend.megacredits, {
          title: 'Select how to pay for action',
          afterPay: () => {
            const copy = {...behavior};
            delete copy['spend'];
            this.execute(copy, player, card);
          },
        }));
        // Exit early as the rest of handled by the deferred action.
        return;
      }
      if (spend.steel) {
        player.deductResource(Resources.STEEL, spend.steel);
      }
      if (spend.titanium) {
        player.deductResource(Resources.TITANIUM, spend.titanium);
      }
      if (spend.plants) {
        player.deductResource(Resources.PLANTS, spend.plants);
      }
      if (spend.energy) {
        player.deductResource(Resources.ENERGY, spend.energy);
      }
      if (spend.heat) {
        throw new Error('Spending heat not supported yet.');
      }
      if (spend.resourcesHere) {
        player.removeResourceFrom(card, spend.resourcesHere);
      }
    }

    if (behavior.production !== undefined) {
      const units = ctx.countUnits(behavior.production);
      player.production.adjust(units, {log: true});
    }
    if (behavior.stock) {
      const units = ctx.countUnits(behavior.stock);
      player.addUnits(units, {log: true});
    }
    if (behavior.steelValue === 1) {
      player.increaseSteelValue();
    }
    if (behavior.titanumValue === 1) {
      player.increaseTitaniumValue();
    }

    if (behavior?.greeneryDiscount) {
      player.plantsNeededForGreenery -= behavior.greeneryDiscount;
    }
    if (behavior.drawCard !== undefined) {
      const drawCard = behavior.drawCard;
      if (typeof(drawCard) === 'number') {
        player.drawCard(drawCard);
      } else {
        // This conditional could probably be removed, using the else clause for both.
        if (drawCard.keep === undefined && drawCard.pay === undefined) {
          player.drawCard(ctx.count(drawCard.count), {tag: drawCard.tag, resource: drawCard.resource, cardType: drawCard.type});
        } else {
          const input = player.drawCardKeepSome(ctx.count(drawCard.count), {
            tag: drawCard.tag,
            resource: drawCard.resource,
            cardType: drawCard.type,
            keepMax: drawCard.keep,
            paying: drawCard.pay,
          });
          // By moving behavior to this object, Priority for this action is changing from DEFAULT.
          // TODO(kberg): remove this comment block by 2023-10-01, or once bug reports on card drawing order subsides.
          player.defer(input, Priority.DRAW_CARDS);
        }
      }
    }

    if (behavior.global !== undefined) {
      const g = behavior.global;
      if (g.temperature !== undefined) player.game.increaseTemperature(player, g.temperature);
      if (g.oxygen !== undefined) player.game.increaseOxygenLevel(player, g.oxygen);
      if (g.venus !== undefined) player.game.increaseVenusScaleLevel(player, g.venus);
    }

    if (behavior.tr !== undefined) {
      player.increaseTerraformRatingSteps(behavior.tr);
    }
    const addResources = behavior.addResources;
    if (addResources !== undefined) {
      const count = ctx.count(addResources);
      player.game.defer(new SimpleDeferredAction(player, () => {
        player.addResourceTo(card, count);
        return undefined;
      }));
    }

    if (behavior.addResourcesToAnyCard) {
      const array = Array.isArray(behavior.addResourcesToAnyCard) ? behavior.addResourcesToAnyCard : [behavior.addResourcesToAnyCard];
      for (const entry of array) {
        const count = ctx.count(entry.count);
        if (count > 0) {
          player.game.defer(new AddResourcesToCard(player, entry.type, {count, restrictedTag: entry.tag}));
        }
      }
    }

    // if (behavior.removeResourcesFromAnyCard !== undefined) {
    //   throw new Error('not yet');
    // }

    if (behavior.decreaseAnyProduction !== undefined) {
      player.game.defer(new DecreaseAnyProduction(player, behavior.decreaseAnyProduction.type, {count: behavior.decreaseAnyProduction.count}));
    }
    if (behavior.removeAnyPlants !== undefined) {
      player.game.defer(new RemoveAnyPlants(player, behavior.removeAnyPlants));
    }
    if (behavior.colonies !== undefined) {
      const colonies = behavior.colonies;
      if (colonies.buildColony !== undefined) {
        player.game.defer(new BuildColony(player, {allowDuplicate: colonies.buildColony.allowDuplicates}));
      }
      if (colonies.addTradeFleet !== undefined) {
        for (let idx = 0; idx < colonies.addTradeFleet; idx++) {
          player.colonies.increaseFleetSize();
        }
      }
      if (colonies.tradeDiscount !== undefined) {
        player.colonies.tradeDiscount += colonies.tradeDiscount;
      }
      if (colonies.tradeOffset !== undefined) {
        player.colonies.tradeOffset += colonies.tradeOffset;
      }
    }

    if (behavior.ocean !== undefined) {
      if (behavior.ocean.count === 2) {
        player.game.defer(new PlaceOceanTile(player, {title: 'Select space for first ocean'}));
        player.game.defer(new PlaceOceanTile(player, {title: 'Select space for second ocean'}));
      } else {
        player.game.defer(new PlaceOceanTile(player, {on: behavior.ocean.on}));
      }
    }
    if (behavior.city !== undefined) {
      if (behavior.city.space !== undefined) {
        const space = player.game.board.getSpace(behavior.city.space);
        player.game.addCityTile(player, space);
      } else {
        player.game.defer(new PlaceCityTile(player, {on: behavior.city.on}));
      }
    }
    if (behavior.greenery !== undefined) {
      player.game.defer(new PlaceGreeneryTile(player, behavior.greenery.on));
    }
    if (behavior.tile !== undefined) {
      const tile = behavior.tile;
      player.game.defer(new PlaceTile(player, {
        tile: {
          tileType: tile.type,
          card: card.name,
        },
        on: tile.on,
        title: tile.title,
        adjacencyBonus: tile.adjacencyBonus,
      }));
    }

    if (behavior.turmoil) {
      const turmoil = Turmoil.getTurmoil(player.game);
      if (behavior.turmoil.influenceBonus === 1) {
        turmoil.addInfluenceBonus(player);
      }

      if (behavior.turmoil.sendDelegates) {
        const sendDelegates = behavior.turmoil.sendDelegates;
        if (sendDelegates.manyParties) {
          for (let i = 0; i < sendDelegates.count; i++) {
            player.game.defer(new SendDelegateToArea(player, 'Select where to send delegate'));
          }
        } else {
          player.game.defer(new SendDelegateToArea(player, `Select where to send ${sendDelegates.count} delegates`, {count: sendDelegates.count}));
        }
      }
    }

    if (behavior.moon !== undefined) {
      const moon = behavior.moon;
      if (moon.habitatTile !== undefined) {
        if (moon.habitatTile.space === undefined) {
          player.game.defer(new PlaceMoonHabitatTile(player));
        } else {
          MoonExpansion.addHabitatTile(player, moon.habitatTile.space, card?.name);
          MoonExpansion.raiseHabitatRate(player);
        }
      }
      if (moon.mineTile !== undefined) {
        if (moon.mineTile.space === undefined) {
          player.game.defer(new PlaceMoonMineTile(player));
        } else {
          MoonExpansion.addMineTile(player, moon.mineTile.space, card?.name);
          MoonExpansion.raiseMiningRate(player);
        }
      }
      if (moon.roadTile !== undefined) {
        if (moon.roadTile.space === undefined) {
          player.game.defer(new PlaceMoonRoadTile(player));
        } else {
          MoonExpansion.addRoadTile(player, moon.roadTile.space, card?.name);
          MoonExpansion.raiseLogisticRate(player);
        }
      }
      if (moon.tile !== undefined) {
        if (moon.tile.space !== undefined) {
          MoonExpansion.addTile(player, moon.tile.space, {tileType: moon.tile.type, card: card?.name});
        } else {
          player.game.defer(new PlaceSpecialMoonTile(
            player, {tileType: moon.tile.type, card: card?.name},
            moon.tile.title));
        }
      }
      if (moon.habitatRate !== undefined) MoonExpansion.raiseHabitatRate(player, moon.habitatRate);
      if (moon.miningRate !== undefined) MoonExpansion.raiseMiningRate(player, moon.miningRate);
      if (moon.logisticsRate !== undefined) MoonExpansion.raiseLogisticRate(player, moon.logisticsRate);
    }
  }

  public onDiscard(behavior: Behavior, player: Player, _card: ICard) {
    if (behavior.steelValue === 1) {
      player.decreaseSteelValue();
    }
    if (behavior.titanumValue === 1) {
      player.decreaseTitaniumValue();
    }

    if (behavior?.greeneryDiscount) {
      player.plantsNeededForGreenery += behavior.greeneryDiscount;
    }

    if (behavior.colonies !== undefined) {
      const colonies = behavior.colonies;
      if (colonies.addTradeFleet !== undefined) {
        for (let idx = 0; idx < colonies.addTradeFleet; idx++) {
          player.colonies.decreaseFleetSize();
        }
      }
      if (colonies.tradeDiscount !== undefined) {
        player.colonies.tradeDiscount -= colonies.tradeDiscount;
      }
      if (colonies.tradeOffset !== undefined) {
        player.colonies.tradeOffset -= colonies.tradeOffset;
      }
    }
  }

  public toTRSource(behavior: Behavior): TRSource {
    const trSource: TRSource = {
      tr: behavior.tr,

      temperature: behavior.global?.temperature,
      oxygen: (behavior.global?.oxygen ?? 0) + (behavior.greenery !== undefined ? 1 : 0),
      venus: behavior.global?.venus,
      oceans: behavior.ocean !== undefined ? 1 : undefined,

      moonHabitat: (behavior.moon?.habitatRate ?? 0) + (behavior.moon?.habitatTile !== undefined ? 1 : 0),
      moonMining: (behavior.moon?.miningRate ?? 0) + (behavior.moon?.mineTile !== undefined ? 1 : 0),
      moonLogistics: (behavior.moon?.logisticsRate ?? 0) + (behavior.moon?.roadTile !== undefined ? 1 : 0),
    };
    return trSource;
  }
}
