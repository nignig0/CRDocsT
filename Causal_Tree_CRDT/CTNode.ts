class CTNode {
    uid: number;
    character: string;
    children?: CTNode[];

    constructor(uid: number, character: string){
        this.uid = uid;
        this.character = character;
    }

}