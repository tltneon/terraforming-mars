import {Player} from '../../Player';
import {isHazardTileType} from '../../../common/TileType';
import {BaseMilestone} from '../IMilestone';

export class Tropicalist extends BaseMilestone {
  constructor() {
    super(
      'Tropicalist',
      'Have 3 tiles in the middle 3 equatorial rows',
      3);
  }

  public getScore(player: Player): number {
    return player.game.board.spaces
      .filter((space) => space.player !== undefined &&
          space.player === player &&
          space.tile !== undefined &&
          isHazardTileType(space.tile.tileType) === false &&
          space.y >= 3 && space.y <= 5).length;
  }
}
