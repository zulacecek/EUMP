using EUM.Core;
using EUM.Core.Context;
using EUM.Core.Serialization;
using EUM.Photino.EUMCommunication.Object;
using HelloPhotino.Vue.Communication;
using Photino.NET;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace EUM.Photino.EUMCommunication.System
{
    internal static class SystemCommunication
    {
        internal static void ConfirmClose(PhotinoWindow window)
        {
            var mesage = new BaseCommunicationResponse(LayerCommunicationResult.OK, "ConfirmClose", "1");

            window.SendWebMessage(JsonSerializerExtender.Serialize(mesage));
        }

        internal static ICommunicationResponse CloseApp(ICommunicationRequest request, PhotinoWindow window)
        {
            var response = new BaseCommunicationResponse(LayerCommunicationResult.OK, request.CallerName, request.RequestId);
            EditorContext.ForceClose = true;
            window.Close();

            return response;
        }

        internal static ICommunicationResponse CheckAvailableEditors(ICommunicationRequest request, PhotinoWindow _)
        {
            var response = new BaseCommunicationResponse(LayerCommunicationResult.NOK, request.CallerName, request.RequestId);
            var payload = JsonSerializerExtender.Deserialize<CheckAvailableEditorsPayload>(request.Message);
            if (payload == null)
            {
                return response;
            }

            var availableEditors = new List<string>();
            foreach (var command in payload.Editors)
            {
                if (!CoreService.IsCommandAvailable(command))
                {
                    continue;
                }

                availableEditors.Add(command);
            }

            response.Result = LayerCommunicationResult.OK;
            response.Message = JsonSerializerExtender.Serialize(availableEditors);

            return response;
        }

        internal static ICommunicationResponse OpenFolder(ICommunicationRequest request, PhotinoWindow _)
        {
            var response = new BaseCommunicationResponse(LayerCommunicationResult.NOK, request.CallerName, request.RequestId);
            var folderPath = request.Message;
            if (!Directory.Exists(folderPath))
            {
                return response;
            }

            folderPath = folderPath.Replace('/', Path.DirectorySeparatorChar);
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                Process.Start("explorer", folderPath);
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            {
                Process.Start("xdg-open", folderPath);
            }
            else
            {
                return response;
            }

            response.Result = LayerCommunicationResult.OK;
            return response;
        }
    }
}
