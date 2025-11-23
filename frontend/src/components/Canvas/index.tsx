import { useState, useRef, useEffect, useCallback } from "react";
import { FugueList, FugueMessage, Operation, StringPosition, StringTotalOrder } from "@cr_docs_t/dts";
import { handleInputTypes, randomString } from "../../utils";

const Canvas = () => {
    const divRef = useRef<HTMLDivElement>(null);
    const [text, setText] = useState("");
    const cursorPositionRef = useRef(0);
    const socketRef = useRef<WebSocket>(null);
    const [fugue] = useState(() => new FugueList(new StringTotalOrder(randomString(3)), null));

    const webSocketUrl = import.meta.env.VITE_WSS_URL as string;
    console.log(webSocketUrl);

    const getCursorIndex = (root: Node): number => {
        const sel = window.getSelection();
        if (!sel || !sel.anchorNode) return 0;

        let index = sel.anchorOffset;
        let node: Node | null = sel.anchorNode;

        // Sum lengths of previous siblings up to the root
        while (node && node !== root) {
            let sibling = node.previousSibling;
            while (sibling) {
                index += sibling.textContent?.length ?? 0;
                sibling = sibling.previousSibling;
            }
            node = node.parentNode;
        }

        return index;
    };

    const setCursorPosition = (element: HTMLElement, position: number) => {
        const range = document.createRange();
        const sel = window.getSelection();

        // Find the text node and position
        let currentPos = 0;
        let targetNode: Node | null = null;
        let targetOffset = 0;

        const findPosition = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const textLength = node.textContent?.length ?? 0;
                if (currentPos + textLength >= position) {
                    targetNode = node;
                    targetOffset = position - currentPos;
                    return true;
                }
                currentPos += textLength;
            } else {
                for (let i = 0; i < node.childNodes.length; i++) {
                    if (findPosition(node.childNodes[i])) return true;
                }
            }
            return false;
        };

        findPosition(element);

        if (targetNode) {
            range.setStart(targetNode, targetOffset);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    };

    const handleBeforeInput = useCallback(
        (e: InputEvent) => {
            e.preventDefault();
            if (!divRef.current) return;

            const pos = getCursorIndex(divRef.current);
            let newCursorPos = pos;

            console.log({ inputType: e.inputType, data: e.data });
            switch (e.inputType) {
                case "insertText":
                    newCursorPos = handleInputTypes(Operation.INSERT, pos, fugue, e.data);
                    break;
                case "insertParagraph":
                    newCursorPos = handleInputTypes(Operation.INSERT, pos, fugue, "\n");
                    break;
                case "deleteContentBackward":
                    newCursorPos = handleInputTypes(Operation.DELETE, pos, fugue, e.data);
                    break;
            }

            cursorPositionRef.current = newCursorPos;
            console.log({ fugue });
            setText(fugue.observe());
        },
        [fugue],
    );

    useEffect(() => {
        const el = divRef.current;
        if (!el) return;

        el.addEventListener("beforeinput", handleBeforeInput as EventListener);
        return () => el.removeEventListener("beforeinput", handleBeforeInput as EventListener);
    }, [handleBeforeInput]);

    // Sync display when FugueList changes and restore cursor
    useEffect(() => {
        if (divRef.current && divRef.current.textContent !== text) {
            divRef.current.textContent = text;
            // Restore cursor position after DOM update
            setCursorPosition(divRef.current, cursorPositionRef.current);
        }
    }, [text]);

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

                if (divRef.current) {
                    // Restore cursor position after DOM update
                    setCursorPosition(divRef.current, cursorPositionRef.current);
                }
            } catch (error) {
                console.error("Error parsing message:", error);
            }
        };

        return () => {
            fugue.ws = null;
            socketRef.current!.close();
        };
    }, []);

    return (
        <div className="flex flex-col items-center p-4 w-full h-full">
            <h1 className="m-4 text-5xl font-bold">CRDT Editor</h1>
            <div className="w-full max-w-4xl">
                <div
                    ref={divRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="p-4 w-full font-mono text-base rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80vh]"
                    style={{
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word",
                    }}
                />
            </div>
        </div>
    );
};

export default Canvas;
