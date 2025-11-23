import { useState, useRef, useEffect } from "react";
import { FugueList, FugueMessage, Operation, StringPosition, StringTotalOrder } from "@cr_docs_t/dts";
import { handleInputTypes, randomString } from "../../utils";
import CodeMirror, { ViewUpdate, EditorState, EditorView, EditorSelection } from "@uiw/react-codemirror";

const CodeMirrorCanvas = () => {
    const viewRef = useRef<EditorView | null>(null);
    const [text, setText] = useState("");
    const socketRef = useRef<WebSocket>(null);
    const [fugue] = useState(() => new FugueList(new StringTotalOrder(randomString(10)), null));
    const previousTextRef = useRef(""); // Track changes with ref
    const ignoreNextChangeRef = useRef(false); // Flag to ignore own updates

    const webSocketUrl = import.meta.env.VITE_WSS_URL as string;

    // WebSocket setup
    useEffect(() => {
        socketRef.current = new WebSocket(webSocketUrl);
        if (!socketRef.current) return;

        socketRef.current.onopen = () => {
            console.log("WebSocket connected");
        };

        fugue.ws = socketRef.current;

        socketRef.current.onmessage = (ev: MessageEvent) => {
            console.log("Received message:", ev.data);

            try {
                const msg: FugueMessage<StringPosition> = JSON.parse(ev.data);
                const { replicaId, operation, position, data } = msg;

                if (replicaId === fugue.replicaId()) {
                    console.log("Ignoring own message");
                    return;
                }

                console.log({ receivedMessage: msg });

                // Apply remote operation
                fugue.effect(msg);
                const newText = fugue.observe();

                // Set flag to ignore the onChange that will fire
                ignoreNextChangeRef.current = true;

                // Update CodeMirror programmatically
                if (viewRef.current) {
                    const view = viewRef.current;

                    // Create a transaction using the state's tr builder
                    const tr = view.state.update({
                        changes: {
                            from: 0,
                            to: view.state.doc.length,
                            insert: newText,
                        },
                        selection: EditorSelection.cursor(Math.min(view.state.selection.main.from, newText.length)),
                    });

                    view.dispatch(tr);
                    previousTextRef.current = newText;
                }
            } catch (error) {
                console.error("Error processing remote message:", error);
            }
        };

        return () => {
            fugue.ws = null;
            socketRef.current?.close();
        };
    }, [fugue]);

    /**
     * Handle changes from CodeMirror
     */
    const handleChange = (value: string, viewUpdate: ViewUpdate) => {
        if (ignoreNextChangeRef.current) {
            ignoreNextChangeRef.current = false;
            return;
        }

        // Get the actual changes from viewUpdate
        const oldText = previousTextRef.current;
        const newText = value;

        console.log({
            oldText,
            newText,
            docChanged: viewUpdate.docChanged,
        });

        if (!viewUpdate.docChanged) return;

        // Detect operation type by comparing text
        if (newText.length > oldText.length) {
            // INSERT: find what was added
            let insertIndex = 0;
            let insertedText = "";

            for (let i = 0; i < newText.length; i++) {
                if (i >= oldText.length || newText[i] !== oldText[i]) {
                    insertIndex = i;
                    insertedText = newText[i];
                    break;
                }
            }

            // If not found at start, was added at end or middle
            if (!insertedText) {
                insertIndex = oldText.length;
                insertedText = newText.substring(oldText.length);
            }

            console.log({
                operation: "INSERT",
                index: insertIndex,
                text: insertedText,
            });

            // Apply to CRDT (one character at a time for proper CRDT semantics)
            for (let i = 0; i < insertedText.length; i++) {
                handleInputTypes(Operation.INSERT, insertIndex + i, fugue, insertedText[i]);
            }
        } else if (newText.length < oldText.length) {
            // DELETE: find what was removed
            let deleteIndex = 0;

            for (let i = 0; i < oldText.length; i++) {
                if (i >= newText.length || newText[i] !== oldText[i]) {
                    deleteIndex = i;
                    break;
                }
            }

            const deletedCount = oldText.length - newText.length;

            console.log({
                operation: "DELETE",
                index: deleteIndex,
                count: deletedCount,
            });

            // Apply deletes to CRDT (one at a time)
            for (let i = 0; i < deletedCount; i++) {
                handleInputTypes(Operation.DELETE, deleteIndex + 1, fugue, null);
            }
        }

        previousTextRef.current = newText;
        setText(newText);
    };

    return (
        <div className="flex flex-col items-center p-4 w-full h-full">
            <h1 className="m-4 text-5xl font-bold">CRDT Editor</h1>
            <div className="w-full max-w-4xl">
                <CodeMirror
                    onCreateEditor={(view) => {
                        viewRef.current = view; // ✅ Store EditorView reference
                    }}
                    value={text}
                    onChange={handleChange}
                    className="rounded-lg border-2 shadow-sm"
                />
            </div>
        </div>
    );
};

export default CodeMirrorCanvas;
