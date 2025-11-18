import { FugueList } from "@cr_docs_t/dts"

/**
 * 
 * @param inputType 
 * @param pos 
 * @param fugue 
 * @param ws if this is there, then we are broadcasting this event
 * @param data the data 
 * @returns the new position of the cursor... we won't use it when we receive operations
 */
export const handleInputTypes = (inputType: string, pos: number,
     fugue: FugueList<string>, ws?: WebSocket | null, data?: string | null, 
    )=>{


    let newCursorPos = pos;
    switch (inputType) {
        case "insertText":
            if (data) {
                fugue.insert(pos, data);
                    newCursorPos = pos + data.length;
                    //send the operation to the server through the websocket here?
                }
            if(ws){
                ws.send(JSON.stringify({
                    inputType,
                    pos, 
                    data
                }));
            }
            break;
    
        case "deleteContentBackward":
            if (pos > 0) {
                fugue.delete(pos - 1);
                newCursorPos = pos - 1;
            }
            if(ws){
                ws.send(JSON.stringify({
                    inputType,
                    pos, 
                    data
                }));
            }
            break;
    
        case "deleteContentForward":
            fugue.delete(pos);
            newCursorPos = pos;
            if(ws){
                ws.send(JSON.stringify({
                    inputType,
                    pos, 
                    data
                }));
            } //this repetition is kinda ugly
            break;
    
        default:
            console.log("Unhandled input type:", inputType);
        }

        return newCursorPos;
}