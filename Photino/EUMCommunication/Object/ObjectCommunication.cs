using EUM.Core.Context;
using EUM.Core.Serialization;
using EUM.EU4Parser.ObjectExport;
using EUM.Logging.Logging;
using HelloPhotino.Vue.Communication;
using Photino.NET;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace EUM.Photino.EUMCommunication.Object
{
    internal class ObjectCommunication
    {
        internal static ICommunicationResponse OpenMod(ICommunicationRequest request, PhotinoWindow _)
        {
            var response = new BaseCommunicationResponse(LayerCommunicationResult.NOK, request.CallerName, request.RequestId);
            var payload = JsonSerializerExtender.Deserialize<OpenModPayload>(request.Message);
            if (payload == null)
            {
                return response;
            }

            response.Result = LayerCommunicationResult.OK;
            EditorContext.OpenedMod = payload.Mod;

            return response;
        }

        internal static ICommunicationResponse OpenModSettings(ICommunicationRequest request, PhotinoWindow _)
        {
            var response = new BaseCommunicationResponse(LayerCommunicationResult.NOK, request.CallerName, request.RequestId);
            var payload = JsonSerializerExtender.Deserialize<ModSettings>(request.Message);
            if (payload == null)
            {
                return response;
            }

            EditorContext.ModSettings = payload;
            response.Result = LayerCommunicationResult.OK;
            return response;
        }

        internal static ICommunicationResponse ExportMod(ICommunicationRequest request, PhotinoWindow _)
        {
            var response = new BaseCommunicationResponse(LayerCommunicationResult.NOK, request.CallerName, request.RequestId);

            MissionTreeExporter.LoadAndExportMissionTrees();
            LocalisationExporter.LoadAndExportLanguagelocalisations();
            ModDescriptorExporter.GenerateAndExportModFiles();

            response.Result = LayerCommunicationResult.OK;
            return response;
        }

        internal static ICommunicationResponse OpenExternalEditor(ICommunicationRequest request, PhotinoWindow _)
        {
            var response = new BaseCommunicationResponse(LayerCommunicationResult.NOK, request.CallerName, request.RequestId);
            var payload = JsonSerializerExtender.Deserialize<OpenExternalEditorPayload>(request.Message);
            if (payload == null || !File.Exists(payload.PathToFile))
            {
                return response;
            }

            var isWindows = RuntimeInformation.IsOSPlatform(OSPlatform.Windows);
            var command = payload.EditorCommand;
            if (payload.EditorCommand == "default" || string.IsNullOrEmpty(payload.EditorCommand))
            {
                if (isWindows)
                {
                    // Windows tries to pick which is the default app for the extension
                    command = "";
                }
                else
                {
                    command = "xdg-open";
                }
            }

            try
            {
                if (string.IsNullOrEmpty(command))
                {

                    Process.Start(new ProcessStartInfo
                    {
                        FileName = payload.PathToFile,
                        UseShellExecute = isWindows
                    });
                }
                else
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = command,
                        Arguments = $"\"{payload.PathToFile}\"",
                        UseShellExecute = isWindows
                    });
                }

                response.Result = LayerCommunicationResult.OK;
            }
            catch (Exception ex)
            {
                LogProvider.LogException(ex, "OpenExternalEditor");
            }

            return response;
        }
    }
}
