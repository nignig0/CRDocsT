class CTNode {
    uid: string; //userId @ lamport timestamp
    character?: string;
    children?: CTNode[];

    constructor(uid: string){
        this.uid = uid;
    }


}