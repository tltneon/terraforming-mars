import { IProjectCard } from "./IProjectCard";
import { Tags } from "./Tags";
import { CardType } from "./CardType";
import { Player } from "../Player";
import { Game } from "../Game";
import { Resources } from "../Resources";
import { CardName } from "../CardName";

export class NitrophilicMoss implements IProjectCard {
    public cost = 8;
    public tags = [Tags.PLANT];
    public cardType = CardType.AUTOMATED;
    public name = CardName.NITROPHILIC_MOSS;
    public canPlay(player: Player, game: Game): boolean {
        const meetsOceanRequirements = game.board.getOceansOnBoard() >= 3 - player.getRequirementsBonus(game);
        const hasViralEnhancers = player.playedCards.find((card) => card.name === CardName.VIRAL_ENHANCERS);
        const hasEnoughPlants = player.plants >= 2 || player.isCorporation(CardName.MANUTECH) || player.plants >= 1 && hasViralEnhancers !== undefined;

        return meetsOceanRequirements && hasEnoughPlants;
    }
    public play(player: Player) {
        player.plants -= 2;
        player.addProduction(Resources.PLANTS,2);
        return undefined;
    }
}
