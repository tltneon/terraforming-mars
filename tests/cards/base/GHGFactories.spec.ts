import {expect} from 'chai';
import {GHGFactories} from '../../../src/server/cards/base/GHGFactories';
import {TestPlayer} from '../../TestPlayer';
import {Resources} from '../../../src/common/Resources';
import {testGame} from '../../TestGame';

describe('GHGFactories', function() {
  let card: GHGFactories;
  let player: TestPlayer;

  beforeEach(function() {
    card = new GHGFactories();
    [/* skipped */, player] = testGame(1);
  });

  it('Can not play', function() {
    expect(card.canPlay(player)).is.not.true;
  });

  it('Should play', function() {
    player.production.add(Resources.ENERGY, 1);
    expect(card.canPlay(player)).is.true;
    card.play(player);

    expect(player.production.energy).to.eq(0);
    expect(player.production.heat).to.eq(4);
  });
});
