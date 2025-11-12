import { useState, useRef, useEffect, useCallback } from "react";
import { FugueList } from "@cr_docs_t/dts";
import { StringTotalOrder } from "@cr_docs_t/dts";

const Canvas = () => {
    const divRef = useRef<HTMLDivElement>(null);
    const [fugue] = useState(() => new FugueList(new StringTotalOrder("test")));
    const [text, setText] = useState("");
    const cursorPositionRef = useRef(0);

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

            switch (e.inputType) {
                case "insertText":
                    if (e.data) {
                        fugue.insert(pos, e.data);
                        newCursorPos = pos + e.data.length;
                    }
                    break;

                case "deleteContentBackward":
                    if (pos > 0) {
                        fugue.delete(pos - 1);
                        newCursorPos = pos - 1;
                    }
                    break;

                case "deleteContentForward":
                    fugue.delete(pos);
                    newCursorPos = pos;
                    break;

                default:
                    console.log("Unhandled input type:", e.inputType);
                    return;
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
        if (divRef.current && divRef.current.innerText !== text) {
            divRef.current.innerText = text;
            // Restore cursor position after DOM update
            setCursorPosition(divRef.current, cursorPositionRef.current);
        }
    }, [text]);

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
