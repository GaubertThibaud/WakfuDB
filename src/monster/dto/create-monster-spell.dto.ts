export class CreateMonsterSpellDto {
  monsterId: number;
  spellId: number;
  spellLevel?: number; // facultatif, défaut = 1
}
