import { useState, useRef, useEffect, Fragment } from "react";
import { FugueList, FugueMessage, Operation, StringPosition, StringTotalOrder } from "@cr_docs_t/dts";
import { useEditable, Position } from "use-editable";
import { handleInputTypes, randomString } from "../../utils";

const UseEditableCanvas = () => {
    const [text, setText] = useState("");
    const prevText = useRef("");
    const socketRef = useRef<WebSocket>(null);
    const [fugue] = useState(() => new FugueList(new StringTotalOrder(randomString(10)), null));
    const editorRef = useRef(null);

    const webSocketUrl = import.meta.env.VITE_WSS_URL as string;
    console.log(webSocketUrl);

    useEffect(() => {
        socketRef.current = new WebSocket(webSocketUrl);
        if (!socketRef.current) return;
        socketRef.current.onopen = () => {
            console.log("We have made connection");
        };

        fugue.ws = socketRef.current;

        socketRef.current.onmessage = (ev: MessageEvent) => {
            console.log("Received message -> ", ev.data);

            try {
                const msg: FugueMessage<StringPosition> = JSON.parse(ev.data);
                const { replicaId, operation, position, data } = msg;
                if (replicaId === fugue.replicaId()) {
                    console.log("Ignoring own message");
                    return;
                }

                console.log({
                    receivedMessage: msg,
                    remoteOperation: operation,
                    remotePosition: position,
                    remoteData: data,
                });

                fugue.effect(msg);
                const newtext = fugue.observe();
                setText(newtext);
            } catch (error) {
                console.error("Error parsing message:", error);
            }
        };

        return () => {
            fugue.ws = null;
            socketRef.current!.close();
        };
    }, []);

    const handleChange = (currentText: string, position: Position) => {
        console.log({
            currentText,
            prevText,
            cursorPos: position.position,
        });

        // Determine if INSERT or DELETE
        if (currentText.length > prevText.current.length) {
            // INSERT: find what was added
            let insertedChar = "";
            let insertIndex = 0;

            // Simple detection: find first difference
            for (let i = 0; i < currentText.length; i++) {
                if (i >= prevText.current.length || currentText[i] !== prevText.current[i]) {
                    insertedChar = currentText[i];
                    insertIndex = i;
                    break;
                }
            }

            // If not found at beginning, check at cursor position
            if (!insertedChar) {
                insertIndex = position.position - 1;
                insertedChar = currentText[insertIndex];
            }

            console.log({
                operation: "INSERT",
                index: insertIndex,
                char: insertedChar,
            });

            // Apply to CRDT
            handleInputTypes(Operation.INSERT, insertIndex, fugue, insertedChar);
        } else if (currentText.length < prevText.current.length) {
            // DELETE: find what was removed
            let deleteIndex = 0;

            for (let i = 0; i < prevText.current.length; i++) {
                if (i >= currentText.length || currentText[i] !== prevText.current[i]) {
                    deleteIndex = i;
                    break;
                }
            }

            console.log({
                operation: "DELETE",
                index: deleteIndex,
            });

            // Apply to CRDT
            handleInputTypes(
                Operation.DELETE,
                deleteIndex + 1, // deleteContentBackward logic
                fugue,
                null,
            );
        }

        // Update prev text for next comparison
        prevText.current = currentText;

        // Update display with CRDT state
        setText(fugue.observe());
    };

    useEditable(editorRef, handleChange);

    return (
        <div className="flex flex-col items-center p-4 w-full h-full">
            <h1 className="m-4 text-5xl font-bold">CRDT Editor</h1>
            <div className="w-full max-w-4xl">
                <pre
                    ref={editorRef}
                    className="p-4 w-full font-mono text-base rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80vh]"
                    style={{
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word",
                    }}
                >
                    {text.split(/\r?\n/).map((content, i, arr) => (
                        <Fragment key={i}>
                            <span>{content}</span>
                            {i < arr.length - 1 ? "\n" : null}
                        </Fragment>
                    ))}
                </pre>
            </div>
        </div>
    );
};

export default UseEditableCanvas;
