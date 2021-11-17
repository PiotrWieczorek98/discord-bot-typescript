export class BetEntry{
    gamblerId: string;
    gamblerName: string;
    value: number;
    minute: string;

    constructor(gamblerId :string, gamblerName: string, value: number, minute: string){
        this.gamblerId = gamblerId;
        this.gamblerName = gamblerName;
        this.value = value;
        this.minute = minute;
    };
}