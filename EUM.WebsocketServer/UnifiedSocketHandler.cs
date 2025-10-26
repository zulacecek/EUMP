using EUM.Logging.Logging;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Collections.Concurrent;

namespace WebSocketFileServer.WebSocketHandlers;

public class UnifiedSocketHandler
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    private const int BufferSize = 8196;

    private readonly ConcurrentDictionary<int, UploadState> uploads = new();

    public async Task HandleAsync(WebSocket socket)
    {
        var buffer = new byte[BufferSize];

        while (socket.State == WebSocketState.Open)
        {
            var result = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

            if (result.MessageType == WebSocketMessageType.Text)
            {
                var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                var cmd = JsonSerializer.Deserialize<SocketCommand>(json, SerializerOptions);

                try
                {
                    if (cmd?.Command == "upload-file" && !string.IsNullOrEmpty(cmd.Filename) && cmd.RequestId.HasValue)
                    {
                        var filePath = cmd.Filename;
                        var directoryName = Path.GetDirectoryName(filePath);
                        if (string.IsNullOrEmpty(directoryName))
                        {
                            continue;
                        }

                        Directory.CreateDirectory(directoryName);

                        File.Delete(filePath);

                        var fs = new FileStream(filePath, FileMode.Append, FileAccess.Write);
                        uploads[cmd.RequestId.Value] = new UploadState
                        {
                            Stream = fs,
                            ExpectedSize = cmd.Size ?? 0,
                            BytesReceived = 0
                        };
                    }
                    else if (cmd?.Command == "request-file" && !string.IsNullOrEmpty(cmd.Filename) && cmd.RequestId.HasValue)
                    {
                        await SendFile(socket, cmd.Filename, cmd.RequestId.Value);
                    }
                }
                catch (Exception e)
                {
                    LogProvider.LogException(e, "WebSocket");
                }
            }
            else if (result.MessageType == WebSocketMessageType.Binary)
            {
                if (result.Count < 4) continue;

                int requestId = BitConverter.ToInt32(buffer, 0);
                var uploadBuffer = new ArraySegment<byte>(buffer, 4, result.Count - 4);

                if (uploads.TryGetValue(requestId, out var upload))
                {
                    if (upload.Stream is null)
                    {
                        continue;
                    }

                    await upload.Stream.WriteAsync(uploadBuffer);
                    upload.BytesReceived += uploadBuffer.Count;

                    if (upload.BytesReceived >= upload.ExpectedSize)
                    {
                        upload.Stream.Flush();
                        upload.Stream.Dispose();
                        uploads.TryRemove(requestId, out _);
                    }
                }
            }
            else if (result.MessageType == WebSocketMessageType.Close)
            {
                await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Client closed", CancellationToken.None);
            }
        }
    }

    private async Task SendFile(WebSocket socket, string filename, int requestId)
    {
        if (!File.Exists(filename))
        {
            var error = new
            {
                type = "error",
                requestId,
                message = $"File '{filename}' not found"
            };
            var errorJson = JsonSerializer.Serialize(error);
            var errorBytes = Encoding.UTF8.GetBytes(errorJson);
            await socket.SendAsync(errorBytes, WebSocketMessageType.Text, true, CancellationToken.None);
            return;
        }

        using var fs = new FileStream(filename, FileMode.Open, FileAccess.Read);
        var buffer = new byte[BufferSize];
        int bytesRead;

        while ((bytesRead = await fs.ReadAsync(buffer, 0, buffer.Length)) > 0)
        {
            // Prefix each binary message with requestId (4 bytes)
            var message = new byte[4 + bytesRead];
            BitConverter.GetBytes(requestId).CopyTo(message, 0);
            Buffer.BlockCopy(buffer, 0, message, 4, bytesRead);

            await socket.SendAsync(message, WebSocketMessageType.Binary, true, CancellationToken.None);
        }

        await fs.DisposeAsync();

        // Send end-of-file message (as JSON string)
        var eofMessage = JsonSerializer.Serialize(new
        {
            type = "end-of-file",
            requestId
        });

        var eofBytes = Encoding.UTF8.GetBytes(eofMessage);
        await socket.SendAsync(eofBytes, WebSocketMessageType.Text, true, CancellationToken.None);
    }

    private class UploadState
    {
        public FileStream? Stream { get; set; }
        public long ExpectedSize { get; set; }
        public long BytesReceived { get; set; }
        public string? Filename { get; set; }
    }

    private class SocketCommand
    {
        public string? Command { get; set; }
        public string? Filename { get; set; }
        public long? Size { get; set; }
        public int? RequestId { get; set; }
    }
}