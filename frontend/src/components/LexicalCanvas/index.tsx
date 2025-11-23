import { useState, useRef, useEffect, useCallback } from "react";
import { FugueList, FugueMessage, Operation, StringPosition, StringTotalOrder } from "@cr_docs_t/dts";
import { handleInputTypes, randomString } from "../../utils";

import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { TreeViewExtension, TreeViewExtensionComponent } from "@lexical/react/TreeViewExtension";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { EditorState, LexicalEditor } from "lexical";

const LexicalCanvas = () => {
    const [text, setText] = useState("");
    const socketRef = useRef<WebSocket>(null);
    const [fugue] = useState(() => new FugueList(new StringTotalOrder(randomString(10)), null));

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
                setText(fugue.observe());
            } catch (error) {
                console.error("Error parsing message:", error);
            }
        };

        return () => {
            fugue.ws = null;
            socketRef.current!.close();
        };
    }, []);

    const theme = {
        paragraph: "editor-paragraph",
    };

    const handleChange = (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => {};

    const handleError = useCallback((error: Error) => {
        console.error("Lexical Error:", error);
    }, []);

    const initialConfig = {
        namespace: "Canvas",
        theme: theme,
        onError: handleError,
    };

    return (
        <div className="flex flex-col items-center p-4 w-full h-full">
            <h1 className="m-4 text-5xl font-bold">CRDT Editor</h1>
            <div className="w-full max-w-4xl">
                <LexicalComposer initialConfig={initialConfig}>
                    <PlainTextPlugin
                        contentEditable={
                            <ContentEditable className="p-4 w-full font-mono text-base rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80vh]" />
                        }
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <AutoFocusPlugin />
                    <OnChangePlugin onChange={handleChange} />
                </LexicalComposer>
            </div>
        </div>
    );
};

export default LexicalCanvas;
