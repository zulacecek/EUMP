using EUM.Core.Serialization;
using HelloPhotino.Vue.Communication;
using HelloPhotino.Vue.FileSystem;
using Photino.NET;

namespace EUM.Photino.EUMCommunication.FileSystem
{
    internal static class FileSystemCommunication
    {
        internal static ICommunicationResponse ReadDir(ICommunicationRequest request, PhotinoWindow _)
        {
            var response = new BaseCommunicationResponse(LayerCommunicationResult.NOK, request.CallerName, request.RequestId);
            var payload = JsonSerializerExtender.Deserialize<ReadDirPayload>(request.Message);
            if (payload == null)
            {
                return response;
            }


            var entries = ProcessDir(payload.Path);

            response.Message = JsonSerializerExtender.Serialize(entries);
            response.Result = LayerCommunicationResult.OK;
            return response;
        }

        internal static List<FileSystemEntry> ProcessDir(string path)
        {
            var entries = new List<FileSystemEntry>();
            var dirInfo = new DirectoryInfo(path);
            if (!dirInfo.Exists)
            {
                return entries;
            }

            foreach (var entry in dirInfo.EnumerateFileSystemInfos())
            {
                if (entry is null)
                {
                    continue;
                }

                var isDir = (entry.Attributes & FileAttributes.Directory) == FileAttributes.Directory;

                var fileSystemEntry = new FileSystemEntry
                {
                    Name = entry.Name,
                    FullPath = entry.FullName,
                    Extension = isDir ? string.Empty : entry.Extension,
                    PathWithoutFileName = entry.FullName ?? "",
                    Size = isDir ? 0 : ((FileInfo)entry).Length,
                    LastModified = new DateTimeOffset(entry.LastWriteTimeUtc).ToUnixTimeSeconds(),
                    IsDirectory = isDir
                };

                if (isDir)
                {
                    fileSystemEntry.Children = ProcessDir(entry.FullName);
                }

                entries.Add(fileSystemEntry);
            }

            return entries;
        }

        internal static ICommunicationResponse DeleteFile(ICommunicationRequest request, PhotinoWindow window)
        {
            var response = new BaseCommunicationResponse(LayerCommunicationResult.NOK, request.CallerName, request.RequestId);
            if (File.Exists(request.Message))
            {
                File.Delete(request.Message);
                response.Result = LayerCommunicationResult.OK;
            }

            return response;
        }

        internal static async Task<ICommunicationResponse> OpenFileDialogAsync(ICommunicationRequest request, PhotinoWindow window)
        {
            var response = new BaseCommunicationResponse(LayerCommunicationResult.NOK, request.CallerName, request.RequestId);
            var payload = JsonSerializerExtender.Deserialize<OpenFileDialogPayload>(request.Message);
            if (payload == null)
            {
                return response;
            }

            if (payload.SelectFolder)
            {
                var selectedFolders = await window.ShowOpenFolderAsync(defaultPath: payload.DefaultPath, multiSelect: payload.MultiSelect);
                var folderResponse = new OpenFileDialogResponse
                {
                    SelectedPaths = selectedFolders
                };

                response.Result = LayerCommunicationResult.OK;
                response.Message = JsonSerializerExtender.Serialize(folderResponse);
                return response;
            }

            (string Name, string[] Extensions)[]? filters = null;
            if (payload.AllowedExtension?.Length > 0)
            {
                filters =
                [
                    (payload.FilterName, payload.AllowedExtension)
                ];
            }

            var defaultPath = string.Empty;
            if (!string.IsNullOrEmpty(payload.DefaultPath))
            {
                defaultPath = payload.DefaultPath.Replace('/', Path.DirectorySeparatorChar);
            }

            var selectedFiles = await window.ShowOpenFileAsync(defaultPath: defaultPath, multiSelect: payload.MultiSelect, filters: filters);
            var fileResponse = new OpenFileDialogResponse
            {
                SelectedPaths = selectedFiles
            };

            response.Result = LayerCommunicationResult.OK;
            response.Message = JsonSerializerExtender.Serialize(fileResponse);
            return response;
        }

        internal static ICommunicationResponse GetUserDocumentFolder(ICommunicationRequest request, PhotinoWindow _1)
        {
            var appDocumentPath = BaseFileSystemProvider.GetAppDocumentPath();
            return new BaseCommunicationResponse(LayerCommunicationResult.OK, request.CallerName, request.RequestId)
            {
                Message = appDocumentPath
            };
        }

        internal static ICommunicationResponse GetFileMetadata(ICommunicationRequest request, PhotinoWindow _1)
        {
            var response = new BaseCommunicationResponse(LayerCommunicationResult.OK, request.CallerName, request.RequestId);
            var filePath = request.Message;

            var getFileMetadaResponse = new GetFileMetadataResponse
            {
                LastModifiedTimestamp = 0,
            };
            if (!File.Exists(filePath))
            {
                response.Message = JsonSerializerExtender.Serialize(getFileMetadaResponse);
                return response;
            }

            var fileInfo = new FileInfo(filePath);
            if (fileInfo is null)
            {
                response.Message = JsonSerializerExtender.Serialize(getFileMetadaResponse);
                return response;
            }

            getFileMetadaResponse.LastModifiedTimestamp = ((DateTimeOffset)fileInfo.LastWriteTimeUtc).ToUnixTimeSeconds();

            response.Message = JsonSerializerExtender.Serialize(getFileMetadaResponse);
            response.Result = LayerCommunicationResult.OK;

            return response;
        }
    }
}
