import { useSettingsStore } from "@/stores/settingsStore";

let ws: WebSocket;
let requestIdCounter = 0;

interface FileTransferRequest {
    chunks: Uint8Array[];
    resolve: (file: Uint8Array) => void;
    reject: (error: any) => void;
}

const pendingRequests = new Map<number, FileTransferRequest>();

export function startWebsocketConnection() {
    ws = new WebSocket("ws://localhost:5000/ws");
    ws.binaryType = "arraybuffer";

ws.onmessage = async (event) => {
    if (typeof event.data === "string") {
        try {
            const message = JSON.parse(event.data);

            const { type, requestId } = message;
            if (typeof requestId !== "number") return;

            const req = pendingRequests.get(requestId);
            if (!req) return;

            if (type === "end-of-file") {
                // Assemble final file and resolve
                const { chunks, resolve } = req;
                const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
                const result = new Uint8Array(totalLength);

                let offset = 0;
                for (const chunk of chunks) {
                    result.set(chunk, offset);
                    offset += chunk.length;
                }

                resolve(result);
                pendingRequests.delete(requestId);
            }
            else if (type === "error") {
                req.reject(new Error(message.message || "Unknown file error"));
                pendingRequests.delete(requestId);
            }
        }
        catch (e) {
            console.error("Invalid message from server:", event.data);
        }
    } else if (event.data instanceof ArrayBuffer) {
        const view = new DataView(event.data);
        const requestId = view.getUint32(0, true);
        const chunk = new Uint8Array(event.data.slice(4));

        const req = pendingRequests.get(requestId);
        if (req) {
            req.chunks.push(chunk);
        }
    }
};

    ws.onerror = (err) => {
        for (const [id, req] of pendingRequests.entries()) {
            req.reject(err);
        }
        pendingRequests.clear();
    };

    ws.onclose = () => {
        for (const [id, req] of pendingRequests.entries()) {
            req.reject(new Error("Connection closed before file was received"));
        }
        pendingRequests.clear();
    };
}

function waitForSocketConnection(socket: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
        const maxAttempts = 50;
        let attempts = 0;

        function check() {
            if (socket.readyState === WebSocket.OPEN) {
                resolve();
            } else {
                attempts++;
                if (attempts > maxAttempts) {
                    reject(new Error("WebSocket connection timeout"));
                } else {
                    setTimeout(check, 100);
                }
            }
        }

        check();
    });
}

function getNextRequestId(): number {
    return requestIdCounter++;
}

export async function requestFile(fileName: string): Promise<string> {
    if (!ws || ws.readyState === WebSocket.CLOSED) {
        startWebsocketConnection();
        await waitForSocketConnection(ws);
    } else if (ws.readyState === WebSocket.CONNECTING) {
        await waitForSocketConnection(ws);
    }

    const requestId = getNextRequestId();

    return new Promise<string>((resolve, reject) => {
        pendingRequests.set(requestId, {
            chunks: [],
            resolve: (fileBytes: Uint8Array) => {
                const decoder = new TextDecoder("utf-8");
                const text = decoder.decode(fileBytes);
                resolve(text);
            },
            reject,
        });

        ws.send(JSON.stringify({
            command: "request-file",
            fileName,
            requestId,
        }));
    });
}

export async function requestObjectFromFile<T>(fileName: string): Promise<T | undefined> {
    try {
        var fileContent = await requestFile(fileName);
    }
    catch(err) {
        return undefined;
    }

    return JSON.parse(fileContent) as T;
}

export async function saveObject(fileName: string, object: any) {
    var settingsStore = useSettingsStore();
    var modSettings = settingsStore.getModSettings();
    var objectData = '';
    if(modSettings?.beautifySavedObjects ?? false) {
        objectData = JSON.stringify(object, null, 1);
    }
    else {
        objectData = JSON.stringify(object);
    }
    
    await saveFile(fileName, objectData);
}

export async function saveFile(fileName: string, content: string | Blob) {
    const encoder = new TextEncoder();
    const data = typeof content === "string"
        ? encoder.encode(content)
        : new Uint8Array(await content.arrayBuffer());

    if (!ws || ws.readyState === WebSocket.CLOSED) {
        startWebsocketConnection();
        await waitForSocketConnection(ws);
    } else if (ws.readyState === WebSocket.CONNECTING) {
        await waitForSocketConnection(ws);
    }

    const requestId = getNextRequestId();

    ws.send(JSON.stringify({
        command: "upload-file",
        fileName,
        size: data.length,
        requestId,
    }));

    const chunkSize = 8192;
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);

        // Prepend requestId to each chunk (4 bytes)
        const chunkWithId = new Uint8Array(4 + chunk.length);
        new DataView(chunkWithId.buffer).setUint32(0, requestId, true); // little-endian
        chunkWithId.set(chunk, 4);

        ws.send(chunkWithId);
    }
}