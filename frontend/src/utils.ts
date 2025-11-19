import { FugueList, Operation } from "@cr_docs_t/dts";
/**
 *
 * @param operation
 * @param position
 * @param fugue
 * @param ws if this is there, then we are broadcasting this event
 * @param data the data
 * @returns the new position of the cursor... we won't use it when we receive operations
 */
export const handleInputTypes = (
    replicaId: string,
    operation: Operation,
    position: number,
    fugue: FugueList<string>,
    ws?: WebSocket | null,
    data?: string | null,
) => {
    let newCursorPos = position;
    console.log({ operation });
    switch (operation) {
        case Operation.INSERT:
            if (data) {
                fugue.insert(position, data);
                if (replicaId != fugue.totalOrder.getReplicaId())
                    fugue.effect({ replicaId: fugue.totalOrder.getReplicaId(), operation, position, data });
                newCursorPos = position + data.length;
                //send the operation to the server through the websocket here?
            }
            // if (ws) {
            //     ws.send(
            //         JSON.stringify({
            //             replicaId: fugue.totalOrder.getReplicaId(),
            //             operation: operation,
            //             position: position,
            //             data: data,
            //         }),
            //     );
            // }
            break;

        case Operation.DELETE:
            const pos = position - 1;
            if (pos > 0) {
                fugue.delete(pos);
                if (replicaId != fugue.totalOrder.getReplicaId())
                    fugue.effect({
                        replicaId: fugue.totalOrder.getReplicaId(),
                        operation: operation,
                        position: pos,
                        data: null,
                    });
                newCursorPos = pos;
            }
            // if (ws) {
            //     ws.send(
            //         JSON.stringify({
            //             replicaId: fugue.totalOrder.getReplicaId(),
            //             operation: operation,
            //             position: pos,
            //             data: data,
            //         }),
            //     );
            // }
            break;

        // case "deleteContentForward":
        //     fugue.delete(pos);
        //     newCursorPos = pos;
        //     if (ws) {
        //         ws.send(
        //             JSON.stringify({
        //                 inputType,
        //                 pos,
        //                 data,
        //             }),
        //         );
        //     } //this repetition is kinda ugly
        //     break;

        default:
            console.log("Unhandled input type:", operation);
    }

    return newCursorPos;
};

export function randomString(length: number = 10): string {
    let res = new Array<string>(length);
    for (let i = 0; i < length; i++) res[i] = String.fromCharCode(97 + Math.floor(Math.random() * 26));
    return res.join("");
}
