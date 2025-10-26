using EUM.Logging.Logging;
using HelloPhotino.Vue.FileSystem;
using System.Net;
using System.Web;

namespace EUM.Photino.EUMCommunication.FileSystem
{
    internal class FileServer
    {
        public static void StartFileServer()
        {
            Task.Run(() =>
            {
                var listener = new HttpListener();
                listener.Prefixes.Add("http://localhost:8080/");
                listener.Start();

                while (true)
                {
                    var context = listener.GetContext();
                    var request = context.Request;
                    var response = context.Response;
                    
                    try
                    {
                        if (request.Url is null)
                        {
                            continue;
                        }

                        string requestedFile = HttpUtility.UrlDecode(request.Url.AbsolutePath.TrimStart('/'));

                        if (requestedFile.Contains("..") || string.IsNullOrWhiteSpace(requestedFile))
                        {
                            response.StatusCode = 400;
                            response.Close();
                            continue;
                        }

                        string documentsPath = BaseFileSystemProvider.GetAppDocumentPath();
                        string filePath = Path.Combine(documentsPath, requestedFile);

                        if (File.Exists(filePath))
                        {
                            byte[] buffer = File.ReadAllBytes(filePath);
                            response.ContentType = GetContentType(filePath);
                            response.ContentLength64 = buffer.Length;
                            response.OutputStream.Write(buffer, 0, buffer.Length);
                        }
                        else
                        {
                            response.StatusCode = 404;
                        }
                    }
                    catch (Exception ex)
                    {
                        LogProvider.LogException(ex, "FileServer");
                        response.StatusCode = 500;
                    }
                    finally
                    {
                        try
                        {
                            response.OutputStream?.Close();
                        }
                        catch { }
                    }
                }
            });

            static string GetContentType(string path)
            {
                return Path.GetExtension(path).ToLower() switch
                {
                    ".jpg" or ".jpeg" => "image/jpeg",
                    ".png" => "image/png",
                    ".gif" => "image/gif",
                    ".svg" => "image/svg+xml",
                    ".html" => "text/html",
                    ".css" => "text/css",
                    ".js" => "application/javascript",
                    _ => "application/octet-stream",
                };
            }
        }
    }
}
